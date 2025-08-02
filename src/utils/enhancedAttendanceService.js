import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { launchCamera } from 'react-native-image-picker';
import modernLocationTracker from './modernLocationTracker';

// Storage keys
const ATTENDANCE_STORAGE_KEY = 'attendance_records';
const OFFLINE_ATTENDANCE_KEY = 'offline_attendance_data';
const USER_SESSION_KEY = 'user_session';

class EnhancedAttendanceService {
  constructor() {
    this.currentUser = null;
    this.offlineAttendanceData = [];
    this.isProcessing = false;
    
    this.loadOfflineData();
  }

  // Initialize user session
  async initializeUser(userData) {
    try {
      this.currentUser = userData;
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
      console.log('✅ User session initialized:', userData.employeeId);
    } catch (error) {
      console.error('❌ Error initializing user:', error);
    }
  }

  // Enhanced punch in with location tracking
  async punchIn(photoData = null) {
    try {
      console.log('🚀 Starting enhanced punch in...');
      
      // Check permissions
      const hasPermissions = await this.checkAllPermissions();
      if (!hasPermissions) {
        throw new Error('Required permissions not granted');
      }

      // Capture photo if not provided
      let attendancePhoto = photoData;
      if (!attendancePhoto) {
        attendancePhoto = await this.captureAttendancePhoto();
        if (!attendancePhoto) {
          throw new Error('Photo capture required for attendance');
        }
      }

      // Get current location
      const location = await modernLocationTracker.getCurrentLocation();
      if (!location) {
        throw new Error('Location access required for attendance');
      }

      // Create attendance record
      const attendanceRecord = {
        id: `attendance_${Date.now()}`,
        employeeId: this.currentUser?.employeeId,
        type: 'punch_in',
        timestamp: new Date().toISOString(),
        photo: attendancePhoto,
        location: location,
        deviceInfo: await this.getDeviceInfo(),
        sessionId: null, // Will be set when tracking starts
      };

      // Start location tracking session
      const trackingSession = await modernLocationTracker.startTracking(
        this.currentUser?.employeeId,
        'work'
      );

      // Update attendance record with session ID
      attendanceRecord.sessionId = trackingSession.id;

      // Save attendance record
      const savedRecord = await this.saveAttendanceRecord(attendanceRecord);
      
      // Store locally
      await this.storeAttendanceLocally(savedRecord);

      console.log('✅ Enhanced punch in completed successfully');
      
      return {
        success: true,
        record: savedRecord,
        session: trackingSession,
        message: 'Punch in successful with location tracking started'
      };

    } catch (error) {
      console.error('❌ Enhanced punch in failed:', error);
      
      // Store offline if network failed
      if (error.message.includes('network') || error.message.includes('server')) {
        await this.storeOfflineAttendance({
          type: 'punch_in',
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
      
      throw error;
    }
  }

  // Enhanced punch out with location tracking
  async punchOut(photoData = null) {
    try {
      console.log('🏁 Starting enhanced punch out...');
      
      // Check permissions
      const hasPermissions = await this.checkAllPermissions();
      if (!hasPermissions) {
        throw new Error('Required permissions not granted');
      }

      // Capture photo if not provided
      let attendancePhoto = photoData;
      if (!attendancePhoto) {
        attendancePhoto = await this.captureAttendancePhoto();
        if (!attendancePhoto) {
          throw new Error('Photo capture required for attendance');
        }
      }

      // Get current location
      const location = await modernLocationTracker.getCurrentLocation();
      if (!location) {
        throw new Error('Location access required for attendance');
      }

      // Stop location tracking
      const sessionStats = modernLocationTracker.getSessionStats();
      await modernLocationTracker.stopTracking();

      // Create attendance record
      const attendanceRecord = {
        id: `attendance_${Date.now()}`,
        employeeId: this.currentUser?.employeeId,
        type: 'punch_out',
        timestamp: new Date().toISOString(),
        photo: attendancePhoto,
        location: location,
        deviceInfo: await this.getDeviceInfo(),
        sessionStats: sessionStats,
      };

      // Save attendance record
      const savedRecord = await this.saveAttendanceRecord(attendanceRecord);
      
      // Store locally
      await this.storeAttendanceLocally(savedRecord);

      console.log('✅ Enhanced punch out completed successfully');
      
      return {
        success: true,
        record: savedRecord,
        sessionStats: sessionStats,
        message: 'Punch out successful with session statistics'
      };

    } catch (error) {
      console.error('❌ Enhanced punch out failed:', error);
      
      // Store offline if network failed
      if (error.message.includes('network') || error.message.includes('server')) {
        await this.storeOfflineAttendance({
          type: 'punch_out',
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
      
      throw error;
    }
  }

  // Check all required permissions
  async checkAllPermissions() {
    try {
      const permissions = {
        camera: Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
        location: Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_ALWAYS : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      };

      const results = {};
      
      for (const [key, permission] of Object.entries(permissions)) {
        let result = await check(permission);
        
        if (result === RESULTS.DENIED) {
          result = await request(permission);
        }
        
        results[key] = result === RESULTS.GRANTED;
      }

      const allGranted = Object.values(results).every(granted => granted);
      
      if (!allGranted) {
        const missingPermissions = Object.entries(results)
          .filter(([_, granted]) => !granted)
          .map(([key, _]) => key);
        
        Alert.alert(
          '🔐 Permissions Required',
          `Please grant ${missingPermissions.join(', ')} permissions in settings to continue.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => this.openSettings() }
          ]
        );
      }

      return allGranted;
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return false;
    }
  }

  // Capture attendance photo
  async captureAttendancePhoto() {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        saveToPhotos: false,
        maxWidth: 1024,
        maxHeight: 1024,
      };

      const result = await launchCamera(options);

      if (result.didCancel) {
        throw new Error('Photo capture cancelled');
      }

      if (result.errorCode) {
        throw new Error(`Camera error: ${result.errorMessage}`);
      }

      if (result.assets && result.assets[0]) {
        const photoData = {
          uri: result.assets[0].uri,
          fileName: result.assets[0].fileName || `attendance_${Date.now()}.jpg`,
          fileSize: result.assets[0].fileSize || 0,
          width: result.assets[0].width,
          height: result.assets[0].height,
          timestamp: new Date().toISOString(),
        };

        console.log('📸 Attendance photo captured:', photoData);
        return photoData;
      }

      throw new Error('No photo captured');
    } catch (error) {
      console.error('❌ Error capturing photo:', error);
      throw error;
    }
  }

  // Save attendance record to server
  async saveAttendanceRecord(record) {
    try {
      // For development/testing, simulate successful API response
      // TODO: Replace with your actual API endpoint when ready
      console.log('📤 Simulating attendance record save to server...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock response
      const savedRecord = {
        ...record,
        id: record.id || `attendance_${Date.now()}`,
        serverId: `server_${Date.now()}`,
        savedAt: new Date().toISOString(),
        status: 'success',
      };
      
      console.log('✅ Attendance record saved successfully (mock)');
      return savedRecord;
      
      /* Uncomment when you have real API endpoint:
      const response = await fetch('YOUR_API_ENDPOINT/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(record),
      });

      if (response.ok) {
        const savedRecord = await response.json();
        console.log('✅ Attendance record saved to server');
        return savedRecord;
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
      */
    } catch (error) {
      console.error('❌ Error saving attendance record:', error);
      throw error;
    }
  }

  // Store attendance record locally
  async storeAttendanceLocally(record) {
    try {
      const existingRecords = await this.getLocalAttendanceRecords();
      existingRecords.push(record);
      
      await AsyncStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(existingRecords));
      console.log('💾 Attendance record stored locally');
    } catch (error) {
      console.error('❌ Error storing attendance locally:', error);
    }
  }

  // Get local attendance records
  async getLocalAttendanceRecords() {
    try {
      const data = await AsyncStorage.getItem(ATTENDANCE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error getting local attendance records:', error);
      return [];
    }
  }

  // Store offline attendance data
  async storeOfflineAttendance(data) {
    try {
      this.offlineAttendanceData.push({
        ...data,
        storedAt: new Date().toISOString(),
        retryCount: 0,
      });

      await AsyncStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(this.offlineAttendanceData));
      console.log('💾 Offline attendance data stored');
    } catch (error) {
      console.error('❌ Error storing offline attendance:', error);
    }
  }

  // Load offline data
  async loadOfflineData() {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_ATTENDANCE_KEY);
      if (data) {
        this.offlineAttendanceData = JSON.parse(data);
        console.log(`📦 Loaded ${this.offlineAttendanceData.length} offline attendance records`);
      }
    } catch (error) {
      console.error('❌ Error loading offline data:', error);
    }
  }

  // Process offline attendance data
  async processOfflineAttendanceData() {
    if (this.offlineAttendanceData.length === 0) return;

    console.log(`🔄 Processing ${this.offlineAttendanceData.length} offline attendance records...`);

    const successfulSends = [];
    const failedSends = [];

    for (const data of this.offlineAttendanceData) {
      try {
        const success = await this.saveAttendanceRecord(data);
        
        if (success) {
          successfulSends.push(data);
        } else {
          data.retryCount = (data.retryCount || 0) + 1;
          if (data.retryCount < 5) {
            failedSends.push(data);
          }
        }
      } catch (error) {
        console.error('❌ Error processing offline attendance:', error);
        data.retryCount = (data.retryCount || 0) + 1;
        if (data.retryCount < 5) {
          failedSends.push(data);
        }
      }
    }

    // Update offline data
    this.offlineAttendanceData = failedSends;
    await AsyncStorage.setItem(OFFLINE_ATTENDANCE_KEY, JSON.stringify(this.offlineAttendanceData));

    console.log(`✅ Processed offline attendance: ${successfulSends.length} sent, ${failedSends.length} remaining`);
  }

  // Get device information
  async getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isTablet: Platform.isPad || Platform.isTV,
      timestamp: new Date().toISOString(),
    };
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

  // Open device settings
  openSettings() {
    // This would typically use react-native-permissions' openSettings
    // For now, we'll just show an alert
    Alert.alert(
      'Settings',
      'Please go to Settings > Apps > FocalytApp > Permissions and enable Camera and Location permissions.',
      [{ text: 'OK' }]
    );
  }

  // Get current attendance status
  getCurrentStatus() {
    const trackingStatus = modernLocationTracker.getTrackingStatus();
    return {
      isCheckedIn: trackingStatus.isTracking,
      currentSession: trackingStatus.currentSession,
      offlineDataCount: this.offlineAttendanceData.length,
      user: this.currentUser,
    };
  }

  // Get attendance statistics
  async getAttendanceStats() {
    try {
      const localRecords = await this.getLocalAttendanceRecords();
      const trackingStats = modernLocationTracker.getSessionStats();
      
      return {
        totalRecords: localRecords.length,
        todayRecords: localRecords.filter(record => {
          const today = new Date().toDateString();
          return new Date(record.timestamp).toDateString() === today;
        }).length,
        sessionStats: trackingStats,
        offlineDataCount: this.offlineAttendanceData.length,
      };
    } catch (error) {
      console.error('❌ Error getting attendance stats:', error);
      return null;
    }
  }

  // Cleanup resources
  cleanup() {
    modernLocationTracker.cleanup();
    console.log('🧹 Enhanced attendance service cleaned up');
  }
}

// Export singleton instance
export default new EnhancedAttendanceService(); 