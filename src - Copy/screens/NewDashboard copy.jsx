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
import RNLocation from 'react-native-location';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { launchCamera } from 'react-native-image-picker';
import Geocoder from 'react-native-geocoding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { ENV } from '../config/env';  

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

  useEffect(() => {
    // Initialize location and geocoder
    RNLocation.configure({
      distanceFilter: 0,
      desiredAccuracy: {
        ios: 'bestForNavigation',
        android: 'highAccuracy',
      },
      interval: 500,
      fastestInterval: 250,
      maxWaitTime: 5000,
      enableBackgroundLocationUpdates: false,
    });
    Geocoder.init(ENV.GOOGLE_MAPS_API_KEY);
    
    // Check permissions on startup
    checkAllPermissions();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData !== null) {
          setUserInfo(JSON.parse(userData));
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
        Platform.OS === 'ios' 
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      );
      setLocationPermission(locationPermissionStatus === RESULTS.GRANTED);
      
      console.log('📱 Permission Status:', {
        camera: cameraPermissionStatus === RESULTS.GRANTED,
        location: locationPermissionStatus === RESULTS.GRANTED
      });
    } catch (error) {
      console.error('❌ Permission check failed:', error);
    }
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        setCameraPermission(true);
        return true;
      } else {
        Alert.alert(
          '📸 Camera Permission Required',
          'Camera permission is required to take attendance photos. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openSettings() },
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('❌ Camera permission request failed:', error);
      return false;
    }
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      const result = await request(permission);
      
      if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
        setLocationPermission(true);
        return true;
      } else {
        Alert.alert(
          '📍 Location Permission Required',
          'Location permission is required for attendance tracking. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openSettings() },
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('❌ Location permission request failed:', error);
      return false;
    }
  };

  // Capture photo using camera
  const capturePhoto = async () => {
    try {
      console.log('📸 Opening camera for photo capture...');
      
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: false,
        saveToPhotos: false,
        cameraType: 'front', // Use front camera for selfie
      };

      return new Promise((resolve) => {
        launchCamera(options, (response) => {
          if (response.didCancel) {
            console.log('📸 User cancelled camera');
            resolve(null);
          } else if (response.errorMessage) {
            console.error('📸 Camera error:', response.errorMessage);
            Alert.alert('Camera Error', response.errorMessage);
            resolve(null);
          } else if (response.assets && response.assets[0]) {
            const photo = {
              uri: response.assets[0].uri,
              type: response.assets[0].type,
              fileName: response.assets[0].fileName || 'attendance_photo.jpg',
              fileSize: response.assets[0].fileSize,
              width: response.assets[0].width,
              height: response.assets[0].height,
              timestamp: new Date().toISOString(),
            };
            console.log('📸 Photo captured successfully:', photo);
            resolve(photo);
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('❌ Photo capture failed:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      return null;
    }
  };

  // Get single location reading
  const getLocationReading = async () => {
    try {
      console.log('📍 Getting location...');
      const location = await RNLocation.getLatestLocation({
        timeout: 15000,
        enableHighAccuracy: true,
        maximumAge: 30000,
      });
      
      if (location && location.latitude && location.longitude) {
        console.log('📍 Location obtained:', location);
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy || 1000,
          timestamp: location.timestamp || Date.now(),
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Location error:', error);
      return null;
    }
  };

  // Get address from coordinates
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setAddressLoading(true);
      console.log('🏠 Getting address for coordinates...');
      
      const response = await Geocoder.from(latitude, longitude);
      if (response && response.results && response.results.length > 0) {
        const result = response.results[0];
        const addressComponents = result.address_components;
        
        const address = {
          formattedAddress: result.formatted_address,
          streetNumber: '',
          route: '',
          locality: '',
          administrativeArea: '',
          postalCode: '',
          country: '',
          placeId: result.place_id,
          types: result.types,
        };
        
        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) address.streetNumber = component.long_name;
          else if (types.includes('route')) address.route = component.long_name;
          else if (types.includes('locality')) address.locality = component.long_name;
          else if (types.includes('administrative_area_level_1')) address.administrativeArea = component.long_name;
          else if (types.includes('postal_code')) address.postalCode = component.long_name;
          else if (types.includes('country')) address.country = component.long_name;
        });
        
        const cleanAddress = [
          address.streetNumber && address.route ? `${address.streetNumber} ${address.route}` : address.route,
          address.locality,
          address.administrativeArea,
          address.postalCode,
          address.country,
        ].filter(Boolean).join(', ');
        
        address.cleanAddress = cleanAddress;
        console.log('🏠 Address obtained:', address);
        return address;
      }
      throw new Error('No address found');
    } catch (error) {
      console.error('❌ Address error:', error);
      return {
        formattedAddress: 'Address not available',
        cleanAddress: 'Address not available',
        error: error.message,
      };
    } finally {
      setAddressLoading(false);
    }
  };

  // Enhanced Punch In logic with camera
  const handlePunchIn = async () => {
    if (loading) return;
    
    setLoading(true);
    setAddress(null);
    setLocation(null);
    setLastPhoto(null);
    
    try {
      console.log('🚀 Starting punch in process with camera...');
      
      // Step 1: Check and request camera permission
      let hasCameraPermission = cameraPermission;
      if (!hasCameraPermission) {
        console.log('📸 Requesting camera permission...');
        hasCameraPermission = await requestCameraPermission();
        if (!hasCameraPermission) {
          setLoading(false);
          return;
        }
      }
      
      // Step 2: Check and request location permission
      let hasLocationPermission = locationPermission;
      if (!hasLocationPermission) {
        console.log('📍 Requesting location permission...');
        hasLocationPermission = await requestLocationPermission();
        if (!hasLocationPermission) {
          setLoading(false);
          return;
        }
      }
      
      // Step 3: Capture photo first
      console.log('📸 Capturing attendance photo...');
      const photoData = await capturePhoto();
      
      if (!photoData) {
        Alert.alert(
          '📸 Photo Required', 
          'Please take a photo for attendance verification.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => handlePunchIn() }
          ]
        );
        setLoading(false);
        return;
      }
      
      setLastPhoto(photoData);
      console.log('✅ Photo captured successfully');
      
      // Step 4: Get location
      console.log('📍 Getting location...');
      const loc = await getLocationReading();
      
      if (!loc) {
        Alert.alert('📍 Location Error', 'Could not get your location. Please try again.');
        setLoading(false);
        return;
      }
      
      setLocation(loc);
      console.log('✅ Location obtained successfully');
      
      // Step 5: Get address
      console.log('🏠 Getting address...');
      const addr = await getAddressFromCoordinates(loc.latitude, loc.longitude);
      setAddress(addr);
      console.log('✅ Address obtained successfully');
      
      // Step 6: Complete punch in
      setIsCheckedIn(true);
      const punchInTime = new Date();
      setCheckInTime(punchInTime);
      
      // Success message with all data
      Alert.alert(
        '🎉 Punch In Successful!', 
        `⏰ Time: ${punchInTime.toLocaleTimeString()}\n` +
        `📸 Photo: ✅ Captured\n` +
        `📍 Location: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}\n` +
        `🏠 Address: ${addr.cleanAddress}`,
        [{ text: 'Great!' }]
      );
      
      console.log('🎉 Punch in completed successfully!');
      
    } catch (error) {
      console.error('❌ Punch in failed:', error);
      Alert.alert('❌ Punch In Failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Punch Out logic with camera
  const handlePunchOut = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      console.log('🏁 Starting punch out process with camera...');
      
      // Step 1: Check permissions
      let hasCameraPermission = cameraPermission;
      if (!hasCameraPermission) {
        hasCameraPermission = await requestCameraPermission();
        if (!hasCameraPermission) {
          setLoading(false);
          return;
        }
      }
      
      let hasLocationPermission = locationPermission;
      if (!hasLocationPermission) {
        hasLocationPermission = await requestLocationPermission();
        if (!hasLocationPermission) {
          setLoading(false);
          return;
        }
      }
      
      // Step 2: Capture photo
      console.log('📸 Capturing punch out photo...');
      const photoData = await capturePhoto();
      
      if (!photoData) {
        Alert.alert(
          '📸 Photo Required', 
          'Please take a photo for punch out verification.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => handlePunchOut() }
          ]
        );
        setLoading(false);
        return;
      }
      
      setLastPhoto(photoData);
      
      // Step 3: Get location
      const loc = await getLocationReading();
      if (!loc) {
        Alert.alert('📍 Location Error', 'Could not get your location. Please try again.');
        setLoading(false);
        return;
      }
      
      setLocation(loc);
      
      // Step 4: Get address
      const addr = await getAddressFromCoordinates(loc.latitude, loc.longitude);
      setAddress(addr);
      
      // Step 5: Complete punch out
      setIsCheckedIn(false);
      const punchOutTime = new Date();
      setCheckOutTime(punchOutTime);
      setWorkingHours('00:00:00');
      
      // Calculate total working time
      if (checkInTime) {
        const totalTime = punchOutTime - checkInTime;
        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        
        Alert.alert(
          '🎉 Punch Out Successful!',
          `⏰ Time: ${punchOutTime.toLocaleTimeString()}\n` +
          `⏱️ Total Time: ${hours}h ${minutes}m\n` +
          `📸 Photo: ✅ Captured\n` +
          `📍 Location: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}\n` +
          `🏠 Address: ${addr.cleanAddress}`,
          [{ text: 'Excellent!' }]
        );
      }
      
    } catch (error) {
      console.error('❌ Punch out failed:', error);
      Alert.alert('❌ Punch Out Failed', 'Something went wrong. Please try again.');
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


