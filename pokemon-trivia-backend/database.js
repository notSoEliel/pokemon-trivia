// Importar la biblioteca sqlite3
const sqlite3 = require('sqlite3').verbose();

// Nombre del archivo de la base de datos
const DBSOURCE = "database.sqlite3";

// Conectar a la base de datos (o crearla si no existe)
const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // No se pudo abrir la base de datos
    console.error(err.message);
    throw err;
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Función para crear las tablas
const createTables = () => {
  // Usamos .serialize para asegurar que los comandos se ejecuten en orden
  db.serialize(() => {
    
    // Comando SQL para crear la tabla de usuarios
    // (Cumple con RF-01: nombre, email, password)
    const createUserTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
      )
    `;
    
    // Comando SQL para crear la tabla de puntajes
    // (Cumple con RF-05 y RF-06)
    const createScoreTable = `
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        level INTEGER NOT NULL,
        score INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `;

    // Ejecutar los comandos
    db.run(createUserTable, (err) => {
      if (err) {
        console.error("Error creando tabla 'users':", err.message);
      } else {
        console.log("Tabla 'users' creada o ya existe.");
      }
    });

    db.run(createScoreTable, (err) => {
      if (err) {
        console.error("Error creando tabla 'scores':", err.message);
      } else {
        console.log("Tabla 'scores' creada o ya existe.");
      }
    });
  });
};

// Exportamos la conexión 'db' y la función 'createTables'
module.exports = { db, createTables };