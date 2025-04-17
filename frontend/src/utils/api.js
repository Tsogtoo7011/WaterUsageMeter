import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post('http://localhost:5000/api/auth/refresh', {}, {
          withCredentials: true
        });

        const { accessToken } = response.data;

        localStorage.setItem('token', accessToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;