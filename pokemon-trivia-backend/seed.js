const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Conectar a la base de datos
const dbPath = path.resolve(__dirname, 'database.sqlite3');
const db = new sqlite3.Database(dbPath);

// Datos falsos (Entrenadores Famosos) con sus fotos de perfil
const FAKE_USERS = [
    { 
        nombre: "Ash Ketchum", 
        email: "ash@kanto.com", 
        pass: "123", 
        streak: 5, 
        points: 50, // Simulamos puntos para que desbloquee avatar
        pic: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" // Pikachu
    },
    { 
        nombre: "Misty", 
        email: "misty@cerulean.com", 
        pass: "123", 
        streak: 2, 
        points: 15,
        pic: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png" // Psyduck
    },
    { 
        nombre: "Brock", 
        email: "brock@pewter.com", 
        pass: "123", 
        streak: 10, 
        points: 30,
        pic: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/95.png" // Onix
    },
    { 
        nombre: "Gary Oak", 
        email: "gary@pallet.com", 
        pass: "123", 
        streak: 0, 
        points: 5,
        pic: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png" // Eevee
    },
    { 
        nombre: "Cynthia", 
        email: "cynthia@sinnoh.com", 
        pass: "123", 
        streak: 25, 
        points: 100,
        pic: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/445.png" // Garchomp
    },
    { 
        nombre: "Team Rocket", 
        email: "rocket@team.com", 
        pass: "123", 
        streak: 0, 
        points: 0,
        pic: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png" // Meowth
    },
];

async function seed() {
    console.log("🌱 Sembrando base de datos...");

    // --- PASO 0: CREAR TABLAS (Por si no existen en Render) ---
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        streak INTEGER DEFAULT 0,
        last_played TEXT,
        profile_pic TEXT
      )
    `);
    
    await run(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        level INTEGER NOT NULL,
        score INTEGER NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // 1. Limpiar tablas existentes (para empezar limpio)
    await run("DELETE FROM scores");
    await run("DELETE FROM users");
    
    // Reiniciar contadores de ID
    await run("DELETE FROM sqlite_sequence WHERE name='users'");
    await run("DELETE FROM sqlite_sequence WHERE name='scores'");

    // 2. Insertar Usuarios
    for (const user of FAKE_USERS) {
        const hash = await bcrypt.hash(user.pass, 10);
        // Ponemos 'last_played' como hoy para que la racha sea válida
        const today = new Date().toISOString(); 
        
        // Insertamos incluyendo 'profile_pic'
        const userId = await insert(
            `INSERT INTO users (nombre, email, password_hash, streak, last_played, profile_pic) VALUES (?, ?, ?, ?, ?, ?)`,
            [user.nombre, user.email, hash, user.streak, today, user.pic]
        );
        console.log(`✅ Usuario creado: ${user.nombre} (ID: ${userId})`);

        // 3. Insertar Puntajes Aleatorios para este usuario
        // Calculamos cuántos juegos necesita para tener esos puntos aproximados
        const numGames = Math.max(3, Math.floor(user.points / 3)); 
        
        for (let i = 0; i < numGames; i++) {
            const level = Math.floor(Math.random() * 3) + 1; // Nivel 1, 2 o 3
            // Puntaje aleatorio entre 0 y 5
            const score = Math.floor(Math.random() * 6); 
            
            await run(
                `INSERT INTO scores (user_id, level, score, date) VALUES (?, ?, ?, ?)`,
                [userId, level, score, new Date().toISOString()]
            );
        }
        console.log(`   ↳ Agregados ${numGames} puntajes.`);
    }

    console.log("✨ ¡Semilla completada! Base de datos lista.");
    console.log("➡️  Puedes iniciar sesión como 'ash@kanto.com' (pass: 123)");
    db.close();
}

// Funciones auxiliares para usar Promesas con SQLite
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err); else resolve(this);
        });
    });
}

function insert(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err); else resolve(this.lastID);
        });
    });
}

seed();