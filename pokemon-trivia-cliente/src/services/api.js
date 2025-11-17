// pokemon-trivia-cliente/src/services/api.js
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000' });

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export async function updateAvatar(type, name = null) {
    const { data } = await api.post('/auth/avatar', { type, name });
    return data;
}

export async function register(nombre, email, password) {
  const { data } = await api.post('/auth/register', { nombre, email, password });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/token', { email, password });
  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
  }
  return data.access_token;
}

export async function getProfile() {
    const { data } = await api.get('/auth/me');
    return data;
}

export function logout() {
  localStorage.removeItem('token');
  // También borramos el resultado previo para que no se muestre al siguiente usuario
  localStorage.removeItem('lastResult'); 
}

export async function getGame(level) {
  const { data } = await api.get(`/trivia/game/${level}`);
  return data;
}

export async function saveScore(score, level) {
  // Obtenemos la fecha local del usuario en formato YYYY-MM-DD
  const localDateString = new Date().toLocaleDateString('en-CA');

  // Llama a POST /trivia/score (ahora enviando la fecha)
  const { data } = await api.post(
    '/trivia/score',
    { score, level, localDateString } // <-- Enviamos la fecha local
  );
  return data;
}

export async function getMyBestScores() {
  const { data } = await api.get('/trivia/scores/me');
  return data;
}

export async function getLeaderboard(level, limit = null) {
  // Si el nivel es 'general', usamos la nueva ruta
  const endpoint = level === 'general' 
    ? '/trivia/leaderboard/general' 
    : `/trivia/leaderboard/${level}`;

  const url = limit ? `${endpoint}?limit=${limit}` : endpoint;

  const { data } = await api.get(url);
  return data;
}

export default api;