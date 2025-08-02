import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { launchCamera } from 'react-native-image-picker';
import Geocoder from 'react-native-geocoding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { ENV } from '../config/env';  
import enhancedAttendanceService from '../utils/enhancedAttendanceService';
import modernLocationTracker from '../utils/modernLocationTracker';

const { width } = Dimensions.get('window');

const NewDashboard = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workingHours, setWorkingHours] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  
  // Camera related states
  const [lastPhoto, setLastPhoto] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  // Timeline tracking states
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [trackingStartLocation, setTrackingStartLocation] = useState(null);

  useEffect(() => {
    // Initialize geocoder only (remove RNLocation.configure to avoid conflicts)
    try {
      Geocoder.init(ENV.GOOGLE_MAPS_API_KEY);
      console.log('✅ Geocoder initialized successfully');
    } catch (error) {
      console.error('❌ Geocoder initialization error:', error);
    }
    
    // Initialize enhanced services
    initializeServices();
    
    // Check permissions on startup
    checkAllPermissions();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData !== null) {
          const user = JSON.parse(userData);
          setUserInfo(user);
          // Initialize enhanced attendance service with user data
          await enhancedAttendanceService.initializeUser(user);
        }
      } catch (error) {
        console.log('Error getting user info:', error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (checkInTime && !checkOutTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const diff = now - checkInTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setWorkingHours(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [checkInTime, checkOutTime]);

  // Initialize enhanced services
  const initializeServices = async () => {
    try {
      console.log('🔧 Initializing enhanced services...');
      
      // Process any offline data
      await enhancedAttendanceService.processOfflineAttendanceData();
      
      console.log('✅ Enhanced services initialized');
    } catch (error) {
      console.error('❌ Error initializing services:', error);
    }
  };

  // Check all permissions
  const checkAllPermissions = async () => {
    try {
      // Check camera permission
      const cameraPermissionStatus = await check(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
      );
      setCameraPermission(cameraPermissionStatus === RESULTS.GRANTED);
      
      // Check location permission
      const locationPermissionStatus = await check(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      );
      setLocationPermission(locationPermissionStatus === RESULTS.GRANTED);
      
      console.log('🔐 Permissions checked:', {
        camera: cameraPermissionStatus,
        location: locationPermissionStatus
      });
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const result = await request(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
      );
      setCameraPermission(result === RESULTS.GRANTED);
      
      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          '📸 Camera Permission Required',
          'Please enable camera access in settings to take attendance photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings }
          ]
        );
      }
      
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('❌ Error requesting camera permission:', error);
      return false;
    }
  };

  const requestLocationPermission = async () => {
    try {
      console.log('📍 Requesting location permission...');
      
      // First try with react-native-permissions
      const result = await request(
        Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      );
      
      console.log('📍 Permission result:', result);
      setLocationPermission(result === RESULTS.GRANTED);
      
      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          '📍 Location Permission Required',
          'Please enable location access in settings for attendance tracking.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings }
          ]
        );
        return false;
      }
      
      // Also request permission with react-native-location
      try {
        const rnLocationPermission = await RNLocation.requestPermission({
          ios: 'whenInUse',
          android: {
            detail: 'fine',
          },
        });
        console.log('📍 RNLocation permission:', rnLocationPermission);
      } catch (rnError) {
        console.log('📍 RNLocation permission error (non-critical):', rnError);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      return false;
    }
  };

  const capturePhoto = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        saveToPhotos: false,
      };
      
      const result = await launchCamera(options);
      
      if (result.didCancel) {
        console.log('📸 User cancelled photo capture');
        return null;
      }
      
      if (result.errorCode) {
        console.error('📸 Camera error:', result.errorMessage);
        return null;
      }
      
      if (result.assets && result.assets[0]) {
        const photoData = {
          uri: result.assets[0].uri,
          fileName: result.assets[0].fileName || `attendance_${Date.now()}.jpg`,
          fileSize: result.assets[0].fileSize || 0,
          timestamp: new Date().toISOString(),
        };
        
        console.log('📸 Photo captured:', photoData);
        return photoData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error capturing photo:', error);
      return null;
    }
  };

  const getLocationReading = async () => {
    try {
      console.log('📍 Getting location...');
      
      // Check if we have permission first
      if (!locationPermission) {
        console.log('📍 No location permission, requesting...');
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          return null;
        }
      }
      
      // Try to get location with multiple attempts
      let location = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!location && attempts < maxAttempts) {
        attempts++;
        console.log(`📍 Attempt ${attempts} to get location...`);
        
        try {
          // Method 1: Try with RNLocation
          location = await RNLocation.getLatestLocation({ 
            timeout: 15000,
            enableHighAccuracy: true,
            maximumAge: 30000,
          });
          
          if (location && location.latitude && location.longitude) {
            console.log('📍 Location obtained via RNLocation:', {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
            });
            return {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy || 1000,
              timestamp: new Date().toISOString(),
            };
          } else {
            console.log('📍 RNLocation returned invalid location:', location);
          }
          
          // Method 2: Try with different settings if first attempt failed
          if (attempts === 2) {
            console.log('📍 Trying with different location settings...');
            location = await RNLocation.getLatestLocation({ 
              timeout: 20000,
              enableHighAccuracy: false,
              maximumAge: 60000,
            });
            
            if (location && location.latitude && location.longitude) {
              console.log('📍 Location obtained with fallback settings:', {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
              });
              return {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy || 1000,
                timestamp: new Date().toISOString(),
              };
            }
          }
          
        } catch (attemptError) {
          console.log(`📍 Attempt ${attempts} failed:`, attemptError.message);
          if (attempts < maxAttempts) {
            // Wait a bit before next attempt
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
      
      if (!location) {
        console.log('📍 All location attempts failed');
        Alert.alert(
          '📍 Location Error',
          'Could not get your location. Please check:\n\n• GPS is enabled\n• Location permission is granted\n• You are outdoors or near a window\n\nTry again?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => handlePunchIn() }
          ]
        );
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting location:', error);
      Alert.alert(
        '📍 Location Error',
        'Failed to get location. Please check your GPS settings and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => handlePunchIn() }
        ]
      );
      return null;
    }
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setAddressLoading(true);
      
      const response = await Geocoder.from(latitude, longitude);
      
      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const addressComponents = result.address_components;
        
        let streetNumber = '';
        let route = '';
        let sublocality = '';
        let locality = '';
        let administrativeArea = '';
        let country = '';
        let postalCode = '';
        
        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('sublocality')) {
            sublocality = component.long_name;
          } else if (types.includes('locality')) {
            locality = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            administrativeArea = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });
        
        const cleanAddress = result.formatted_address;
        const shortAddress = [streetNumber, route, sublocality, locality]
          .filter(Boolean)
          .join(', ');
        
        const addressData = {
          formattedAddress: result.formatted_address,
          cleanAddress: cleanAddress,
          shortAddress: shortAddress || cleanAddress,
          streetNumber,
          route,
          sublocality,
          locality,
          administrativeArea,
          country,
          postalCode,
          latitude,
          longitude,
        };
        
        console.log('🏠 Address resolved:', addressData);
        return addressData;
      }
      
      return {
        formattedAddress: `${latitude}, ${longitude}`,
        cleanAddress: `${latitude}, ${longitude}`,
        shortAddress: `${latitude}, ${longitude}`,
        latitude,
        longitude,
      };
    } catch (error) {
      console.error('❌ Error getting address:', error);
      return {
        formattedAddress: `${latitude}, ${longitude}`,
        cleanAddress: `${latitude}, ${longitude}`,
        shortAddress: `${latitude}, ${longitude}`,
        latitude,
        longitude,
      };
    } finally {
      setAddressLoading(false);
    }
  };

  // Enhanced Punch In logic with location tracking
  const handlePunchIn = async () => {
    if (loading) return;
    
    setLoading(true);
    setAddress(null);
    setLocation(null);
    setLastPhoto(null);
    
    try {
      console.log('🚀 Starting enhanced punch in...');
      
      // Use enhanced attendance service
      const result = await enhancedAttendanceService.punchIn();
      
      if (result.success) {
        // Update UI state
        setIsCheckedIn(true);
        const punchInTime = new Date();
        setCheckInTime(punchInTime);
        
        // Set photo and location data for display
        if (result.record.photo) {
          setLastPhoto(result.record.photo);
        }
        if (result.record.location) {
          setLocation(result.record.location);
          // Get address for display
          const addr = await getAddressFromCoordinates(
            result.record.location.latitude, 
            result.record.location.longitude
          );
          setAddress(addr);
        }
        
        // Start timeline tracking
        setIsTrackingActive(true);
        setTrackingStartLocation(result.record.location);
        
        // Success message
        Alert.alert(
          '🎉 Enhanced Punch In Successful!', 
          `⏰ Time: ${punchInTime.toLocaleTimeString()}\n` +
          `📸 Photo: ✅ Captured\n` +
          `📍 Location: ✅ Verified\n` +
          `🗺️ Live tracking started!\n` +
          `📊 Session ID: ${result.session.id}`,
          [{ text: 'Excellent!' }]
        );
        
        console.log('🎉 Enhanced punch in completed successfully!');
      }
      
    } catch (error) {
      console.error('❌ Enhanced punch in failed:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.message.includes('permission')) {
        errorMessage = 'Camera and location permissions are required for attendance.';
      } else if (error.message.includes('location')) {
        errorMessage = 'Could not get your location. Please check GPS settings.';
      } else if (error.message.includes('photo')) {
        errorMessage = 'Photo capture is required for attendance verification.';
      }
      
      Alert.alert('❌ Punch In Failed', errorMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Try Again', onPress: () => handlePunchIn() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Punch Out logic with location tracking
  const handlePunchOut = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      console.log('🏁 Starting enhanced punch out...');
      
      // Use enhanced attendance service
      const result = await enhancedAttendanceService.punchOut();
      
      if (result.success) {
        // Update UI state
        setIsCheckedIn(false);
        const punchOutTime = new Date();
        setCheckOutTime(punchOutTime);
        setWorkingHours('00:00:00');
        
        // Set photo and location data for display
        if (result.record.photo) {
          setLastPhoto(result.record.photo);
        }
        if (result.record.location) {
          setLocation(result.record.location);
          // Get address for display
          const addr = await getAddressFromCoordinates(
            result.record.location.latitude, 
            result.record.location.longitude
          );
          setAddress(addr);
        }
        
        // Stop timeline tracking
        setIsTrackingActive(false);
        setTrackingStartLocation(null);
        
        // Calculate total working time
        if (checkInTime) {
          const totalTime = punchOutTime - checkInTime;
          const hours = Math.floor(totalTime / (1000 * 60 * 60));
          const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
          
          // Get session statistics
          const sessionStats = result.sessionStats;
          const totalDistance = sessionStats ? (sessionStats.totalDistance / 1000).toFixed(2) : 'N/A';
          const locationCount = sessionStats ? sessionStats.locationCount : 'N/A';
          
          Alert.alert(
            '🎉 Enhanced Punch Out Successful!',
            `⏰ Time: ${punchOutTime.toLocaleTimeString()}\n` +
            `⏱️ Total Time: ${hours}h ${minutes}m\n` +
            `📸 Photo: ✅ Captured\n` +
            `📍 Location: ✅ Verified\n` +
            `🗺️ Tracking stopped\n` +
            `📊 Session Stats:\n` +
            `   • Locations tracked: ${locationCount}\n` +
            `   • Distance traveled: ${totalDistance}km\n` +
            `   • Session ID: ${sessionStats?.sessionId || 'N/A'}`,
            [{ text: 'Excellent!' }]
          );
        }
        
        console.log('🎉 Enhanced punch out completed successfully!');
      }
      
    } catch (error) {
      console.error('❌ Enhanced punch out failed:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.message.includes('permission')) {
        errorMessage = 'Camera and location permissions are required for attendance.';
      } else if (error.message.includes('location')) {
        errorMessage = 'Could not get your location. Please check GPS settings.';
      } else if (error.message.includes('photo')) {
        errorMessage = 'Photo capture is required for attendance verification.';
      }
      
      Alert.alert('❌ Punch Out Failed', errorMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Try Again', onPress: () => handlePunchOut() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date ? date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) : '';
  };

  const getProgressPercentage = () => {
    if (!checkInTime || checkOutTime) return 0;
    const now = new Date();
    const diff = now - checkInTime;
    const hours = diff / (1000 * 60 * 60);
    return Math.min((hours / 8.5) * 100, 100);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.menuButton}>
                <Text style={styles.menuIcon}>👋</Text>
              </View>
              <View>
                <Text style={styles.greeting}>Good Morning! ☀️</Text>
                <Text style={styles.userName}>{userInfo?.name || 'N/A'}</Text>
                <Text style={styles.designation}>{userInfo?.designation || 'Admin'}</Text>
              </View>
            </View>
            <View style={styles.timeDisplay}>
              <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
              <Text style={styles.date}>{formatDate(currentTime)}</Text>
            </View>
          </View>
        </View>

        {/* Permission Status Card */}
        {/* <View style={styles.permissionCard}>
          <Text style={styles.sectionTitle}>🔐 Permission Status</Text>
          <View style={styles.permissionGrid}>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>📸</Text>
              <Text style={styles.permissionLabel}>Camera</Text>
              <Text style={[styles.permissionStatus, { 
                color: cameraPermission ? '#10B981' : '#EF4444' 
              }]}>
                {cameraPermission ? '✅' : '❌'}
              </Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>📍</Text>
              <Text style={styles.permissionLabel}>Location</Text>
              <Text style={[styles.permissionStatus, { 
                color: locationPermission ? '#10B981' : '#EF4444' 
              }]}>
                {locationPermission ? '✅' : '❌'}
              </Text>
            </View>
          </View>
          
          {(!cameraPermission || !locationPermission) && (
            <TouchableOpacity 
              style={styles.requestPermissionButton}
              onPress={checkAllPermissions}
            >
              <Text style={styles.requestPermissionText}>🔐 Check Permissions</Text>
            </TouchableOpacity>
          )}
        </View> */}

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusContent}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusIndicator, { backgroundColor: isCheckedIn ? '#10B981' : '#EF4444' }]}> 
                <Text style={styles.statusIcon}>{isCheckedIn ? '🟢' : '🔴'}</Text>
              </View>
              <View>
                <Text style={styles.statusTitle}>
                  {isCheckedIn ? 'You\'re Online' : 'You\'re Offline'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isCheckedIn ? 'Working since ' + formatTime(checkInTime) : 'Ready to start your day?'}
                </Text>
              </View>
            </View>
            {isCheckedIn && (
              <View style={styles.workingHoursContainer}>
                <Text style={styles.workingHours}>{workingHours}</Text>
                <Text style={styles.workingLabel}>Working</Text>
              </View>
            )}
          </View>
          {/* Progress Bar */}
          {isCheckedIn && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {getProgressPercentage().toFixed(0)}% of daily target
              </Text>
            </View>
          )}
        </View>

        {/* Enhanced Tracking Status Card */}
        <View style={styles.trackingCard}>
          <Text style={styles.sectionTitle}>🗺️ Live Tracking Status</Text>
          
          {/* Tracking Status */}
          <View style={styles.trackingStatus}>
            <View style={styles.trackingIndicator}>
              <Text style={styles.trackingIcon}>
                {isTrackingActive ? '🟢' : '🔴'}
              </Text>
              <Text style={styles.trackingLabel}>
                {isTrackingActive ? 'Active Tracking' : 'Tracking Stopped'}
              </Text>
            </View>
            
            {isTrackingActive && (
              <View style={styles.trackingStats}>
                <Text style={styles.trackingStat}>
                  📍 Locations: {modernLocationTracker.getTrackingStatus().currentSession?.locations?.length || 0}
                </Text>
                <Text style={styles.trackingStat}>
                  ⏱️ Duration: {workingHours}
                </Text>
                <Text style={styles.trackingStat}>
                  🔋 Battery Optimized: {modernLocationTracker.getTrackingStatus().batteryOptimized ? 'Yes' : 'No'}
                </Text>
              </View>
            )}
          </View>
          
          {/* Offline Data Status */}
          <View style={styles.offlineStatus}>
            <Text style={styles.offlineIcon}>💾</Text>
            <Text style={styles.offlineLabel}>
              Offline Data: {enhancedAttendanceService.getCurrentStatus().offlineDataCount || 0} records
            </Text>
          </View>
        </View>

        {/* Last Recorded Data Card */}
        {(lastPhoto || location || address) && (
          <View style={styles.dataCard}>
            <Text style={styles.sectionTitle}>📊 Last Recorded Data</Text>
            
            {/* Last Photo */}
            {lastPhoto && (
              <View style={styles.dataItem}>
                <Text style={styles.dataIcon}>📸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dataLabel}>Last Photo:</Text>
                  <Text style={styles.dataValue}>{new Date(lastPhoto.timestamp).toLocaleTimeString()}</Text>
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: lastPhoto.uri }} style={styles.photoPreview} />
                    <Text style={styles.photoInfo}>
                      📐 {lastPhoto.width}x{lastPhoto.height} | 📦 {(lastPhoto.fileSize / 1024).toFixed(1)}KB
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.dataItem}>
              <Text style={styles.dataIcon}>🕒</Text>
              <Text style={styles.dataLabel}>Last Punch:</Text>
              <Text style={styles.dataValue}>{checkInTime ? formatTime(checkInTime) : '--'}</Text>
            </View>
            
            {location && (
              <View style={styles.dataItem}>
                <Text style={styles.dataIcon}>📍</Text>
                <Text style={styles.dataLabel}>Coordinates:</Text>
                <Text style={styles.dataValue}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} (±{location.accuracy ? location.accuracy.toFixed(1) : 'N/A'}m)
                </Text>
              </View>
            )}
            
            {address && (
              <View style={styles.dataItem}>
                <Text style={styles.dataIcon}>🏠</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dataLabel}>Address:</Text>
                  <Text style={[styles.dataValue, { fontWeight: 'bold', marginBottom: 2 }]}>{address.cleanAddress}</Text>
                  <Text style={{ color: '#8E8E93', fontSize: 12 }}>{address.formattedAddress}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.sectionTitle}>👤 Employee Profile</Text>
          </View>
          <View style={styles.profileGrid}>
            <View style={styles.profileItem}>
              <Text style={styles.profileIcon}>🆔</Text>
              <View>
                <Text style={styles.profileLabel}>Employee ID</Text>
                <Text style={styles.profileValue}>{userInfo?.employeeId || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileIcon}>📱</Text>
              <View>
                <Text style={styles.profileLabel}>Mobile</Text>
                <Text style={styles.profileValue}>{userInfo?.mobile || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileIcon}>✉️</Text>
              <View>
                <Text style={styles.profileLabel}>Email</Text>
                <Text style={styles.profileValue}>{userInfo?.email || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Time Cards */}
        <View style={styles.timeSection}>
          <Text style={styles.sectionTitle}>⏰ Today's Activity</Text>
          <View style={styles.timeGrid}>
            <View style={[styles.timeCard, styles.checkInCard]}>
              <View style={styles.timeCardHeader}>
                <Text style={styles.timeCardIcon}>🚀</Text>
                <Text style={styles.timeCardTitle}>Check In</Text>
              </View>
              <Text style={styles.timeCardTime}>{formatTime(checkInTime)}</Text>
              <Text style={styles.timeCardDate}>
                {checkInTime ? checkInTime.toLocaleDateString() : 'Not checked in'}
              </Text>
            </View>
            <View style={[styles.timeCard, styles.checkOutCard]}>
              <View style={styles.timeCardHeader}>
                <Text style={styles.timeCardIcon}>🏁</Text>
                <Text style={styles.timeCardTitle}>Check Out</Text>
              </View>
              <Text style={styles.timeCardTime}>{formatTime(checkOutTime)}</Text>
              <Text style={styles.timeCardDate}>
                {checkOutTime ? checkOutTime.toLocaleDateString() : 'Not checked out'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Performance Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.targetCard]}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statValue}>8.5h</Text>
              <Text style={styles.statLabel}>Daily Target</Text>
            </View>
            <View style={[styles.statCard, styles.todayCard]}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>{workingHours}</Text>
              <Text style={styles.statLabel}>Today's Hours</Text>
            </View>
            <View style={[styles.statCard, styles.monthCard]}>
              <Text style={styles.statIcon}>📈</Text>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: isCheckedIn ? '#EF4444' : '#10B981',
              opacity: loading ? 0.6 : 1,
            }]}
            onPress={isCheckedIn ? handlePunchOut : handlePunchIn}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>
                  {isCheckedIn ? '👋' : '🚀'}
                </Text>
                <Text style={styles.buttonText}>
                  {isCheckedIn ? 'PUNCH OUT' : 'PUNCH IN'}
                </Text>
                <Text style={styles.buttonSubText}>
                  {isCheckedIn ? 'End your productive day' : 'Start with photo & location'}
                </Text>
                {(!cameraPermission || !locationPermission) && (
                  <Text style={styles.permissionWarning}>
                    🔐 Permissions required
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        {/* <View style={styles.footer}>
          <Text style={styles.footerText}>🏢 Enhanced Attendance with Camera</Text>
          <Text style={styles.footerSubText}>Photo + Location verification for secure attendance</Text>
        </View> */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '600',
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    color: '#1E293B',
    fontWeight: '800',
    marginTop: 4,
  },
  designation: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 2,
  },
  timeDisplay: {
    alignItems: 'flex-end',
  },
  currentTime: {
    fontSize: 32,
    color: '#1E293B',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  date: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  permissionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  permissionItem: {
    alignItems: 'center',
    flex: 1,
  },
  permissionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  permissionLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  permissionStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestPermissionButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  requestPermissionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusTitle: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  workingHoursContainer: {
    alignItems: 'center',
  },
  workingHours: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  workingLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  trackingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  trackingStatus: {
    marginBottom: 16,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  trackingLabel: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  trackingStats: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
  },
  trackingStat: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  offlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
  },
  offlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  offlineLabel: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  dataCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dataIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  dataLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  photoContainer: {
    marginTop: 8,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  photoInfo: {
    fontSize: 10,
    color: '#8E8E93',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  profileHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '700',
  },
  profileGrid: {
    gap: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  profileIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
  },
  profileLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  profileValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  timeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeGrid: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 16,
  },
  timeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  checkInCard: {
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  checkOutCard: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeCardIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timeCardTitle: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  timeCardTime: {
    fontSize: 24,
    color: '#1E293B',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  timeCardDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  targetCard: {
    backgroundColor: '#FECACA',
  },
  todayCard: {
    backgroundColor: '#D1FAE5',
  },
  monthCard: {
    backgroundColor: '#E0E7FF',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    color: '#1E293B',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 10,
    fontWeight: '600',
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
  },
  buttonSubText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  permissionWarning: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  footerSubText: {
    fontSize: 14,
    color: '#64748B',
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default NewDashboard;


