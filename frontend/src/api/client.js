const BASE = import.meta.env.VITE_API_BASE || '/api';

const TOKEN_KEY = 'pathfinder.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, code, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers,
      ...options,
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Make sure the backend is running.',
      0,
      'NETWORK_ERROR'
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    throw new ApiError(
      data?.error?.message || `Request failed (${res.status})`,
      res.status,
      data?.error?.code || 'HTTP_ERROR',
      data?.error
    );
  }
  return data;
}

export const api = {
  health: () => request('/health'),
  stats: () => request('/catalog/stats'),

  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
  },

  listPaths: () => request('/catalog/paths'),
  pathDetail: (pathId) => request(`/catalog/paths/${pathId}`),

  listTopics: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== '' && v != null) qs.set(k, v);
    const suffix = qs.toString() ? `?${qs}` : '';
    return request(`/catalog/topics${suffix}`);
  },
  categories: () => request('/catalog/topics/categories'),
  topic: (id) => request(`/catalog/topics/${id}`),
  subgraph: (id, depth = 2) => request(`/graph/subgraph/${id}?depth=${depth}`),

  listSkills: (withDemand = false) =>
    request(`/catalog/skills?demand=${withDemand}`),
  fullGraph: () => request('/catalog/graph'),

  listUsers: () => request('/users'),
  user: (id) => request(`/users/${id}`),

  generatePath: (body) =>
    request('/paths/generate', { method: 'POST', body: JSON.stringify(body) }),

  markComplete: (userId, topicId) =>
    request(`/users/${userId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ topicId }),
    }),
};
