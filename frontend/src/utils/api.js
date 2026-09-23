import axios from 'axios';

// Use relative URL so Vite proxy handles routing to localhost:5000
const api = axios.create({ baseURL: '' });

export default api;
