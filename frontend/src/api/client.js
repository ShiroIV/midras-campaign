const API_BASE = '/api';

let token = localStorage.getItem('midras_token');

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('midras_token', t);
  else localStorage.removeItem('midras_token');
}

export function getToken() {
  return token;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    window.location.href = '/login';
    throw new Error('Non authentifié');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  register: (username, password, role) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, role }) }),

  me: () => request('/auth/me'),

  campaigns: {
    list: () => request('/campaigns'),
    get: (id) => request(`/campaigns/${id}`),
    create: (data) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),
    addPlayer: (id, username) => request(`/campaigns/${id}/players`, { method: 'POST', body: JSON.stringify({ username }) }),
    removePlayer: (campaignId, userId) => request(`/campaigns/${campaignId}/players/${userId}`, { method: 'DELETE' }),
    stats: (id) => request(`/campaigns/${id}/stats`),
  },

  maps: {
    list: (campaignId) => request(`/maps/campaign/${campaignId}`),
    get: (id) => request(`/maps/${id}`),
    create: (campaignId, data) => request(`/maps/campaign/${campaignId}`, { method: 'POST', body: JSON.stringify(data) }),
    upload: (campaignId, formData) => {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      return fetch(`${API_BASE}/maps/campaign/${campaignId}`, { method: 'POST', headers, body: formData }).then(r => r.json());
    },
    update: (id, data) => request(`/maps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/maps/${id}`, { method: 'DELETE' }),
    pins: {
      create: (mapId, data) => request(`/maps/${mapId}/pins`, { method: 'POST', body: JSON.stringify(data) }),
      update: (mapId, pinId, data) => request(`/maps/${mapId}/pins/${pinId}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (mapId, pinId) => request(`/maps/${mapId}/pins/${pinId}`, { method: 'DELETE' }),
    },
  },

  calendar: {
    get: (campaignId) => request(`/calendar/${campaignId}`),
    advance: (campaignId, unit, amount) =>
      request(`/calendar/${campaignId}/advance`, { method: 'POST', body: JSON.stringify({ unit, amount }) }),
    setState: (campaignId, data) =>
      request(`/calendar/${campaignId}/state`, { method: 'PUT', body: JSON.stringify(data) }),
    events: {
      list: (campaignId, params) => request(`/calendar/${campaignId}/events?${new URLSearchParams(params)}`),
      create: (campaignId, data) => request(`/calendar/${campaignId}/events`, { method: 'POST', body: JSON.stringify(data) }),
      update: (campaignId, eventId, data) => request(`/calendar/${campaignId}/events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (campaignId, eventId) => request(`/calendar/${campaignId}/events/${eventId}`, { method: 'DELETE' }),
    },
    seasons: {
      list: (campaignId) => request(`/calendar/${campaignId}/seasons`),
      create: (campaignId, data) => request(`/calendar/${campaignId}/seasons`, { method: 'POST', body: JSON.stringify(data) }),
      update: (campaignId, seasonId, data) => request(`/calendar/${campaignId}/seasons/${seasonId}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (campaignId, seasonId) => request(`/calendar/${campaignId}/seasons/${seasonId}`, { method: 'DELETE' }),
    },
  },

  items: {
    list: () => request('/items'),
    get: (id) => request(`/items/${id}`),
    create: (data) => request('/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/items/${id}`, { method: 'DELETE' }),
  },

  monsters: {
    listAll: () => request('/monsters'),
    listPublic: (campaignId) => request(`/monsters/list/${campaignId}`),
    get: (id) => request(`/monsters/${id}`),
    create: (formData) => {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      return fetch(`${API_BASE}/monsters`, { method: 'POST', headers, body: formData }).then(r => r.json());
    },
    update: (id, formData) => {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      return fetch(`${API_BASE}/monsters/${id}`, { method: 'PUT', headers, body: formData }).then(r => r.json());
    },
    delete: (id) => request(`/monsters/${id}`, { method: 'DELETE' }),
    unlock: (serial_number, character_id) => request('/monsters/unlock', { method: 'POST', body: JSON.stringify({ serial_number, character_id }) }),
    unlocked: (characterId) => request(`/monsters/unlocked/${characterId}`),
  },

  characters: {
    list: (campaignId) => request(`/characters/campaign/${campaignId}`),
    get: (id) => request(`/characters/${id}`),
    create: (campaignId, data) => request(`/characters/campaign/${campaignId}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/characters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/characters/${id}`, { method: 'DELETE' }),
  },
};
