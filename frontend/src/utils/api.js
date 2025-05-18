import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    let token = null;
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.token) token = parsed.token;
      } catch {}
    }
    if (!token) {
      token = localStorage.getItem('token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post('http://localhost:5000/api/auth/refresh', {}, {
          withCredentials: true
        });

        const { accessToken } = response.data;

        // Save token in both 'token' and 'user'
        localStorage.setItem('token', accessToken);
        const user = localStorage.getItem('user');
        if (user) {
          try {
            const parsed = JSON.parse(user);
            parsed.token = accessToken;
            localStorage.setItem('user', JSON.stringify(parsed));
          } catch {}
        }
        
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