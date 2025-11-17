// Importar las bibliotecas
const express = require('express');
const cors = require('cors');
const { db, createTables } = require('./database.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Importamos Axios

// --- Constantes ---
const JWT_SECRET = "mi-clave-secreta-super-dificil-de-adivinar-123";
const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const KANTO_MAX_ID = 151; // Para Nivel 1
const TOTAL_POKEMON = 898; // Para Nivel 2 y 3
const ALL_TYPES = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

// Inicializar la aplicación Express
const app = express();
const PORT = 8000;

// --- Middlewares ---
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

// --- Inicializar Base de Datos ---
createTables();

// --- ================================== ---
// ---       FUNCIONES DE AYUDA           ---
// --- ================================== ---

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getUniqueRandomIds(count, maxId) {
    const ids = new Set();
    while (ids.size < count) {
        ids.add(getRandomInt(1, maxId));
    }
    return Array.from(ids);
}

// --- ================================== ---
// ---    MIDDLEWARE DE AUTENTICACIÓN     ---
// --- ================================== ---

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Acceso denegado. No se proveyó un token." });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload.user; 
    next(); 
  } catch (error) {
    res.status(401).json({ error: "Token inválido." });
  }
};

// --- ================================== ---
// ---    RUTAS DE AUTENTICACIÓN (PASO 3) ---
// --- ================================== ---

app.post('/auth/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Nombre, email y password son requeridos." });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const sql = `INSERT INTO users (nombre, email, password_hash) VALUES (?, ?, ?)`;
    
    db.run(sql, [nombre, email, password_hash], function(err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ error: "El email ya está registrado." });
        }
        console.error(err.message);
        return res.status(500).json({ error: "Error al registrar el usuario." });
      }
      res.status(201).json({
        message: "Usuario registrado con éxito",
        userId: this.lastID,
        nombre: nombre,
        email: email
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor al hashear la contraseña." });
  }
});

app.post('/auth/token', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email y password son requeridos." });
  }
  const sql = `SELECT * FROM users WHERE email = ?`;
  
  db.get(sql, [email], async (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Error del servidor al buscar usuario." });
    }
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }
    try {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: "Credenciales inválidas." });
      }
      const payload = { user: { id: user.id, email: user.email, nombre: user.nombre } };
      jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
        if (err) throw err;
        res.status(200).json({
          message: "Login exitoso",
          access_token: token,
          token_type: "bearer"
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error en el servidor al comparar contraseñas." });
    }
  });
});


// --- ================================== ---
// ---     RUTAS DEL JUEGO (PASO 4)       ---
// --- ================================== ---

/**
 * Ruta para obtener 5 preguntas de trivia (RF-03, RF-04)
 * Protegida por el middleware 'authMiddleware'
 */
app.get('/trivia/game/:level', authMiddleware, async (req, res) => {
  const level = parseInt(req.params.level, 10);
  let questions = [];

  try {
    // 5 preguntas
    const ids = getUniqueRandomIds(5, level === 1 ? KANTO_MAX_ID : TOTAL_POKEMON);
    
    // Obtenemos 15 nombres aleatorios extra para las opciones
    const optionIds = getUniqueRandomIds(15, level === 1 ? KANTO_MAX_ID : TOTAL_POKEMON);
    const optionNames = (await Promise.all(
        optionIds.map(id => axios.get(`${POKEAPI_BASE}/pokemon/${id}`))
    )).map(p => p.data.name);

    let optionPool = [...optionNames]; // Creamos una copia
    
    // Iteramos por cada ID y creamos la pregunta
    for (const id of ids) {
        
        // 1. Preparamos las llamadas a la API
        const pokemonPromise = axios.get(`${POKEAPI_BASE}/pokemon/${id}`);
        const speciesPromise = (level === 3) 
            ? axios.get(`${POKEAPI_BASE}/pokemon-species/${id}`) 
            : Promise.resolve(null); // No la necesitamos para Nivel 1 o 2

        // 2. Esperamos a que ambas terminen
        //    *** AQUÍ ESTABA EL ERROR ***
        //    La lógica anterior era incorrecta. Esta es la forma segura.
        const [pokemonResponse, speciesResponse] = await Promise.all([
            pokemonPromise, 
            speciesPromise
        ]);

        // 3. Extraemos los datos (ahora 'pokemonResponse' SÍ existe)
        const pokeData = pokemonResponse.data;
        const answer = pokeData.name;
        
        // 4. Generamos las 3 opciones incorrectas
        const options = shuffleArray([
            answer,
            optionPool.pop(),
            optionPool.pop(),
            optionPool.pop()
        ]);

        // 5. Construimos la pregunta según el nivel
        if (level === 1) { // Nivel 1: Adivina por imagen
            questions.push({
                question: "¿Quién es este Pokémon?",
                image_url: pokeData.sprites.other['official-artwork'].front_default,
                options: options,
                answer: answer
            });
        } else if (level === 2) { // Nivel 2: Adivina por tipo
            const type = pokeData.types[0].type.name;
            const wrongTypes = shuffleArray(ALL_TYPES.filter(t => t !== type)).slice(0, 3);
            questions.push({
                question: `¿Cuál es el tipo principal de ${pokeData.name}?`,
                name: pokeData.name,
                options: shuffleArray([type, ...wrongTypes]),
                answer: type
            });
        } else { // Nivel 3: Adivina por Pokédex
            // 'speciesResponse' SÍ existe y no es null
            const speciesData = speciesResponse.data;
            const flavorTextEntry = speciesData.flavor_text_entries.find(e => e.language.name === 'es');
            // Limpiamos el texto de saltos de línea
            const questionText = flavorTextEntry ? flavorTextEntry.flavor_text.replace(/[\n\f\r]/g, ' ') : `¿Qué Pokémon es ${pokeData.name}?`;
            
            questions.push({
                question: questionText,
                options: options,
                answer: answer
            });
        }
    }
    
    res.status(200).json({ level: level, questions: questions });

  } catch (error) {
    console.error("Error llamando a la PokeAPI:", error.message);
    res.status(502).json({ error: "Error al comunicarse con la PokeAPI. Intenta de nuevo." });
  }
});


/**
 * Ruta para guardar un puntaje (RF-05)
 * Protegida por el middleware 'authMiddleware'
 */
app.post('/trivia/score', authMiddleware, (req, res) => {
  const { level, score } = req.body;
  const user_id = req.user.id; // Obtenemos el ID del token verificado

  if (level === undefined || score === undefined) {
    return res.status(400).json({ error: "Level y score son requeridos." });
  }

  const sql = `INSERT INTO scores (user_id, level, score) VALUES (?, ?, ?)`;
  db.run(sql, [user_id, level, score], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Error al guardar el puntaje." });
    }
    res.status(201).json({ 
        message: "Puntaje guardado", 
        scoreId: this.lastID 
    });
  });
});

/**
 * Ruta para obtener los mejores puntajes del usuario (RF-06)
 * Protegida por el middleware 'authMiddleware'
 */
app.get('/trivia/scores/me', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  
  const sql = `
    SELECT level, MAX(score) as best
    FROM scores 
    WHERE user_id = ? 
    GROUP BY level
  `;

  db.all(sql, [user_id], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Error al obtener puntajes." });
    }
    res.status(200).json({ bestByLevel: rows });
  });
});

/**
 * Ruta para obtener el leaderboard (Top 5) (RF-06)
 * Protegida por el middleware 'authMiddleware'
 */
app.get('/trivia/leaderboard/:level', authMiddleware, (req, res) => {
  const level = parseInt(req.params.level, 10);
  
  const sql = `
    SELECT u.nombre, MAX(s.score) as best
    FROM scores s
    JOIN users u ON s.user_id = u.id
    WHERE s.level = ?
    GROUP BY s.user_id, u.nombre
    ORDER BY best DESC
    LIMIT 5
  `;

  db.all(sql, [level], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Error al obtener leaderboard." });
    }
    res.status(200).json({ level: level, top: rows });
  });
});


// --- Iniciar el Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});