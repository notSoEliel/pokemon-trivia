---
---
# 🎮 Pokémon Trivia Master

![Status](https://img.shields.io/badge/Status-Completed-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

> ¡Demuestra que eres el verdadero Maestro Pokémon! Un juego de trivia Full Stack interactivo que consume la PokeAPI en tiempo real, con sistema de progresión, avatares desbloqueables y rankings globales.

---

## 🛠️ Tech Stack

Este proyecto fue construido utilizando una arquitectura moderna separada (Frontend y Backend).

### Frontend (Cliente)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)

### Backend (Servidor)

![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![Bcrypt](https://img.shields.io/badge/Bcrypt-security-red)

### External API

![PokeAPI](https://img.shields.io/badge/PokeAPI-EF5350?style=for-the-badge&logo=pokemon&logoColor=white)

---

## 📂 Estructura del Proyecto

El proyecto está organizado en un monorepo con dos directorios principales:

```text
pokemon-trivia-project/
├── pokemon-trivia-backend/    # API RESTful en Node.js
│   ├── database.sqlite3       # Base de datos (autogenerada)
│   ├── database.js            # Configuración de SQLite
│   ├── index.js               # Servidor Express y lógica
│   ├── seed.js                # Script para generar datos falsos
│   └── package.json
│
└── pokemon-trivia-cliente/    # Aplicación React + Vite
        ├── src/
        │   ├── components/        # Componentes (Juego, Perfil, Auth...)
        │   ├── services/          # Conexión con Axios e Interceptores
        │   ├── App.jsx            # Rutas y Contexto
        │   └── main.jsx
        └── package.json
```

---

## 🧠 Mecánicas de Juego (Niveles)

El juego consta de 3 niveles de dificultad progresiva. Cada nivel utiliza una lógica diferente para consumir la PokeAPI:

| Nivel | Nombre | Dificultad | Mecánica Interna (Backend) |
|---:|---|---|---|
| 1 | Entrenador Novato | ⭐ Fácil | Reconocimiento Visual. El backend selecciona un Pokémon de la Generación 1 (Kanto) y extrae su `official-artwork`. El jugador debe identificar el nombre viendo la imagen. |
| 2 | Líder de Gimnasio | ⭐⭐ Medio | Conocimiento Teórico. Se selecciona un Pokémon de cualquier generación (1-898). El backend extrae su Tipo Principal (Fuego, Agua, etc.) y genera distractores aleatorios. El jugador debe acertar el tipo. |
| 3 | Alto Mando | ⭐⭐⭐ Difícil | Lore y Pokédex. Se consumen dos endpoints: `/pokemon` y `/pokemon-species`. El sistema busca la descripción del Pokédex en español (`flavor_text_entries`) y el jugador debe adivinar de qué Pokémon habla el texto. |

**Nota de Rendimiento:** El backend implementa un sistema de caché en memoria para los nombres de los Pokémon al iniciar, evitando bloqueos por rate-limiting de la PokeAPI y asegurando tiempos de respuesta rápidos.

---

## ✨ Características Clave

- 🔐 **Autenticación Segura:** Registro y Login completos con hash de contraseñas (`bcryptjs`) y Tokens JWT.
- 👤 **Perfil de Entrenador:**
  - **Avatar Personalizable:** Se te asigna un Pokémon aleatorio al inicio.
  - **Sistema de Desbloqueo:** Si superas los **20 Puntos**, puedes elegir manualmente cualquier Pokémon como tu avatar.
  - **Racha (Streak):** El sistema detecta si juegas días consecutivos y aumenta tu racha de fuego 🔥.
- 🏆 **Leaderboards Interactivos:**
  - **Ranking por Nivel:** Top 5 de mejores puntajes.
  - **Ranking General:** Suma total de todos los puntos de la historia del jugador.
  - **Mis Medallas:** Vista rápida de tus mejores récords personales.

---

## 🚀 Guía de Inicio Rápido

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

### 1. Prerrequisitos

- Tener **Node.js** instalado (v16 o superior).
- Git.

### 2. Configurar el Backend

```bash
# 1. Entra a la carpeta del backend
cd pokemon-trivia-backend

# 2. Instala las dependencias
npm install

# 3. (Opcional pero recomendado) Poblar la base de datos con datos falsos
# Esto creará usuarios como Ash, Misty y Cynthia con puntajes para competir.
node seed.js

# 4. Iniciar el servidor (corre en `http://localhost:8000`)
npm run dev
```

### 3. Configurar el Frontend

Abre una nueva terminal (mantén la del backend corriendo) y ejecuta:

```bash
# 1. Entra a la carpeta del cliente
cd pokemon-trivia-cliente

# 2. Instala las dependencias
npm install

# 3. Iniciar la aplicación (corre en `http://localhost:5173`)
npm run dev
```

¡Listo! Abre tu navegador en `http://localhost:5173` y empieza a jugar.

---

## 📡 Documentación de la API

El backend expone los siguientes endpoints REST. Todas las rutas protegidas requieren el header `Authorization: Bearer <token>`.

### Autenticación

- `POST /auth/register` : Crea un nuevo usuario.

    Body:

    ```json
    { "nombre": "Ash", "email": "ash@pk.com", "password": "123" }
    ```

- `POST /auth/token` : Inicia sesión.

    Body:

    ```json
    { "email": "ash@pk.com", "password": "123" }
    ```

- `GET /auth/me` 🔒 : Obtiene datos del perfil y avatar.
- `POST /auth/avatar` 🔒 : Actualiza la foto de perfil.

    Body:

    ```json
    { "type": "specific", "name": "gengar" }
    ```

### Juego

- `GET /trivia/game/:level` 🔒 : Obtiene 5 preguntas para el nivel (1, 2 o 3).
- `POST /trivia/score` 🔒 : Guarda el puntaje final.

    Body:

    ```json
    { "level": 1, "score": 5 }
    ```

### Estadísticas

- `GET /trivia/scores/me` 🔒 : Obtiene los mejores puntajes personales por nivel.
- `GET /trivia/leaderboard/:level` 🔒 : Obtiene el Top 5 global de un nivel.
- `GET /trivia/leaderboard/general` 🔒 : Obtiene el ranking global por suma de puntos.

---

## 👨‍💻 Autores

Proyecto desarrollado como parte de la materia de Ingeniería de Software Aplicada.

- **Eliel García** — Desarrollador Backend & Frontend
- **Angélica Rodriguez** — QA & Testing

¡Hazte con todos! 🔴⚪