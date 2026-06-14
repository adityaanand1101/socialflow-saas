const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export const apiFetch = (path: string, options?: RequestInit) => {
  return fetch(getApiUrl(path), options);
};
