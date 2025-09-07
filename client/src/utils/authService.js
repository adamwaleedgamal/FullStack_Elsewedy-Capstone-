import axios from 'axios';

const API_BASE_URL = 'http://localhost:5048/api';

// Token configuration
const ACCESS_TOKEN_LIFETIME_MINUTES = 15; // Backend token lifetime
const REFRESH_BEFORE_EXPIRY_MINUTES = 1; // Refresh 1 minute before expiry
const REFRESH_DELAY_MS = (ACCESS_TOKEN_LIFETIME_MINUTES - REFRESH_BEFORE_EXPIRY_MINUTES) * 60 * 1000; // 14 minutes

// In-memory state for tokens and user data
let accessToken = null;
let userData = null;
let isRefreshing = false;
let refreshTimeout = null;

const clearLegacyStorage = () => {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    console.log('Cleared legacy localStorage items');
  } catch (error) {
    console.log('No legacy localStorage items to clear');
  }
};

clearLegacyStorage();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Function to set access token and schedule refresh
const setAccessTokenAndScheduleRefresh = (token) => {
  // Only update if token is actually different
  if (accessToken === token) {
    return;
  }
  
  accessToken = token;
  
  // Clear existing timeout
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  // Schedule refresh 1 minute before expiration (14 minutes after creation)
  // This ensures tokens are refreshed before they expire (15 minutes)
  // Backend generates access tokens with 15-minute expiration
  if (token) {
    refreshTimeout = setTimeout(async () => {
      // Check if we're already refreshing
      if (isRefreshing) {
        return;
      }
      
      try {
        console.log('Access token expiring soon, refreshing...');
        await refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Clear tokens on refresh failure
        accessToken = null;
        userData = null;
      }
    }, REFRESH_DELAY_MS); // 14 minutes (840 seconds)
  }
};

// Function to refresh token
const refreshToken = async () => {
  if (isRefreshing) {
    return;
  }
  
  isRefreshing = true;
  
  try {
    const response = await apiClient.post('/Account/Refresh');
    if (response.data.accessToken) {
      setAccessTokenAndScheduleRefresh(response.data.accessToken);
      if (response.data.user) {
        userData = response.data.user;
      }
      console.log(response.data.accessToken);
    }
  } catch (error) {
    // Clear tokens on refresh failure
    accessToken = null;
    userData = null;
    clearLegacyStorage();
    throw error;
  } finally {
    isRefreshing = false;
  }
};

apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
      originalRequest._retry = true;
      console.log('🔄 401 error detected, attempting token refresh...');

      try {
        await refreshToken();
        
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed in interceptor:', refreshError.message);
        accessToken = null;
        userData = null;
        clearLegacyStorage();
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // This service now stores and manages dynamic user data from login
  // No more hardcoded IDs or fallback values
  async login(email, password) {
    try {
      const response = await apiClient.post('/Account/Login', { email, password });
      if (response.data.accessToken) {
        setAccessTokenAndScheduleRefresh(response.data.accessToken);
        if (response.data.user) {
          userData = response.data.user;
        }
      }
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  },

  async refreshToken() {
    return await refreshToken();
  },

  async logout() {
    try {
      await apiClient.post('/Account/Logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear timeout and tokens
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }
      accessToken = null;
      userData = null;
      clearLegacyStorage();
    }
  },

  isAuthenticated() {
    if (!accessToken) return false;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime;
    } catch (error) {
      return false;
    }
  },

  getStoredUser() {
    return userData;
  },

  storeUser(userDataParam) {
    userData = userDataParam;
  },

  getAccessToken() {
    return accessToken;
  },

  setAccessToken(token) {
    setAccessTokenAndScheduleRefresh(token);
  },

  clearAuth() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
    accessToken = null;
    userData = null;
    // Clear all dynamic user data when logging out
  },

  isTokenExpiringSoon() {
    if (!accessToken) return true;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const checkTime = Date.now() + (REFRESH_BEFORE_EXPIRY_MINUTES * 60 * 1000);
      return expirationTime < checkTime;
    } catch (error) {
      return true;
    }
  },

  async refreshTokenIfNeeded() {
    if (this.isTokenExpiringSoon()) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
      }
    }
  }
};

// Note: This service now manages dynamic user authentication
// No more hardcoded IDs or fallback values
