import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  Image,
} from 'react-native';
import RNLocation from 'react-native-location';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import Geocoder from 'react-native-geocoding';
import { captureAttendancePhoto } from '../utils/cameraService';

const { width, height } = Dimensions.get('window');

const ExactLocationDetectorEnhanced = () => {
  const [location, setLocation] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [locationHistory, setLocationHistory] = useState([]);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [bestLocation, setBestLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [isGettingAddress, setIsGettingAddress] = useState(false);
  
  // Enhanced state for camera and photo
  const [photoData, setPhotoData] = useState(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [galleryPermission, setGalleryPermission] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const accuracyAnim = useRef(new Animated.Value(0)).current;

  // Configure RNLocation for maximum accuracy
  useEffect(() => {
    RNLocation.configure({
      distanceFilter: 0,
      desiredAccuracy: {
        ios: 'bestForNavigation',
        android: 'highAccuracy'
      },
      interval: 500,
      fastestInterval: 250,
      maxWaitTime: 5000,
      enableBackgroundLocationUpdates: false,
    });

    // Initialize Google Geocoding
    Geocoder.init('');
    
    // Check initial permissions
    checkAllPermissions();
  }, []);

  // Check all permissions (Location, Camera, Gallery)
  const checkAllPermissions = async () => {
    try {
      // Check location permission
      const locationPermission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      
      const locationResult = await check(locationPermission);
      setPermissionStatus(locationResult);
      
      // Check camera permission
      const cameraPermission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const cameraResult = await check(cameraPermission);
      setCameraPermission(cameraResult === RESULTS.GRANTED || cameraResult === RESULTS.LIMITED);
      
      // Check gallery permission
      const galleryPermission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.PHOTO_LIBRARY 
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
      
      const galleryResult = await check(galleryPermission);
      setGalleryPermission(galleryResult === RESULTS.GRANTED || galleryResult === RESULTS.LIMITED);
      
      console.log('🔐 Permission Status:', {
        location: locationResult,
        camera: cameraResult,
        gallery: galleryResult
      });
      
    } catch (error) {
      console.error('Permission check error:', error);
    }
  };

  // Request all permissions
  const requestAllPermissions = async () => {
    try {
      const permissions = Platform.select({
        android: [
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.CAMERA,
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        ],
        ios: [
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
          PERMISSIONS.IOS.CAMERA,
          PERMISSIONS.IOS.PHOTO_LIBRARY
        ]
      });

      const results = await Promise.all(permissions.map(permission => request(permission)));
      
      // Update permission states
      const locationResult = results[0];
      const cameraResult = results[1];
      const galleryResult = results[2];
      
      setPermissionStatus(locationResult);
      setCameraPermission(cameraResult === RESULTS.GRANTED || cameraResult === RESULTS.LIMITED);
      setGalleryPermission(galleryResult === RESULTS.GRANTED || galleryResult === RESULTS.LIMITED);
      
      Alert.alert(
        '🔐 Permissions Updated',
        `Location: ${locationResult === RESULTS.GRANTED ? '✅' : '❌'}\n` +
        `Camera: ${cameraResult === RESULTS.GRANTED ? '✅' : '❌'}\n` +
        `Gallery: ${galleryResult === RESULTS.GRANTED ? '✅' : '❌'}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  // Start pulse animation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Start scan animation
  const startScanAnimation = () => {
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  // Get single location reading
  const getLocationReading = async (attempt = 1) => {
    try {
      const location = await RNLocation.getLatestLocation({
        timeout: 15000,
        enableHighAccuracy: true,
        maximumAge: 30000,
      });

      if (location && location.latitude && location.longitude) {
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy || 1000,
          timestamp: location.timestamp || Date.now(),
          altitude: location.altitude,
          speed: location.speed,
          heading: location.heading,
          attempt: attempt,
        };
      }
      return null;
    } catch (error) {
      console.error(`Location reading attempt ${attempt} failed:`, error);
      return null;
    }
  };

  // Calculate average location from multiple readings
  const calculateAverageLocation = (locations) => {
    if (locations.length === 0) return null;

    const validLocations = locations.filter(loc => loc && loc.accuracy < 100);
    
    if (validLocations.length === 0) {
      const bestLocation = locations.reduce((best, current) => 
        current.accuracy < best.accuracy ? current : best
      );
      return bestLocation;
    }

    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    let minAccuracy = Math.min(...validLocations.map(loc => loc.accuracy));

    validLocations.forEach(loc => {
      const weight = 1 / (loc.accuracy / minAccuracy);
      weightedLat += loc.latitude * weight;
      weightedLng += loc.longitude * weight;
      totalWeight += weight;
    });

    const avgLat = weightedLat / totalWeight;
    const avgLng = weightedLng / totalWeight;
    const avgAccuracy = Math.min(...validLocations.map(loc => loc.accuracy));

    return {
      latitude: avgLat,
      longitude: avgLng,
      accuracy: avgAccuracy,
      timestamp: Date.now(),
      readings: validLocations.length,
      isAveraged: true,
    };
  };

  // Capture photo with location
  const capturePhotoWithLocation = async () => {
    if (!cameraPermission) {
      Alert.alert(
        '📸 Camera Permission Required',
        'Please grant camera permission to capture photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: requestAllPermissions }
        ]
      );
      return null;
    }

    try {
      setIsCapturingPhoto(true);
      console.log('📸 Capturing photo with location...');
      
      const photo = await captureAttendancePhoto();
      
      if (photo) {
        console.log('✅ Photo captured successfully');
        setPhotoData(photo);
        return photo;
      } else {
        console.log('❌ Photo capture failed');
        return null;
      }
    } catch (error) {
      console.error('❌ Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      return null;
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  // Enhanced location detection with photo capture
  const startEnhancedDetection = async () => {
    if (isDetecting) return;

    // Check location permission first
    if (permissionStatus !== RESULTS.GRANTED && permissionStatus !== RESULTS.LIMITED) {
      const granted = await requestAllPermissions();
      if (!granted) return;
    }

    setIsDetecting(true);
    setLocationHistory([]);
    setDetectionProgress(0);
    setCurrentAccuracy(null);
    setBestLocation(null);
    setPhotoData(null);
    
    // Start animations
    startPulseAnimation();
    startScanAnimation();

    const maxAttempts = 10;
    const locations = [];
    let progress = 0;

    try {
      Alert.alert(
        '🎯 Enhanced Location Detection',
        'This will capture your photo and get your exact location with maximum accuracy. Please stay still and ensure you have a clear view of the sky.',
        [{ text: 'OK' }]
      );

      // Step 1: Capture photo first
      console.log('📸 Step 1: Capturing photo...');
      setDetectionProgress(10);
      const photo = await capturePhotoWithLocation();
      
      if (!photo) {
        Alert.alert(
          '📸 Photo Required',
          'Please take a photo to continue with location detection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => startEnhancedDetection() }
          ]
        );
        return;
      }

      // Step 2: Get location readings
      console.log('📍 Step 2: Getting location readings...');
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        progress = 10 + (attempt / maxAttempts) * 80; // 10-90%
        setDetectionProgress(progress);

        const locationReading = await getLocationReading(attempt);
        
        if (locationReading) {
          locations.push(locationReading);
          setLocationHistory(prev => [...prev, locationReading]);
          
          setCurrentAccuracy(locationReading.accuracy);
          
          if (!bestLocation || locationReading.accuracy < bestLocation.accuracy) {
            setBestLocation(locationReading);
          }

          if (locationReading.accuracy < 5) {
            console.log('🎯 Excellent accuracy achieved!');
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Step 3: Calculate final location
      console.log('🎯 Step 3: Calculating final location...');
      setDetectionProgress(95);
      const finalLocation = calculateAverageLocation(locations);
      
      if (finalLocation) {
        setLocation(finalLocation);
        
        Animated.timing(accuracyAnim, {
          toValue: Math.min(1, finalLocation.accuracy / 50),
          duration: 1000,
          useNativeDriver: false,
        }).start();

        setDetectionProgress(100);

        Alert.alert(
          '✅ Enhanced Detection Complete!',
          `📸 Photo: ✅ Captured\n` +
          `📍 Accuracy: ${finalLocation.accuracy.toFixed(1)}m\n` +
          `📊 Readings: ${finalLocation.readings || 1}\n\n` +
          `Latitude: ${finalLocation.latitude.toFixed(6)}\n` +
          `Longitude: ${finalLocation.longitude.toFixed(6)}`,
          [{ text: 'Excellent!' }]
        );
      } else {
        Alert.alert(
          '❌ Detection Failed',
          'Could not get accurate location. Please try again in an open area.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Enhanced detection error:', error);
      Alert.alert('Error', 'Enhanced detection failed. Please try again.');
    } finally {
      setIsDetecting(false);
      setDetectionProgress(0);
      
      pulseAnim.stopAnimation();
      scanAnim.stopAnimation();
    }
  };

  // Stop detection
  const stopDetection = () => {
    setIsDetecting(false);
    setDetectionProgress(0);
    pulseAnim.stopAnimation();
    scanAnim.stopAnimation();
  };

  // Clear results
  const clearResults = () => {
    setLocation(null);
    setLocationHistory([]);
    setBestLocation(null);
    setCurrentAccuracy(null);
    setAddress(null);
    setPhotoData(null);
    accuracyAnim.setValue(0);
  };

  // Quick test with photo
  const quickTestWithPhoto = async () => {
    if (isDetecting) return;

    if (permissionStatus !== RESULTS.GRANTED && permissionStatus !== RESULTS.LIMITED) {
      const granted = await requestAllPermissions();
      if (!granted) return;
    }

    setIsDetecting(true);
    setLocationHistory([]);
    setDetectionProgress(0);
    setCurrentAccuracy(null);
    setBestLocation(null);
    setPhotoData(null);

    try {
      Alert.alert(
        '🧪 Quick Test with Photo',
        'This will take 5-10 seconds for a quick location test with photo capture.',
        [{ text: 'OK' }]
      );

      // Capture photo
      setDetectionProgress(20);
      const photo = await capturePhotoWithLocation();
      
      if (!photo) {
        Alert.alert('📸 Photo Required', 'Please take a photo to continue.');
        setIsDetecting(false);
        return;
      }

      // Get 3 quick readings
      const locations = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        setDetectionProgress(20 + (attempt / 3) * 70);
        
        const locationReading = await getLocationReading(attempt);
        if (locationReading) {
          locations.push(locationReading);
          setLocationHistory(prev => [...prev, locationReading]);
          setCurrentAccuracy(locationReading.accuracy);
          
          if (!bestLocation || locationReading.accuracy < bestLocation.accuracy) {
            setBestLocation(locationReading);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const finalLocation = calculateAverageLocation(locations);
      
      if (finalLocation) {
        setLocation(finalLocation);
        setDetectionProgress(100);
        Alert.alert(
          '✅ Quick Test Complete!',
          `📸 Photo: ✅ Captured\n` +
          `📍 Accuracy: ${finalLocation.accuracy.toFixed(1)}m\n` +
          `📊 Readings: ${finalLocation.readings || 1}\n\n` +
          `Latitude: ${finalLocation.latitude.toFixed(6)}\n` +
          `Longitude: ${finalLocation.longitude.toFixed(6)}`,
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert(
          '❌ Quick Test Failed',
          'Could not get location. Please try again.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Quick test error:', error);
      Alert.alert('Error', 'Quick test failed. Please try again.');
    } finally {
      setIsDetecting(false);
      setDetectionProgress(0);
    }
  };

  // Get accuracy color
  const getAccuracyColor = (accuracy) => {
    if (!accuracy) return '#8E8E93';
    if (accuracy < 5) return '#34C759';
    if (accuracy < 10) return '#30D158';
    if (accuracy < 20) return '#FF9500';
    if (accuracy < 50) return '#FF6B35';
    return '#FF3B30';
  };

  // Get accuracy emoji
  const getAccuracyEmoji = (accuracy) => {
    if (!accuracy) return '❓';
    if (accuracy < 5) return '🎯';
    if (accuracy < 10) return '✅';
    if (accuracy < 20) return '👍';
    if (accuracy < 50) return '⚠️';
    return '❌';
  };

  // Get address from coordinates
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setIsGettingAddress(true);
      console.log('🗺️ Getting address for:', latitude, longitude);
      
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
          
          if (types.includes('street_number')) {
            address.streetNumber = component.long_name;
          } else if (types.includes('route')) {
            address.route = component.long_name;
          } else if (types.includes('locality')) {
            address.locality = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            address.administrativeArea = component.long_name;
          } else if (types.includes('postal_code')) {
            address.postalCode = component.long_name;
          } else if (types.includes('country')) {
            address.country = component.long_name;
          }
        });

        const cleanAddress = [
          address.streetNumber && address.route ? `${address.streetNumber} ${address.route}` : address.route,
          address.locality,
          address.administrativeArea,
          address.postalCode,
          address.country
        ].filter(Boolean).join(', ');

        address.cleanAddress = cleanAddress;
        
        console.log('✅ Address found:', cleanAddress);
        return address;
      }
      
      throw new Error('No address found');
    } catch (error) {
      console.error('❌ Address lookup failed:', error);
      return {
        formattedAddress: 'Address not available',
        cleanAddress: 'Address not available',
        error: error.message
      };
    } finally {
      setIsGettingAddress(false);
    }
  };

  // Fetch address when final location is set
  useEffect(() => {
    if (location && location.latitude && location.longitude) {
      (async () => {
        const addr = await getAddressFromCoordinates(location.latitude, location.longitude);
        setAddress(addr);
      })();
    }
  }, [location]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Enhanced Location Detector</Text>
        <Text style={styles.subtitle}>High-precision GPS + Photo capture</Text>
      </View>

      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Permission Status</Text>
        <View style={styles.permissionGrid}>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionIcon}>📍</Text>
            <Text style={styles.permissionLabel}>Location</Text>
            <Text style={[styles.permissionStatus, { 
              color: permissionStatus === 'granted' ? '#34C759' : '#FF3B30' 
            }]}>
              {permissionStatus === 'granted' ? '✅' : '❌'}
            </Text>
          </View>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionIcon}>📸</Text>
            <Text style={styles.permissionLabel}>Camera</Text>
            <Text style={[styles.permissionStatus, { 
              color: cameraPermission ? '#34C759' : '#FF3B30' 
            }]}>
              {cameraPermission ? '✅' : '❌'}
            </Text>
          </View>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionIcon}>🖼️</Text>
            <Text style={styles.permissionLabel}>Gallery</Text>
            <Text style={[styles.permissionStatus, { 
              color: galleryPermission ? '#34C759' : '#FF3B30' 
            }]}>
              {galleryPermission ? '✅' : '❌'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.permissionButton} onPress={requestAllPermissions}>
          <Text style={styles.permissionButtonText}>🔐 Request All Permissions</Text>
        </TouchableOpacity>
      </View>

      {/* Detection Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Detection Controls</Text>
        
        {!isDetecting ? (
          <TouchableOpacity 
            style={[styles.detectButton, { backgroundColor: '#007AFF' }]} 
            onPress={startEnhancedDetection}
          >
            <Text style={styles.detectButtonText}>📸 Enhanced Detection (Photo + Location)</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.detectButton, { backgroundColor: '#FF3B30' }]} 
            onPress={stopDetection}
          >
            <Text style={styles.detectButtonText}>⏹️ Stop Detection</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.detectButton, { backgroundColor: '#8E8E93' }]} 
          onPress={clearResults}
        >
          <Text style={styles.detectButtonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.detectButton, { backgroundColor: '#FF6B35' }]} 
          onPress={quickTestWithPhoto}
          disabled={isDetecting}
        >
          <Text style={styles.detectButtonText}>
            {isDetecting ? '🧪 Testing...' : '🧪 Quick Test with Photo (5-10s)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.detectButton, { backgroundColor: '#4CAF50' }]} 
          onPress={async () => {
            if (isDetecting) return;
            
            setIsDetecting(true);
            try {
              if (permissionStatus !== RESULTS.GRANTED && permissionStatus !== RESULTS.LIMITED) {
                const granted = await requestAllPermissions();
                if (!granted) {
                  setIsDetecting(false);
                  return;
                }
              }

              const singleLocation = await getLocationReading(1);
              if (singleLocation) {
                setLocation(singleLocation);
                setBestLocation(singleLocation);
                setLocationHistory([singleLocation]);
                setCurrentAccuracy(singleLocation.accuracy);
                
                Alert.alert(
                  '✅ Single Test Complete!',
                  `📍 Accuracy: ${singleLocation.accuracy.toFixed(1)}m\n\nLatitude: ${singleLocation.latitude.toFixed(6)}\nLongitude: ${singleLocation.longitude.toFixed(6)}`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('❌ No Location', 'Could not get location. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Single test failed: ' + error.message);
            } finally {
              setIsDetecting(false);
            }
          }}
          disabled={isDetecting}
        >
          <Text style={styles.detectButtonText}>
            {isDetecting ? '📍 Testing...' : '📍 Single Test (3s)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.detectButton, { backgroundColor: '#9C27B0' }]} 
          onPress={async () => {
            if (!location || isGettingAddress) return;
            
            try {
              const addressResult = await getAddressFromCoordinates(location.latitude, location.longitude);
              setAddress(addressResult);
              
              if (addressResult.error) {
                Alert.alert('❌ Address Error', addressResult.error);
              } else {
                Alert.alert(
                  '🏠 Address Found!',
                  addressResult.cleanAddress,
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to get address: ' + error.message);
            }
          }}
          disabled={!location || isGettingAddress}
        >
          <Text style={styles.detectButtonText}>
            {isGettingAddress ? '🏠 Getting Address...' : '🏠 Get Address'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Detection Progress */}
      {isDetecting && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Detection Progress</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${detectionProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(detectionProgress)}%</Text>
          </View>

          <View style={styles.progressInfo}>
            <Text style={styles.progressInfoText}>
              {detectionProgress < 20 ? '📸 Capturing photo...' : 
               detectionProgress < 90 ? '📍 Getting location readings...' : 
               '🎯 Calculating final location...'}
            </Text>
            {currentAccuracy && (
              <Text style={styles.progressInfoText}>
                Current Accuracy: {currentAccuracy.toFixed(1)}m {getAccuracyEmoji(currentAccuracy)}
              </Text>
            )}
          </View>

          {/* Animated detection indicator */}
          <View style={styles.detectionIndicator}>
            <Animated.View 
              style={[
                styles.pulseCircle,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: getAccuracyColor(currentAccuracy || 100),
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.scanLine,
                {
                  transform: [{ translateX: scanAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, width - 60]
                  })}],
                }
              ]}
            />
          </View>
        </View>
      )}

      {/* Photo Display */}
      {photoData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Captured Photo</Text>
          <View style={styles.photoCard}>
            <Text style={styles.photoInfo}>
              📅 {new Date(photoData.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.photoInfo}>
              📁 {photoData.fileName || 'attendance_photo.jpg'}
            </Text>
            {photoData.fileSize && (
              <Text style={styles.photoInfo}>
                💾 {(photoData.fileSize / 1024).toFixed(1)} KB
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Current Best Location */}
      {bestLocation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Best Location So Far</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Latitude:</Text>
              <Text style={styles.locationValue}>{bestLocation.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Longitude:</Text>
              <Text style={styles.locationValue}>{bestLocation.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Accuracy:</Text>
              <Text style={[styles.locationValue, { color: getAccuracyColor(bestLocation.accuracy) }]}>
                {bestLocation.accuracy.toFixed(1)}m {getAccuracyEmoji(bestLocation.accuracy)}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Attempt:</Text>
              <Text style={styles.locationValue}>#{bestLocation.attempt}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Final Result */}
      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Final Result</Text>
          <View style={[styles.locationCard, { borderColor: getAccuracyColor(location.accuracy) }]}> 
            {/* Show full address as main line if available */}
            {address && address.formattedAddress ? (
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Full Address:</Text>
                <Text style={[styles.locationValue, styles.addressText]}>{address.formattedAddress}</Text>
              </View>
            ) : (
              <>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Latitude:</Text>
                  <Text style={styles.locationValue}>{location.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Longitude:</Text>
                  <Text style={styles.locationValue}>{location.longitude.toFixed(6)}</Text>
                </View>
              </>
            )}
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Accuracy:</Text>
              <Text style={[styles.locationValue, { color: getAccuracyColor(location.accuracy) }]}> {location.accuracy.toFixed(1)}m {getAccuracyEmoji(location.accuracy)} </Text>
            </View>
            {location.readings && (
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Readings Used:</Text>
                <Text style={styles.locationValue}>{location.readings}</Text>
              </View>
            )}
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Timestamp:</Text>
              <Text style={styles.locationValue}>{new Date(location.timestamp).toLocaleTimeString()}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Address Result */}
      {address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Address Information</Text>
          <View style={[styles.locationCard, { borderColor: address.error ? '#FF3B30' : '#34C759' }]}>
            {address.error ? (
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Error:</Text>
                <Text style={[styles.locationValue, { color: '#FF3B30' }]}>{address.error}</Text>
              </View>
            ) : (
              <>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Full Address:</Text>
                  <Text style={[styles.locationValue, styles.addressText]}>{address.formattedAddress}</Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Clean Address:</Text>
                  <Text style={[styles.locationValue, styles.addressText]}>{address.cleanAddress}</Text>
                </View>
                {address.streetNumber && address.route && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Street:</Text>
                    <Text style={styles.locationValue}>{address.streetNumber} {address.route}</Text>
                  </View>
                )}
                {address.locality && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>City:</Text>
                    <Text style={styles.locationValue}>{address.locality}</Text>
                  </View>
                )}
                {address.administrativeArea && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>State:</Text>
                    <Text style={styles.locationValue}>{address.administrativeArea}</Text>
                  </View>
                )}
                {address.postalCode && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Postal Code:</Text>
                    <Text style={styles.locationValue}>{address.postalCode}</Text>
                  </View>
                )}
                {address.country && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Country:</Text>
                    <Text style={styles.locationValue}>{address.country}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      )}

      {/* Location History */}
      {locationHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Detection History</Text>
          {locationHistory.map((loc, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyAttempt}>Attempt #{loc.attempt}</Text>
                <Text style={[styles.historyAccuracy, { color: getAccuracyColor(loc.accuracy) }]}>
                  {loc.accuracy.toFixed(1)}m {getAccuracyEmoji(loc.accuracy)}
                </Text>
              </View>
              <Text style={styles.historyCoords}>
                {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Instructions</Text>
        <Text style={styles.instruction}>• Grant Camera, Gallery, and Location permissions</Text>
        <Text style={styles.instruction}>• Move to an open area with clear sky view</Text>
        <Text style={styles.instruction}>• Stay still during detection</Text>
        <Text style={styles.instruction}>• Photo will be captured first, then location</Text>
        <Text style={styles.instruction}>• Wait 15-30 seconds for maximum accuracy</Text>
        <Text style={styles.instruction}>• Detection stops automatically at excellent accuracy</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  permissionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  permissionStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detectButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  detectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    minWidth: 40,
  },
  progressInfo: {
    marginBottom: 16,
  },
  progressInfoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  detectionIndicator: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.7,
  },
  scanLine: {
    position: 'absolute',
    width: 2,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 1,
  },
  photoCard: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#34C759',
  },
  photoInfo: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationCard: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyAttempt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  historyAccuracy: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyCoords: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  instruction: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  addressText: {
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
});

export default ExactLocationDetectorEnhanced;
