const API_URL = import.meta.env.VITE_API_URL || '';

export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_URL ? `${API_URL}${cleanPath}` : cleanPath;
};

export const apiFetch = (path: string, options?: RequestInit) => {
  return fetch(getApiUrl(path), options);
};
