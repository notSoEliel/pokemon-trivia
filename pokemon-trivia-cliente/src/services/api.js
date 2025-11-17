import axios from 'axios';

// 1. Creamos la instancia de Axios
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// 2. ¡El Interceptor! (La magia de Axios)
// Esto se ejecuta ANTES de CADA petición.
// Su trabajo es comprobar si tenemos un token en localStorage.
// Si lo tenemos, lo añade al header 'Authorization'.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- FUNCIONES DE AUTENTICACIÓN (REALES) ---

export async function register(nombre, email, password) {
  // Llama a POST /auth/register
  const { data } = await api.post('/auth/register', { nombre, email, password });
  return data;
}

export async function login(email, password) {
  // Llama a POST /auth/token
  const { data } = await api.post('/auth/token', { email, password });
  
  if (data.access_token) {
    // 1. Guardamos el token en localStorage
    localStorage.setItem('token', data.access_token);
    // 2. (Opcional pero recomendado) Actualizamos el header por defecto de axios
    //    Aunque el interceptor ya lo hace, esto es inmediato.
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
  }
  return data.access_token;
}

export function logout() {
  // 1. Borramos el token de localStorage
  localStorage.removeItem('token');
  // 2. Borramos el header de axios
  delete api.defaults.headers.common['Authorization'];
}

// --- FUNCIONES DEL JUEGO (REALES) ---
// (Nota: ya no necesitamos pasar el 'token' como argumento,
// el interceptor de axios lo añade automáticamente)

export async function getGame(level) {
  // Llama a GET /trivia/game/:level (con token automático)
  const { data } = await api.get(`/trivia/game/${level}`);
  return data;
}

export async function saveScore(score, level) {
  // Llama a POST /trivia/score (con token automático)
  const { data } = await api.post(
    '/trivia/score',
    { score, level }
  );
  return data;
}

// --- FUNCIONES DE PERFIL (REALES) ---

export async function getMyBestScores() {
  // Llama a GET /trivia/scores/me (con token automático)
  const { data } = await api.get('/trivia/scores/me');
  return data;
}

export async function getLeaderboard(level) {
  // Llama a GET /trivia/leaderboard/:level (con token automático)
  const { data } = await api.get(`/trivia/leaderboard/${level}`);
  return data;
}

export default api;