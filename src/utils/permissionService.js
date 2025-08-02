import { 
  check, request, requestMultiple, openSettings, PERMISSIONS, RESULTS 
} from 'react-native-permissions';
import { Platform, Alert } from 'react-native';

// Main function to request all required permissions
export const requestAttendancePermissions = async () => {
  const perms = Platform.select({
    android: [
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES // Android 13+
    ],
    ios: [
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      PERMISSIONS.IOS.PHOTO_LIBRARY
    ]
  });

  try {
    const statuses = await requestMultiple(perms);

    // Check for blocked permissions and show settings alert
    const blockedPermissions = Object.entries(statuses)
      .filter(([_, status]) => status === RESULTS.BLOCKED)
      .map(([permission, _]) => permission);

    if (blockedPermissions.length > 0) {
      Alert.alert(
        "Permission Required",
        `Please enable the following permissions in settings:\n${blockedPermissions.join('\n')}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings }
        ]
      );
    }

    // Calculate individual permissions properly
    const cameraGranted = Platform.OS === 'ios' 
      ? (statuses[PERMISSIONS.IOS.CAMERA] === RESULTS.GRANTED || statuses[PERMISSIONS.IOS.CAMERA] === RESULTS.LIMITED)
      : (statuses[PERMISSIONS.ANDROID.CAMERA] === RESULTS.GRANTED || statuses[PERMISSIONS.ANDROID.CAMERA] === RESULTS.LIMITED);
      
    const locationGranted = Platform.OS === 'ios'
      ? (statuses[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] === RESULTS.GRANTED || statuses[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] === RESULTS.LIMITED)
      : (statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === RESULTS.GRANTED || statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === RESULTS.LIMITED);
      
    const storageGranted = Platform.OS === 'ios'
      ? (statuses[PERMISSIONS.IOS.PHOTO_LIBRARY] === RESULTS.GRANTED || statuses[PERMISSIONS.IOS.PHOTO_LIBRARY] === RESULTS.LIMITED)
      : ((statuses[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] === RESULTS.GRANTED || statuses[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] === RESULTS.LIMITED) || 
         (statuses[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] === RESULTS.GRANTED || statuses[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] === RESULTS.LIMITED));

    // Return detailed results with fixed logic
    const result = {
      camera: cameraGranted,
      location: locationGranted,
      storage: storageGranted,
      allGranted: cameraGranted && locationGranted && storageGranted, // Fixed calculation
      statuses
    };

         console.log('🎯 FIXED Permission results:', result);
     console.log('📊 Individual checks:', {
       camera: cameraGranted,
       location: locationGranted, 
       storage: storageGranted
     });
    return result;

  } catch (error) {
    console.error('Permission request failed:', error);
    return { camera: false, location: false, storage: false, allGranted: false };
  }
};

// Check current permissions status without requesting
export const checkAttendancePermissions = async () => {
  const perms = Platform.select({
    android: [
      PERMISSIONS.ANDROID.CAMERA,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
    ],
    ios: [
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      PERMISSIONS.IOS.PHOTO_LIBRARY
    ]
  });

  try {
    const statuses = await Promise.all(perms.map(permission => check(permission)));
    const statusMap = perms.reduce((acc, permission, index) => {
      acc[permission] = statuses[index];
      return acc;
    }, {});

    // Calculate individual permissions properly
    const cameraGranted = Platform.OS === 'ios' 
      ? (statusMap[PERMISSIONS.IOS.CAMERA] === RESULTS.GRANTED || statusMap[PERMISSIONS.IOS.CAMERA] === RESULTS.LIMITED)
      : (statusMap[PERMISSIONS.ANDROID.CAMERA] === RESULTS.GRANTED || statusMap[PERMISSIONS.ANDROID.CAMERA] === RESULTS.LIMITED);
      
    const locationGranted = Platform.OS === 'ios'
      ? (statusMap[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] === RESULTS.GRANTED || statusMap[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] === RESULTS.LIMITED)
      : (statusMap[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === RESULTS.GRANTED || statusMap[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === RESULTS.LIMITED);
      
    const storageGranted = Platform.OS === 'ios'
      ? (statusMap[PERMISSIONS.IOS.PHOTO_LIBRARY] === RESULTS.GRANTED || statusMap[PERMISSIONS.IOS.PHOTO_LIBRARY] === RESULTS.LIMITED)
      : ((statusMap[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] === RESULTS.GRANTED || statusMap[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] === RESULTS.LIMITED) || 
         (statusMap[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] === RESULTS.GRANTED || statusMap[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] === RESULTS.LIMITED));

    const result = {
      camera: cameraGranted,
      location: locationGranted,
      storage: storageGranted,
      allGranted: cameraGranted && locationGranted && storageGranted, // Fixed calculation
      statuses: statusMap
    };

    console.log('✅ CHECK Permission results:', result);
    return result;
  } catch (error) {
    console.error('Permission check failed:', error);
    return { camera: false, location: false, storage: false, allGranted: false };
  }
};

// Individual permission requests
export const requestCameraPermission = async () => {
  const permission = Platform.select({
    android: PERMISSIONS.ANDROID.CAMERA,
    ios: PERMISSIONS.IOS.CAMERA
  });

  try {
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Camera permission error:', error);
    return false;
  }
};

export const requestLocationPermission = async () => {
  const permission = Platform.select({
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
  });

  try {
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Location permission error:', error);
    return false;
  }
};

// Helper to show manual settings prompt
export const showPermissionAlert = (permissionName) => {
  Alert.alert(
    "Permission Required",
    `${permissionName} permission is required for this feature. Please enable it in settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openSettings }
    ]
  );
}; 