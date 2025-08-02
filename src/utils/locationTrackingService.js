import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import BackgroundTimer from 'react-native-background-timer';
import NetInfo from '@react-native-community/netinfo';

// Configure Geolocation for better compatibility
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
});

// Constants
const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds
const MIN_DISTANCE_FILTER = 5; // 5 meters
const OFFLINE_STORAGE_KEY = 'offline_location_data';
const SESSION_STORAGE_KEY = 'active_tracking_session';

class LocationTrackingService {
  constructor() {
    this.isTracking = false;
    this.currentSession = null;
    this.locationWatcher = null;
    this.appState = 'active';
    this.offlineData = [];
    this.retryQueue = [];
    this.backgroundTimer = null;
    this.networkListener = null;
    
    // Bind methods
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
    this.handleLocationUpdate = this.handleLocationUpdate.bind(this);
    this.handleLocationError = this.handleLocationError.bind(this);
    this.handleNetworkChange = this.handleNetworkChange.bind(this);
    
    // Initialize
    this.initializeModernBackgroundTracking();
    this.loadOfflineData();
    this.setupAppStateListener();
    this.setupNetworkListener();
  }

  // Initialize modern background tracking
  async initializeModernBackgroundTracking() {
    try {
      console.log('✅ Modern background tracking initialized');
      
      // Start background timer for location updates
      this.startBackgroundTimer();
      
    } catch (error) {
      console.error('❌ Failed to initialize modern background tracking:', error);
    }
  }

  // Setup network listener
  setupNetworkListener() {
    try {
      this.networkListener = NetInfo.addEventListener(this.handleNetworkChange);
      console.log('✅ Network listener setup successfully');
    } catch (error) {
      console.error('❌ Failed to setup network listener:', error);
    }
  }

  // Handle network changes
  handleNetworkChange(state) {
    console.log('🌐 Network state changed:', state.isConnected ? 'Online' : 'Offline');
    
    if (state.isConnected) {
      // Retry failed requests when back online
      this.processOfflineData();
    }
  }

  // Start background timer for location updates
  startBackgroundTimer() {
    try {
      this.backgroundTimer = BackgroundTimer.setInterval(() => {
        this.backgroundLocationUpdate();
      }, LOCATION_UPDATE_INTERVAL);
      
      console.log('✅ Background timer started');
    } catch (error) {
      console.error('❌ Failed to start background timer:', error);
    }
  }

  // Stop background timer
  stopBackgroundTimer() {
    try {
      if (this.backgroundTimer) {
        BackgroundTimer.clearInterval(this.backgroundTimer);
        this.backgroundTimer = null;
        console.log('✅ Background timer stopped');
      }
    } catch (error) {
      console.error('❌ Failed to stop background timer:', error);
    }
  }

  // Background location update function
  async backgroundLocationUpdate() {
    try {
      if (this.isTracking && this.currentSession) {
        console.log('🔄 Background location update...');
        
        const location = await this.getCurrentLocation();
        if (location) {
          await this.processLocationUpdate(location);
        }
      }
      
      // Process offline data periodically
      await this.processOfflineData();
      
    } catch (error) {
      console.error('❌ Background location update error:', error);
    }
  }

  // Setup app state change listener
  setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  // Handle app state changes
  handleAppStateChange(nextAppState) {
    console.log('📱 App state changed:', this.appState, '->', nextAppState);
    
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground
      this.onAppForeground();
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background
      this.onAppBackground();
    }
    
    this.appState = nextAppState;
  }

  // App foreground handler
  onAppForeground() {
    console.log('📱 App came to foreground');
    if (this.isTracking) {
      this.resumeTracking();
    }
    this.processOfflineData();
  }

  // App background handler
  onAppBackground() {
    console.log('📱 App went to background');
    if (this.isTracking) {
      this.pauseTracking();
    }
  }

  // Check and request location permissions
  async checkLocationPermissions() {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_ALWAYS 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await check(permission);
      
      if (result === RESULTS.GRANTED) {
        return true;
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking location permissions:', error);
      return false;
    }
  }

  // Start location tracking session
  async startTracking(employeeId, sessionType = 'work') {
    try {
      console.log('🚀 Starting location tracking...');
      
      // Check permissions
      const hasPermission = await this.checkLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      // Create new session
      this.currentSession = {
        id: `session_${Date.now()}`,
        employeeId,
        type: sessionType,
        startTime: new Date().toISOString(),
        startLocation: null,
        locations: [],
        isActive: true,
      };

      // Get initial location
      const initialLocation = await this.getCurrentLocation();
      if (initialLocation) {
        this.currentSession.startLocation = initialLocation;
        this.currentSession.locations.push(initialLocation);
      }

      // Start watching location
      this.startLocationWatching();
      
      // Save session to storage
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.currentSession));
      
      this.isTracking = true;
      console.log('✅ Location tracking started successfully');
      
      return this.currentSession;
    } catch (error) {
      console.error('❌ Failed to start tracking:', error);
      throw error;
    }
  }

  // Stop location tracking
  async stopTracking() {
    try {
      console.log('🛑 Stopping location tracking...');
      
      if (this.locationWatcher) {
        Geolocation.clearWatch(this.locationWatcher);
        this.locationWatcher = null;
      }

      // Stop background timer
      this.stopBackgroundTimer();

      if (this.currentSession) {
        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.isActive = false;
        
        // Save final session data
        await this.saveSessionData(this.currentSession);
      }

      this.isTracking = false;
      this.currentSession = null;
      
      // Clear session from storage
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      
      console.log('✅ Location tracking stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping tracking:', error);
    }
  }

  // Start location watching
  startLocationWatching() {
    try {
      const options = {
        enableHighAccuracy: true,
        distanceFilter: MIN_DISTANCE_FILTER,
        interval: LOCATION_UPDATE_INTERVAL,
        fastestInterval: LOCATION_UPDATE_INTERVAL / 2,
        forceRequestLocation: true,
        showLocationDialog: false,
        useSignificantChanges: false,
      };

      this.locationWatcher = Geolocation.watchPosition(
        this.handleLocationUpdate,
        this.handleLocationError,
        options
      );

      console.log('📍 Location watching started');
    } catch (error) {
      console.error('❌ Error starting location watching:', error);
    }
  }

  // Pause tracking (when app goes to background)
  pauseTracking() {
    if (this.locationWatcher) {
      Geolocation.clearWatch(this.locationWatcher);
      this.locationWatcher = null;
      console.log('⏸️ Location tracking paused');
    }
  }

  // Resume tracking (when app comes to foreground)
  resumeTracking() {
    if (this.isTracking && !this.locationWatcher) {
      this.startLocationWatching();
      console.log('▶️ Location tracking resumed');
    }
  }

  // Handle location updates
  async handleLocationUpdate(position) {
    try {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: new Date().toISOString(),
        sessionId: this.currentSession?.id,
      };

      console.log('📍 Location update:', {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy?.toFixed(1),
        timestamp: locationData.timestamp,
      });

      // Add to current session
      if (this.currentSession) {
        this.currentSession.locations.push(locationData);
      }

      // Process location update
      await this.processLocationUpdate(locationData);

    } catch (error) {
      console.error('❌ Error handling location update:', error);
    }
  }

  // Handle location errors
  handleLocationError(error) {
    console.error('❌ Location error:', error);
    
    // Retry logic for location errors
    if (this.isTracking) {
      setTimeout(() => {
        this.getCurrentLocation();
      }, 5000);
    }
  }

  // Get current location (single request)
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
        forceRequestLocation: true,
      };

      Geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date().toISOString(),
          };
          resolve(locationData);
        },
        (error) => {
          console.error('❌ Get current location error:', error);
          reject(error);
        },
        options
      );
    });
  }

  // Process location update (send to server or store offline)
  async processLocationUpdate(locationData) {
    try {
      // Try to send to server
      const success = await this.sendLocationToServer(locationData);
      
      if (!success) {
        // Store offline if failed
        await this.storeOfflineData(locationData);
      }
    } catch (error) {
      console.error('❌ Error processing location update:', error);
      await this.storeOfflineData(locationData);
    }
  }

  // Send location data to server
  async sendLocationToServer(locationData) {
    try {
      // For development/testing, simulate successful API response
      // TODO: Replace with your actual API endpoint when ready
      console.log('📤 Simulating location data send to server...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Location sent to server successfully (mock)');
      return true;
      
      /* Uncomment when you have real API endpoint:
      const response = await fetch('YOUR_API_ENDPOINT/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          ...locationData,
          sessionId: this.currentSession?.id,
          employeeId: this.currentSession?.employeeId,
        }),
      });

      if (response.ok) {
        console.log('✅ Location sent to server successfully');
        return true;
      } else {
        console.log('❌ Server error:', response.status);
        return false;
      }
      */
    } catch (error) {
      console.error('❌ Network error sending location:', error);
      return false;
    }
  }

  // Store data offline when network is unavailable
  async storeOfflineData(locationData) {
    try {
      this.offlineData.push({
        ...locationData,
        storedAt: new Date().toISOString(),
        retryCount: 0,
      });

      await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(this.offlineData));
      console.log('💾 Location stored offline');
    } catch (error) {
      console.error('❌ Error storing offline data:', error);
    }
  }

  // Load offline data from storage
  async loadOfflineData() {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_STORAGE_KEY);
      if (data) {
        this.offlineData = JSON.parse(data);
        console.log(`📦 Loaded ${this.offlineData.length} offline records`);
      }
    } catch (error) {
      console.error('❌ Error loading offline data:', error);
    }
  }

  // Process offline data (retry sending to server)
  async processOfflineData() {
    if (this.offlineData.length === 0) return;

    console.log(`🔄 Processing ${this.offlineData.length} offline records...`);

    const successfulSends = [];
    const failedSends = [];

    for (const data of this.offlineData) {
      try {
        const success = await this.sendLocationToServer(data);
        
        if (success) {
          successfulSends.push(data);
        } else {
          data.retryCount = (data.retryCount || 0) + 1;
          if (data.retryCount < 5) {
            failedSends.push(data);
          }
        }
      } catch (error) {
        console.error('❌ Error processing offline data:', error);
        data.retryCount = (data.retryCount || 0) + 1;
        if (data.retryCount < 5) {
          failedSends.push(data);
        }
      }
    }

    // Update offline data
    this.offlineData = failedSends;
    await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(this.offlineData));

    console.log(`✅ Processed offline data: ${successfulSends.length} sent, ${failedSends.length} remaining`);
  }

  // Save session data
  async saveSessionData(session) {
    try {
      // For development/testing, simulate successful API response
      // TODO: Replace with your actual API endpoint when ready
      console.log('📤 Simulating session data save to server...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('✅ Session data saved successfully (mock)');
      return true;
      
      /* Uncomment when you have real API endpoint:
      const response = await fetch('YOUR_API_ENDPOINT/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(session),
      });

      if (response.ok) {
        console.log('✅ Session data saved successfully');
        return true;
      } else {
        console.log('❌ Failed to save session data');
        return false;
      }
      */
    } catch (error) {
      console.error('❌ Error saving session data:', error);
      return false;
    }
  }

  // Get authentication token
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  // Get current tracking status
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      currentSession: this.currentSession,
      offlineDataCount: this.offlineData.length,
      appState: this.appState,
    };
  }

  // Get session statistics
  getSessionStats() {
    if (!this.currentSession) return null;

    const locations = this.currentSession.locations;
    const startTime = new Date(this.currentSession.startTime);
    const endTime = this.currentSession.endTime ? new Date(this.currentSession.endTime) : new Date();
    const duration = endTime - startTime;

    return {
      sessionId: this.currentSession.id,
      employeeId: this.currentSession.employeeId,
      startTime: this.currentSession.startTime,
      endTime: this.currentSession.endTime,
      duration: duration,
      locationCount: locations.length,
      totalDistance: this.calculateTotalDistance(locations),
      averageSpeed: this.calculateAverageSpeed(locations),
    };
  }

  // Calculate total distance traveled
  calculateTotalDistance(locations) {
    if (locations.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      totalDistance += this.calculateDistance(prev, curr);
    }

    return totalDistance;
  }

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Calculate average speed
  calculateAverageSpeed(locations) {
    if (locations.length < 2) return 0;

    const speeds = locations
      .filter(loc => loc.speed && loc.speed > 0)
      .map(loc => loc.speed);

    if (speeds.length === 0) return 0;

    const averageSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    return averageSpeed;
  }

  // Cleanup resources
  cleanup() {
    this.stopTracking();
    this.stopBackgroundTimer();
    
    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }
    
    AppState.removeEventListener('change', this.handleAppStateChange);
    console.log('🧹 Location tracking service cleaned up');
  }
}

// Export singleton instance
export default new LocationTrackingService(); 