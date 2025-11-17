const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "database.sqlite3";

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

const createTables = () => {
  db.serialize(() => {
    // Añadimos 'profile_pic'
    const createUserTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        streak INTEGER DEFAULT 0,
        last_played TEXT,
        profile_pic TEXT
      )
    `;
    
    const createScoreTable = `
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        level INTEGER NOT NULL,
        score INTEGER NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `;

    db.run(createUserTable, (err) => {
      if (err) console.error("Error tabla users:", err.message);
    });

    db.run(createScoreTable, (err) => {
      if (err) console.error("Error tabla scores:", err.message);
    });
  });
};

module.exports = { db, createTables };