import axios from 'axios';

// Determine API base URL based on environment
const API_BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? process.env.VITE_API_URL || 'https://your-backend.vercel.app/api'
    : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const teamAPI = {
  login: (data) => api.post('/team/login', data),
  register: (data) => api.post('/team/register', data),
  getMe: () => api.get('/team/me'),
  getGameStatus: () => api.get('/team/game-status'),
  getLeaderboard: (category) => api.get('/team/leaderboard', { params: category ? { category } : {} }),
  getClue: () => api.get('/clue'),
  scanQR: (qrCode) => api.post('/qr/scan', { qrCode }),
  verifyAnswer: (data) => api.post('/qr/verify', data),
  getQualified: (top) => api.get('/team/qualified', { params: top ? { top } : {} }),
  getQuiz: () => api.get('/quiz'),
  submitQuiz: (data) => api.post('/quiz/submit', data),
};

export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  getGameStatus: () => api.get('/admin/status'),
  toggleGame: (action, eventDurationMinutes) => api.post('/admin/toggle', { action, eventDurationMinutes }),
  getTeams: () => api.get('/admin/teams'),
  getLeaderboard: () => api.get('/admin/leaderboard'),
  resetTeam: (id) => api.post(`/admin/reset-team/${id}`),
  removePenalty: (id) => api.post(`/admin/remove-penalty/${id}`),
  adjustTime: (id, minutes) => api.post(`/admin/adjust-time/${id}`, { minutes }),
  deleteTeam: (id) => api.delete(`/admin/team/${id}`),
  createLocation: (data) => api.post('/admin/location', data),
  createQuestion: (data) => api.post('/admin/question', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  getQuestions: () => api.get('/admin/questions'),
  deleteQuestion: (id) => api.delete(`/admin/question/${id}`),
  getClues: () => api.get('/admin/clues'),
  createClue: (data) => api.post('/admin/clue', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  updateClue: (id, data) => api.put(`/admin/clue/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  deleteClue: (id) => api.delete(`/admin/clue/${id}`),
};

export default api;
