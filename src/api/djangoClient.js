// djangoClient.js - Main API client for Django backend
import axios from 'axios';

const API_BASE_URL = 'https://autolab-fleetmanager-backend-api.onrender.com/api';

class DjangoClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
    this.lastVerified = 0;
    this.verificationInterval = 5 * 60 * 1000; // 5 minutes
    
    // Create axios instance with default config
    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Request interceptor to add auth token
    this.http.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.http.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${this.baseURL}/auth/refresh/`, {
                refresh: refreshToken
              });
              
              const { access } = response.data;
              localStorage.setItem('accessToken', access);
              
              // Retry original request
              original.headers.Authorization = `Bearer ${access}`;
              return this.http(original);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.logout();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(credentials) {
    try {
        const response = await this.http.post('/auth/login/', {
            username: credentials.email, // Convert email to username for Django
            password: credentials.password
        });
        
        const { access, refresh } = response.data;
        
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        
        return response.data;
    } catch (error) {
        throw this.handleError(error);
    }
}

  async logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async refreshToken() {
    try {
      const refresh = localStorage.getItem('refreshToken');
      const response = await this.http.post('/auth/refresh/', { refresh });
      const { access } = response.data;
      
      localStorage.setItem('accessToken', access);
      return access;
    } catch (error) {
      this.logout();
      throw this.handleError(error);
    }
  }

  async verifyToken() {
    try {
        const now = Date.now();
        // Use cached verification unless expired
        if (now - this.lastVerified < this.verificationInterval) {
            return true;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            return false;
        }

        const response = await this.http.post('/auth/verify/', { token });
        if (response.status === 200) {
            this.lastVerified = now;
            return true;
        }
        return false;
    } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return false;
    }
}

hasToken() {
    return !!localStorage.getItem('accessToken');
}

async checkAuth() {
    if (!this.isAuthenticated()) {
        return false;
    }
    return await this.verifyToken();
}

  // Generic CRUD operations
  async get(endpoint, params = {}) {
    try {
      const response = await this.http.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post(endpoint, data) {
    try {
      const response = await this.http.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put(endpoint, data) {
    try {
      const response = await this.http.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async patch(endpoint, data) {
    try {
      const response = await this.http.patch(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(endpoint) {
    try {
      const response = await this.http.delete(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // File upload with progress
  async uploadFile(endpoint, formData, onProgress = null) {
    try {
      const response = await this.http.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        } : undefined
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.http.get('/health/');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const errorData = {
        status: error.response.status,
        message: error.response.data?.message || error.response.data?.detail || 'An error occurred',
        data: error.response.data,
      };
      
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          errorData.message = 'Authentication required';
          break;
        case 403:
          errorData.message = 'Access denied';
          break;
        case 404:
          errorData.message = 'Resource not found';
          break;
        case 422:
          errorData.message = 'Validation error';
          errorData.validationErrors = error.response.data;
          break;
        case 500:
          errorData.message = 'Server error';
          break;
      }
      
      return errorData;
    } else if (error.request) {
      // Network error
      return {
        status: 0,
        message: 'Network error - please check your connection',
        data: null,
      };
    } else {
      // Other error
      return {
        status: 0,
        message: error.message || 'An unexpected error occurred',
        data: null,
      };
    }
  }

  // Utility methods
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }

  getToken() {
    return localStorage.getItem('accessToken');
  }

  setAuthHeader(token) {
    if (token) {
      this.http.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete this.http.defaults.headers.Authorization;
    }
  }

  // Pagination helper
  async getPaginated(endpoint, page = 1, pageSize = 20, filters = {}) {
    const params = {
      page,
      page_size: pageSize,
      ...filters
    };
    
    return this.get(endpoint, params);
  }

  // Search helper
  async search(endpoint, query, filters = {}) {
    const params = {
      search: query,
      ...filters
    };
    
    return this.get(endpoint, params);
  }

  async getUserProfile() {
    try {
        const response = await this.http.get('/system/users/profile/');
        const userProfile = response.data;
        
        // Cache user profile data
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        return userProfile;
    } catch (error) {
        if (error.response?.status === 401) {
            this.logout();
            window.location.href = '/login';
        }
        throw this.handleError(error);
    }
}

  // Helper method to get cached profile
  getCachedProfile() {
    const cached = localStorage.getItem('userProfile');
    return cached ? JSON.parse(cached) : null;
  }
}

// Create and export singleton instance
const djangoClient = new DjangoClient();
export default djangoClient;