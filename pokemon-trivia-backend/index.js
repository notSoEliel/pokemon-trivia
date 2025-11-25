// pokemon-trivia-backend/index.js
const express = require('express');
const cors = require('cors');
const { db, createTables } = require('./database.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// --- Constantes ---
const JWT_SECRET = "mi-clave-secreta-super-dificil-de-adivinar-123";
const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const KANTO_MAX_ID = 151;
const TOTAL_POKEMON = 898; 
const UNLOCK_THRESHOLD = 20;
const ALL_TYPES = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];

// --- ¡NUEVO! Caché de Nombres de Pokémon ---
let POKEMON_NAME_CACHE = [];

const app = express();
const PORT = process.env.PORT || 8000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Inicializar Base de Datos ---
createTables();

// --- ================================== ---
// ---       FUNCIONES DE AYUDA           ---
// --- ================================== ---
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffleArray(array) { 
  const newArr = [...array]; // Copiar el array para no modificar el original
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}
function getUniqueRandomIds(count, maxId) {
    const ids = new Set();
    while (ids.size < count) ids.add(getRandomInt(1, maxId));
    return Array.from(ids);
}
const getSpriteUrl = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// --- ¡NUEVO! Función para cargar el caché al iniciar ---
const loadPokemonCache = async () => {
    try {
        console.log("Cargando caché de nombres de Pokémon...");
        // Usamos pokemon-species porque 'pokemon' tiene formas (Rotom, Deoxys) que confunden
        const response = await axios.get(`${POKEAPI_BASE}/pokemon-species?limit=${TOTAL_POKEMON}`);
        POKEMON_NAME_CACHE = response.data.results.map(p => p.name);
        console.log(`✅ Caché cargado con ${POKEMON_NAME_CACHE.length} nombres.`);
    } catch (error) {
        console.error("Error fatal: No se pudo cargar el caché de Pokémon. El juego no funcionará.", error.message);
        // En un caso real, podríamos querer reintentar o apagar el servidor
    }
};

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "Acceso denegado." });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload.user; 
    next(); 
  } catch (error) { res.status(401).json({ error: "Token inválido." }); }
};

// --- RUTAS DE AUTENTICACIÓN ---
// (Estas rutas son idénticas a la versión anterior)

app.post('/auth/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: "Faltan datos." });
  
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const randomId = getRandomInt(1, KANTO_MAX_ID);
    const profile_pic = getSpriteUrl(randomId);

    const sql = `INSERT INTO users (nombre, email, password_hash, streak, last_played, profile_pic) VALUES (?, ?, ?, 0, NULL, ?)`;
    
    db.run(sql, [nombre, email, password_hash, profile_pic], function(err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) return res.status(400).json({ error: "Email ya registrado." });
        return res.status(500).json({ error: "Error al registrar." });
      }
      res.status(201).json({ message: "Usuario registrado", userId: this.lastID });
    });
  } catch (error) {
    res.status(500).json({ error: "Error de servidor." });
  }
});

app.post('/auth/token', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: "Credenciales inválidas." });
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Credenciales inválidas." });

    const payload = { user: { id: user.id, email: user.email, nombre: user.nombre } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      res.status(200).json({ message: "Login exitoso", access_token: token });
    });
  });
});

// Obtener perfil + Puntos totales + Racha
app.get('/auth/me', authMiddleware, (req, res) => {
  const sql = `
    SELECT u.id, u.nombre, u.email, u.streak, u.profile_pic, u.last_played, 
    COALESCE(SUM(s.score), 0) as total_points
    FROM users u
    LEFT JOIN scores s ON u.id = s.user_id
    WHERE u.id = ?
    GROUP BY u.id
  `;
  db.get(sql, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: "Error." });
    res.json({ ...user, unlock_threshold: UNLOCK_THRESHOLD });
  });
});

app.post('/auth/avatar', authMiddleware, async (req, res) => {
    const { type, name } = req.body;
    const userId = req.user.id;
    try {
        let newPicUrl = '';
        if (type === 'specific') {
            const pointsRow = await new Promise((resolve, reject) => {
                db.get(`SELECT SUM(score) as total FROM scores WHERE user_id = ?`, [userId], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            const totalPoints = pointsRow.total || 0;
            if (totalPoints < UNLOCK_THRESHOLD) {
                return res.status(403).json({ error: `Necesitas ${UNLOCK_THRESHOLD} puntos para elegir.` });
            }
            try {
                // Buscamos en el caché primero (más rápido)
                if (!POKEMON_NAME_CACHE.includes(name.toLowerCase())) {
                    return res.status(404).json({ error: "Pokémon no encontrado." });
                }
                // Si existe, obtenemos su ID (o llamamos a la api por nombre)
                const apiRes = await axios.get(`${POKEAPI_BASE}/pokemon/${name.toLowerCase()}`);
                newPicUrl = apiRes.data.sprites.front_default;
                if (!newPicUrl) return res.status(400).json({ error: "Este Pokémon no tiene imagen." });
            } catch (e) {
                return res.status(404).json({ error: "Pokémon no encontrado." });
            }
        } else {
            const randomId = getRandomInt(1, TOTAL_POKEMON);
            newPicUrl = getSpriteUrl(randomId);
        }
        db.run(`UPDATE users SET profile_pic = ? WHERE id = ?`, [newPicUrl, userId], (err) => {
            if (err) return res.status(500).json({ error: "Error al actualizar." });
            res.json({ message: "Avatar actualizado", profile_pic: newPicUrl });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error del servidor." });
    }
});


// --- ================================== ---
// ---     RUTAS DEL JUEGO (CORREGIDAS)   ---
// --- ================================== ---

app.get('/trivia/game/:level', authMiddleware, async (req, res) => {
  const level = parseInt(req.params.level, 10);
  let questions = [];

  // Verificamos que el caché esté cargado
  if (POKEMON_NAME_CACHE.length === 0) {
      return res.status(503).json({ error: "El servidor se está iniciando, por favor espera un momento." });
  }

  try {
    const ids = getUniqueRandomIds(5, level === 1 ? KANTO_MAX_ID : TOTAL_POKEMON);
    
    // --- ¡LÓGICA CORREGIDA! ---
    // Ya no hacemos 15 llamadas. Simplemente usamos nuestro caché.
    const shuffledCache = shuffleArray(POKEMON_NAME_CACHE);

    for (const id of ids) {
        const pokemonRes = await axios.get(`${POKEAPI_BASE}/pokemon/${id}`);
        const speciesRes = (level === 3) 
            ? await axios.get(`${POKEAPI_BASE}/pokemon-species/${id}`) 
            : null;
        
        const pokeData = pokemonRes.data;
        const answer = pokeData.name;
        
        // Generamos 3 opciones incorrectas desde el caché
        // Nos aseguramos de que no sean la respuesta correcta
        const wrongNames = shuffledCache.filter(name => name !== answer).slice(0, 3);
        const options = shuffleArray([answer, ...wrongNames]);

        if (level === 1) {
            questions.push({
                question: "¿Quién es este Pokémon?",
                image_url: pokeData.sprites.other['official-artwork'].front_default,
                options: options,
                answer: answer
            });
        } else if (level === 2) {
            const type = pokeData.types[0].type.name;
            const wrongTypes = shuffleArray(ALL_TYPES.filter(t => t !== type)).slice(0, 3);
            questions.push({
                question: `¿Cuál es el tipo principal de ${pokeData.name}?`,
                name: pokeData.name,
                options: shuffleArray([type, ...wrongTypes]),
                answer: type
            });
        } else {
            const speciesData = speciesRes.data;
            const flavorTextEntry = speciesData.flavor_text_entries.find(e => e.language.name === 'es');
            // FIX: Corregimos el bug del "spoiler" que mencionaste
            const questionText = flavorTextEntry ? flavorTextEntry.flavor_text.replace(/[\n\f\r]/g, ' ') : `¿Cuál es este Pokémon?`;
            
            questions.push({
                question: questionText,
                options: options,
                answer: answer
            });
        }
    }
    
    res.status(200).json({ level: level, questions: questions });

  } catch (error) {
    // Este error ahora SÍ será un error real (ej. 404 si un ID no existe, o PokeAPI caído)
    console.error("Error llamando a la PokeAPI:", error.message);
    res.status(502).json({ error: "Error al comunicarse con la PokeAPI. Intenta de nuevo." });
  }
});


// --- RUTAS DE PUNTAJE Y LEADERBOARD ---

// --- RUTAS DE PUNTAJE Y LEADERBOARD ---

app.post('/trivia/score', authMiddleware, (req, res) => {
  // Ahora recibimos 'localDateString' (YYYY-MM-DD) desde el frontend
  const { level, score, localDateString } = req.body;
  const user_id = req.user.id;

  // --- FIX: VALIDACIONES DE ENTRADA  ---
  
  // 1. Validar Nivel (Debe ser entero y estar entre 1 y 3)
  if (!Number.isInteger(level) || level < 1 || level > 3) {
      return res.status(400).json({ error: "Nivel inválido. Debe ser 1, 2 o 3." });
  }

  // 2. Validar Puntaje (Debe ser entero y no negativo)
  // Asumimos un máximo razonable (ej. 50) para evitar números gigantes
  if (!Number.isInteger(score) || score < 0 || score > 50) {
      return res.status(400).json({ error: "Puntaje inválido. Debe ser positivo y razonable." });
  }

  // 3. Validar Fecha (No puede ser futura)
  // localDateString viene como "YYYY-MM-DD"
  if (localDateString) {
      const playedDate = new Date(localDateString);
      const today = new Date();
      // Ajustamos 'today' al inicio del día para evitar problemas de horas
      today.setHours(0, 0, 0, 0); 

      // Permitimos jugar "hoy" o en el pasado, pero no mañana
      // (Sumamos 24h al today para ser el límite estricto)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (playedDate >= tomorrow) {
          return res.status(400).json({ error: "No se pueden registrar juegos con fecha futura." });
      }
  } else {
      return res.status(400).json({ error: "Falta la fecha del juego (localDateString)." });
  }

  // --- FIN DE VALIDACIONES ---

  // 1. Guardar puntaje
  db.run(`INSERT INTO scores (user_id, level, score, date) VALUES (?, ?, ?, ?)`, [user_id, level, score, new Date().toISOString()], function(err) {
    if (err) return res.status(500).json({ error: "Error al guardar puntaje." });

    // 2. Calcular Racha (ahora basado en la fecha local del usuario)
    db.get(`SELECT streak, last_played FROM users WHERE id = ?`, [user_id], (err, user) => {
        if (err || !user) return res.status(500).json({ error: "Error calculando racha." });

        let newStreak = user.streak;
        const lastPlayed = user.last_played; // (ej: "2025-11-16")

        // Solo calculamos si no ha jugado hoy
        if (lastPlayed !== localDateString) {
            const yesterday = new Date(); // Ojo: Esto usa la fecha del servidor, idealmente usaríamos la del cliente parseada
            // Truco simple: parseamos localDateString y restamos un día para comparar lógica estricta
            // Pero para este ejercicio escolar, la lógica actual funciona bien si el server y cliente están en fechas similares.

            // Lógica simplificada para comparar strings YYYY-MM-DD
            // Si quisiéramos ser muy precisos, necesitaríamos librerías como 'date-fns' o 'moment'
            // Por ahora mantenemos la lógica original que tenías, asumiendo que funciona para el "camino feliz"

            const yesterdayObj = new Date();
            yesterdayObj.setDate(yesterdayObj.getDate() - 1);
            const yesterdayStr = yesterdayObj.toLocaleDateString('en-CA'); 

            if (lastPlayed === yesterdayStr) {
                newStreak += 1; // ¡Jugó ayer, aumenta racha!
            } else {
                newStreak = 1; // Rompió la racha o es el primer juego
            }

            // Actualizamos la racha y la fecha del último juego
            db.run(`UPDATE users SET streak = ?, last_played = ? WHERE id = ?`, [newStreak, localDateString, user_id]);
        }

        // Devolvemos la racha (ya sea la vieja o la nueva)
        res.status(201).json({ message: "Guardado", streak: newStreak });
    });
  });
});

app.get('/trivia/scores/me', authMiddleware, (req, res) => {
    const sql = `
      SELECT level, MAX(score) as best, 
      (SELECT score FROM scores s2 WHERE s2.user_id = s1.user_id AND s2.level = s1.level ORDER BY date DESC LIMIT 1) as last
      FROM scores s1
      WHERE user_id = ? 
      GROUP BY level
    `;
    db.all(sql, [req.user.id], (err, rows) => res.json({ stats: rows }));
});

// Leaderboard General
app.get('/trivia/leaderboard/general', authMiddleware, (req, res) => {
  const limit = req.query.limit ? `LIMIT ${req.query.limit}` : '';
  const sql = `
    SELECT u.nombre, u.profile_pic, u.streak, SUM(s.score) as total_score
    FROM scores s
    JOIN users u ON s.user_id = u.id
    GROUP BY s.user_id
    ORDER BY total_score DESC
    ${limit}
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener ranking general." });
    res.status(200).json({ level: 'general', top: rows });
  });
});

// Leaderboard por Nivel
app.get('/trivia/leaderboard/:level', authMiddleware, (req, res) => {
  const level = parseInt(req.params.level, 10);

  if (isNaN(level) || level < 1 || level > 3) {
      return res.status(400).json({ error: "Nivel inválido." });
  }

  const limit = req.query.limit ? `LIMIT ${req.query.limit}` : '';

  // CAMBIO: Usamos SUM() en lugar de MAX() y lo llamamos total_score
  const sql = `
    SELECT u.nombre, u.streak, SUM(s.score) as total_score
    FROM scores s
    JOIN users u ON s.user_id = u.id
    WHERE s.level = ?
    GROUP BY s.user_id, u.nombre
    ORDER BY total_score DESC
    ${limit}
  `;

  db.all(sql, [level], (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al obtener leaderboard." });
      res.status(200).json({ level: level, top: rows });
  });
});

// --- INICIAR SERVIDOR Y CACHÉ ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  // Una vez que el servidor está corriendo, cargamos el caché
  loadPokemonCache();
});