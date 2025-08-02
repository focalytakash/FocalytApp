// API Configuration for Enhanced Attendance System

// Base API URL - Replace with your actual API endpoint
export const API_BASE_URL = 'https://your-api-domain.com/api/v1';

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,
  VERIFY_TOKEN: `${API_BASE_URL}/auth/verify`,
};

// Attendance endpoints
export const ATTENDANCE_ENDPOINTS = {
  PUNCH_IN: `${API_BASE_URL}/attendance/punch-in`,
  PUNCH_OUT: `${API_BASE_URL}/attendance/punch-out`,
  GET_RECORDS: `${API_BASE_URL}/attendance/records`,
  GET_TODAY: `${API_BASE_URL}/attendance/today`,
  GET_STATS: `${API_BASE_URL}/attendance/stats`,
  UPLOAD_PHOTO: `${API_BASE_URL}/attendance/upload-photo`,
};

// Location tracking endpoints
export const LOCATION_ENDPOINTS = {
  UPLOAD_LOCATION: `${API_BASE_URL}/location/upload`,
  GET_SESSION: `${API_BASE_URL}/location/session`,
  END_SESSION: `${API_BASE_URL}/location/end-session`,
  GET_HISTORY: `${API_BASE_URL}/location/history`,
};

// Session management endpoints
export const SESSION_ENDPOINTS = {
  START_SESSION: `${API_BASE_URL}/session/start`,
  END_SESSION: `${API_BASE_URL}/session/end`,
  UPDATE_SESSION: `${API_BASE_URL}/session/update`,
  GET_ACTIVE_SESSION: `${API_BASE_URL}/session/active`,
  GET_SESSION_STATS: `${API_BASE_URL}/session/stats`,
};

// User management endpoints
export const USER_ENDPOINTS = {
  GET_PROFILE: `${API_BASE_URL}/user/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/user/profile`,
  GET_PERMISSIONS: `${API_BASE_URL}/user/permissions`,
  UPDATE_SETTINGS: `${API_BASE_URL}/user/settings`,
};

// Offline data sync endpoints
export const SYNC_ENDPOINTS = {
  SYNC_ATTENDANCE: `${API_BASE_URL}/sync/attendance`,
  SYNC_LOCATION: `${API_BASE_URL}/sync/location`,
  SYNC_SESSION: `${API_BASE_URL}/sync/session`,
  GET_SYNC_STATUS: `${API_BASE_URL}/sync/status`,
};

// API Configuration
export const API_CONFIG = {
  // Request timeout (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 5,
    DELAY: 1000, // Initial delay in milliseconds
    BACKOFF_MULTIPLIER: 2, // Exponential backoff multiplier
  },
  
  // Offline configuration
  OFFLINE: {
    MAX_STORAGE_SIZE: 1000, // Maximum number of offline records
    CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    SYNC_BATCH_SIZE: 50, // Number of records to sync at once
  },
  
  // Location tracking configuration
  LOCATION: {
    UPDATE_INTERVAL: 30000, // 30 seconds
    MIN_DISTANCE_FILTER: 5, // 5 meters
    MAX_ACCURACY: 100, // Maximum accuracy in meters
    BACKGROUND_ENABLED: true,
  },
  
  // Photo upload configuration
  PHOTO: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    COMPRESSION_QUALITY: 0.8,
    ALLOWED_FORMATS: ['image/jpeg', 'image/png'],
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  UNAUTHORIZED_ERROR: 'Authentication failed. Please login again.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  VALIDATION_ERROR: 'Invalid data provided. Please check your input.',
  SERVER_ERROR: 'Server error. Please try again later.',
  OFFLINE_ERROR: 'You are currently offline. Data will be synced when connection is restored.',
  LOCATION_ERROR: 'Location access is required for attendance tracking.',
  CAMERA_ERROR: 'Camera access is required for photo verification.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PUNCH_IN_SUCCESS: 'Punch in successful! Location tracking started.',
  PUNCH_OUT_SUCCESS: 'Punch out successful! Session ended.',
  PHOTO_UPLOAD_SUCCESS: 'Photo uploaded successfully.',
  LOCATION_UPLOAD_SUCCESS: 'Location data uploaded successfully.',
  SYNC_SUCCESS: 'Offline data synced successfully.',
  SESSION_STARTED: 'Tracking session started successfully.',
  SESSION_ENDED: 'Tracking session ended successfully.',
};

// API Headers
export const getApiHeaders = (authToken = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'FocalytApp/1.0',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

// API Request Helper
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      timeout: API_CONFIG.TIMEOUT,
      ...options,
      headers: {
        ...getApiHeaders(options.authToken),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Retry Helper
export const retryRequest = async (requestFn, maxAttempts = API_CONFIG.RETRY.MAX_ATTEMPTS) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = API_CONFIG.RETRY.DELAY * Math.pow(API_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Offline Data Structure
export const OFFLINE_DATA_TYPES = {
  ATTENDANCE: 'attendance',
  LOCATION: 'location',
  SESSION: 'session',
  PHOTO: 'photo',
};

// Session States
export const SESSION_STATES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ENDED: 'ended',
  ERROR: 'error',
};

// Attendance Types
export const ATTENDANCE_TYPES = {
  PUNCH_IN: 'punch_in',
  PUNCH_OUT: 'punch_out',
  BREAK_START: 'break_start',
  BREAK_END: 'break_end',
};

// Location Accuracy Levels
export const LOCATION_ACCURACY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export default {
  API_BASE_URL,
  AUTH_ENDPOINTS,
  ATTENDANCE_ENDPOINTS,
  LOCATION_ENDPOINTS,
  SESSION_ENDPOINTS,
  USER_ENDPOINTS,
  SYNC_ENDPOINTS,
  API_CONFIG,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  getApiHeaders,
  apiRequest,
  retryRequest,
  OFFLINE_DATA_TYPES,
  SESSION_STATES,
  ATTENDANCE_TYPES,
  LOCATION_ACCURACY,
}; 