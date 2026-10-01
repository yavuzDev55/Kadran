import axios from 'axios';

const api = axios.create({
  // Use env variable or fallback to backend port
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Request interceptor (assuming you already have this set up for the token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = 
      error.config?.url?.includes('/auth/login') || 
      error.config?.url?.includes('/auth/register');

    // Only redirect if it's a 401 and NOT an authentication route
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;