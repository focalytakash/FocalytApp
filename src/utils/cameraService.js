import { Alert } from 'react-native';
import { requestCameraPermission, showPermissionAlert } from './permissionService';

// Dynamic import with fallback
let launchCamera;
try {
  const ImagePicker = require('react-native-image-picker');
  launchCamera = ImagePicker.launchCamera;
  console.log('✅ react-native-image-picker loaded successfully');
} catch (error) {
  console.error('❌ react-native-image-picker not available:', error.message);
  launchCamera = null;
}

// Simple camera options for front camera
const getCameraOptions = () => ({
  mediaType: 'photo',
  includeBase64: false,
  maxHeight: 800,
  maxWidth: 800,
  quality: 0.8,
  cameraType: 'front', // Front camera for selfie
  allowsEditing: false,
  saveToPhotos: false,
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
});

// Simple front camera capture
export const captureAttendancePhoto = async () => {
  return new Promise(async (resolve) => {
    try {
      console.log('📸 Taking attendance photo...');
      
      // Check if camera library is available
      if (!launchCamera) {
        console.log('📸 Camera library not available, using test mode');
        
        Alert.alert(
          'Camera Not Available',
          'react-native-image-picker is not properly installed. Using test mode.',
          [
            { text: 'Cancel', onPress: () => resolve(null) },
            { 
              text: 'Use Test Photo', 
              onPress: () => {
                console.log('✅ Using test photo data');
                resolve({
                  uri: 'test://attendance.jpg',
                  fileName: `attendance_${Date.now()}.jpg`,
                  fileSize: 12345,
                  type: 'image/jpeg',
                  timestamp: new Date().toISOString(),
                });
              }
            }
          ]
        );
        return;
      }
      
      // Check camera permission using new permission service
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        showPermissionAlert('Camera');
        resolve(null);
        return;
      }
      
      console.log('📸 Launching camera...');
      
      // Launch camera
      launchCamera(getCameraOptions(), (response) => {
        console.log('Camera response:', response);
        
        if (response.didCancel) {
          console.log('User cancelled camera');
          resolve(null);
          return;
        }
        
        if (response.errorMessage) {
          console.error('Camera error:', response.errorMessage);
          Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
          resolve(null);
          return;
        }
        
        if (response.assets && response.assets[0]) {
          const photo = response.assets[0];
          console.log('Photo captured successfully');
          
          const photoData = {
            uri: photo.uri,
            fileName: photo.fileName || `attendance_${Date.now()}.jpg`,
            fileSize: photo.fileSize,
            type: photo.type,
            timestamp: new Date().toISOString(),
          };
          
          resolve(photoData);
        } else {
          console.log('No photo captured');
          Alert.alert('Photo Required', 'Please take a photo for attendance.');
          resolve(null);
        }
      });
      
    } catch (error) {
      console.error('Camera service error:', error);
      Alert.alert('Camera Error', 'Camera service failed. Please try again.');
      resolve(null);
    }
  });
};

// Simple photo data formatter
export const formatPhotoData = (photo) => {
  if (!photo) return null;
  
  return {
    uri: photo.uri,
    fileName: photo.fileName,
    timestamp: new Date().toISOString(),
    type: 'attendance_photo'
  };
}; 