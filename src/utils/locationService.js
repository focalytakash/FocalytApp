import { PermissionsAndroid, Platform, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

// Request location permission
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Focalyt needs access to your location for accurate attendance tracking.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS handles permissions differently
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
};

// Get current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error('Location error:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
};

// Get location with permission check
export const getLocationWithPermission = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access in settings to use attendance features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => {} }
        ]
      );
      return null;
    }

    const location = await getCurrentLocation();
    return location;
  } catch (error) {
    console.error('Location service error:', error);
    
    // Check specific error types
    if (error.code === 1) {
      Alert.alert(
        'GPS is Disabled',
        'Please turn on GPS/Location services to get accurate attendance location.',
        [
          { text: 'Continue without GPS', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {} }
        ]
      );
    } else if (error.code === 2) {
      Alert.alert(
        'Location Unavailable',
        'Unable to get your location. Please check your GPS settings.',
        [
          { text: 'Continue without GPS', style: 'cancel' },
          { text: 'Retry', onPress: () => getLocationWithPermission() }
        ]
      );
    } else {
      Alert.alert(
        'Location Error', 
        'Unable to fetch your current location. You can continue without GPS.',
        [
          { text: 'Continue without GPS', style: 'cancel' },
          { text: 'Retry', onPress: () => getLocationWithPermission() }
        ]
      );
    }
    return null;
  }
};

// Format location for display
export const formatLocation = (location) => {
  if (!location) return 'Location not available';
  
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
};

// Check if location is within office radius (example)
export const isWithinOfficeRadius = (userLocation, officeLocation, radiusInMeters = 100) => {
  if (!userLocation || !officeLocation) return false;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = userLocation.latitude * Math.PI / 180;
  const φ2 = officeLocation.latitude * Math.PI / 180;
  const Δφ = (officeLocation.latitude - userLocation.latitude) * Math.PI / 180;
  const Δλ = (officeLocation.longitude - userLocation.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c;
  return distance <= radiusInMeters;
};

// Check if GPS is enabled and working
export const checkGPSStatus = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return { enabled: false, reason: 'Permission denied' };
    
    // Try to get location with short timeout
    const location = await new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 10000 
        }
      );
    });
    
    return { enabled: true, location };
  } catch (error) {
    return { enabled: false, reason: error.message };
  }
}; 