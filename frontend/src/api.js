import axios from 'axios';

// Determine API base URL based on environment
const API_BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? 'https://corporate-crime.vercel.app/api'
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

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized:', error.response?.data?.message);
      // Only redirect to login if it's not already on login/register pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const teamAPI = {
  login: (data) => api.post('/team/login', data),
  register: (data) => api.post('/team/register', data),
  getMe: () => api.get('/team/me'),
  getGameStatus: () => api.get('/team/game-status'),
  getLeaderboard: () => api.get('/team/leaderboard'),
  getClue: () => api.get('/clue'),
  getHints: () => api.get('/hints'),
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
  getPendingTeams: () => api.get('/admin/pending-teams'),
  approveTeam: (id) => api.post(`/admin/approve-team/${id}`),
  rejectTeam: (id) => api.post(`/admin/reject-team/${id}`),
  getLeaderboard: () => api.get('/admin/leaderboard'),
  resetTeam: (id) => api.post(`/admin/reset-team/${id}`),
  removePenalty: (id) => api.post(`/admin/remove-penalty/${id}`),
  adjustTime: (id, minutes) => api.post(`/admin/adjust-time/${id}`, { minutes }),
  deleteTeam: (id) => api.delete(`/admin/team/${id}`),
  createLocation: (data) => api.post('/admin/location', data),
  getLocations: () => api.get('/admin/locations'),
  updateLocation: (id, data) => api.put(`/admin/location/${id}`, data),
  deleteLocation: (id) => api.delete(`/admin/location/${id}`),
  createQuestion: (data) => {
    // Let axios handle FormData headers automatically
    return api.post('/admin/question', data);
  },
  getQuestions: () => api.get('/admin/questions'),
  deleteQuestion: (id) => api.delete(`/admin/question/${id}`),
  getClues: () => api.get('/admin/clues'),
  createClue: (data) => {
    // Let axios handle FormData headers automatically
    return api.post('/admin/clue', data);
  },
  updateClue: (id, data) => {
    // Let axios handle FormData headers automatically
    return api.put(`/admin/clue/${id}`, data);
  },
  deleteClue: (id) => api.delete(`/admin/clue/${id}`),
  getHints: () => api.get('/admin/hints'),
  createHint: (data) => api.post('/admin/hint', data),
  updateHint: (id, data) => api.put(`/admin/hint/${id}`, data),
  deleteHint: (id) => api.delete(`/admin/hint/${id}`),
};

export default api;
