import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5129';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

let _sessionId: string | null = null;
let _authToken: string | null = null;

export const setSessionId  = (id: string | null)    => { _sessionId  = id; };
export const setAuthToken  = (token: string | null) => { _authToken  = token; };

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_authToken) {
    config.headers['Authorization'] = `Bearer ${_authToken}`;
  }
  if (_sessionId) {
    config.headers['X-Session-Id'] = _sessionId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 409) return error.response;

    if (status === 410) {
      const sessionId = _sessionId;
      setSessionId(null);
      window.location.href = `/test-expired/${sessionId}`;
      return Promise.reject(error);
    }

    if (status === 429) return Promise.reject(error);

    return Promise.reject(error);
  }
);

export default api;
