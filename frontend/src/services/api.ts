import axios from 'axios';

const getBaseURL = () => {
    let base = import.meta.env.VITE_API_URL || '';
    if (!base) return '/api';

    // Si ya termina en /api, lo dejamos así. Si no, lo agregamos.
    if (base.endsWith('/api')) return base;
    if (base.endsWith('/')) return base + 'api';
    return base + '/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token JWT
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

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response, // Pass through successful responses
    (error) => {
        // No redirigir si el error es 401 pero viene de un intento de login
        const isLoginRequest = error.config?.url?.includes('/login');

        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
