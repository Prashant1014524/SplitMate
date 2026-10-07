/**
 * Centralized API Client for Communicating with Node.js Backend
 */

let rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
rawApiUrl = rawApiUrl.trim().replace(/\/+$/, '');
if (!rawApiUrl.endsWith('/api')) {
  rawApiUrl = `${rawApiUrl}/api`;
}
const API_BASE_URL = rawApiUrl;

function getAuthHeaders() {
  const token = localStorage.getItem('split_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(response) {
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'API request failed');
  }
  return json.data;
}

export const api = {
  async register(name, email, password, upiId, phone) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, upiId, phone })
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async googleLogin(credential) {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Groups
  async getGroups() {
    const res = await fetch(`${API_BASE_URL}/groups`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createGroup(name, category, memberEmails) {
    const res = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, category, memberEmails })
    });
    return handleResponse(res);
  },

  async getGroup(id) {
    const res = await fetch(`${API_BASE_URL}/groups/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async joinGroup(id) {
    const res = await fetch(`${API_BASE_URL}/groups/${id}/join`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getGroupBalances(groupId) {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/balances`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Expenses
  async getExpenses(groupId) {
    const url = groupId ? `${API_BASE_URL}/expenses?groupId=${groupId}` : `${API_BASE_URL}/expenses`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createExpense(expenseData) {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(expenseData)
    });
    return handleResponse(res);
  },

  async deleteExpense(id) {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Settlements
  async getSettlements(groupId) {
    const url = groupId ? `${API_BASE_URL}/settlements?groupId=${groupId}` : `${API_BASE_URL}/settlements`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createSettlement(settlementData) {
    const res = await fetch(`${API_BASE_URL}/settlements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settlementData)
    });
    return handleResponse(res);
  },

  async deleteSettlement(id) {
    const res = await fetch(`${API_BASE_URL}/settlements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
