import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

// Axios Interceptor to automatically attach the JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Global error handling if the token expires
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Only force strict logout if the 401 didn't come from a Login attempt!
        if (error.response && error.response.status === 401 && !error.config.url.includes('/auth/signin')) {
            // If the backend says the token is invalid/expired, forcefully logout
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Hard refresh to boot them to the login screen
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
