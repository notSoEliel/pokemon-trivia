import axios from 'axios'

// Apuntará a nuestro backend CUANDO exista
const api = axios.create({
  baseURL: 'http://localhost:8000',
})

// --- FUNCIONES DE AUTENTICACIÓN (PLACEHOLDER) ---

export async function register(email, password) {
  console.log('Intentando registrar:', email, password)
  // Simula un error (p.ej., el email ya existe)
  throw new Error('El backend no está conectado (Registro).')
}

export async function login(email, password) {
  console.log('Intentando login:', email, password)
  // ¡Simulemos un ÉXITO para probar la UI!
  await new Promise(resolve => setTimeout(resolve, 500)) // Espera 0.5s
  const fakeToken = 'token_falso_12345'
  localStorage.setItem('token', fakeToken)
  return fakeToken
}

// --- FUNCIONES DEL JUEGO (PLACEHOLDER) ---

export async function getGame(level, token) {
  console.log(`Pidiendo juego Nivel ${level} con token ${token}`)
  // Simula una carga de API
  await new Promise(resolve => setTimeout(resolve, 750))

  // Devuelve preguntas falsas
  const fakeQuestions = [
    {
      question: "¿Cuál es el nombre de este Pokémon?",
      image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
      options: ["Bulbasaur", "Charmander", "Squirtle", "Pikachu"],
      answer: "Bulbasaur",
    },
    {
      question: "¿Cuál es el nombre de este Pokémon?",
      image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png",
      options: ["Ivysaur", "Charmander", "Charmeleon", "Ratata"],
      answer: "Charmander",
    },
     {
      question: "¿Cuál es un tipo de 'Pikachu'?",
      options: ["Fuego", "Agua", "Eléctrico", "Planta"],
      answer: "Eléctrico",
    }
  ]
  
  return { level: level, questions: fakeQuestions }
}

export async function saveScore(score, level, token) {
  console.log(`Guardando puntaje: ${score} para Nivel ${level} con token ${token}`)
  // Simula un guardado exitoso
  await new Promise(resolve => setTimeout(resolve, 300))
  return { id: 1, score: score, level: level }
}

// --- FUNCIONES DE PERFIL (PLACEHOLDER) ---

export async function getMyBestScores(token) {
    console.log(`Pidiendo mis mejores puntajes con token ${token}`)
    await new Promise(resolve => setTimeout(resolve, 400))
    // Simula puntajes
    return {
        bestByLevel: [
            { level: 1, best: 2 },
            { level: 2, best: 1 }
        ]
    }
}

export async function getLeaderboard(level, token) {
    console.log(`Pidiendo leaderboard Nivel ${level} con token ${token}`)
    await new Promise(resolve => setTimeout(resolve, 600))
    // Simula leaderboard
    return {
        level: level,
        top: [
            { userId: 1, email: "ash@ketchum.com", best: 3 },
            { userId: 2, email: "misty@c.com", best: 2 },
        ]
    }
}


export default api