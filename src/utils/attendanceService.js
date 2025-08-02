import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for attendance records
const ATTENDANCE_RECORDS_KEY = 'attendance_records';

// Save attendance record with photo + location
export const saveAttendanceRecord = async (photoData, locationData, attendanceType) => {
  try {
    console.log('💾 Saving attendance record...');
    
    const attendanceRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      type: attendanceType, // 'punch_in' or 'punch_out'
      
      // Photo data - handle null case for simple mode
      photo: photoData ? {
        uri: photoData.uri,
        fileName: photoData.fileName,
        fileSize: photoData.fileSize,
        capturedAt: photoData.timestamp,
      } : {
        uri: null,
        fileName: 'No photo',
        fileSize: 0,
        capturedAt: new Date().toISOString(),
      },
      
      // Location data - handle null case for simple mode
      location: locationData ? {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp,
        address: `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
      } : {
        latitude: null,
        longitude: null,
        accuracy: null,
        timestamp: new Date().toISOString(),
        address: 'No location tracking',
      },
      
      // Additional metadata
      deviceInfo: {
        platform: require('react-native').Platform.OS,
        timestamp: new Date().toISOString(),
      }
    };

    // Get existing records
    const existingRecords = await getAttendanceRecords();
    
    // Add new record
    existingRecords.push(attendanceRecord);
    
    // Keep only last 100 records to save storage
    if (existingRecords.length > 100) {
      existingRecords.splice(0, existingRecords.length - 100);
    }

    // Save to storage
    await AsyncStorage.setItem(ATTENDANCE_RECORDS_KEY, JSON.stringify(existingRecords));
    
    console.log('✅ Attendance record saved:', {
      id: attendanceRecord.id,
      type: attendanceType,
      timestamp: attendanceRecord.timestamp,
      hasPhoto: !!photoData,
      hasLocation: !!locationData
    });
    
    return attendanceRecord;
    
  } catch (error) {
    console.error('❌ Failed to save attendance record:', error);
    throw error;
  }
};

// Get all attendance records
export const getAttendanceRecords = async () => {
  try {
    const data = await AsyncStorage.getItem(ATTENDANCE_RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get attendance records:', error);
    return [];
  }
};

// Get today's attendance records
export const getTodaysAttendanceRecords = async () => {
  try {
    const allRecords = await getAttendanceRecords();
    const today = new Date().toISOString().split('T')[0];
    
    return allRecords.filter(record => record.date === today);
  } catch (error) {
    console.error('Failed to get today\'s records:', error);
    return [];
  }
};

// Get attendance record by ID
export const getAttendanceRecordById = async (recordId) => {
  try {
    const allRecords = await getAttendanceRecords();
    return allRecords.find(record => record.id === recordId);
  } catch (error) {
    console.error('Failed to get record by ID:', error);
    return null;
  }
};

// Get user's last punch in location
export const getLastPunchInLocation = async () => {
  try {
    const todayRecords = await getTodaysAttendanceRecords();
    const punchInRecords = todayRecords.filter(record => record.type === 'punch_in');
    
    if (punchInRecords.length > 0) {
      const lastPunchIn = punchInRecords[punchInRecords.length - 1];
      return {
        location: lastPunchIn.location,
        photo: lastPunchIn.photo,
        timestamp: lastPunchIn.timestamp
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get last punch in location:', error);
    return null;
  }
};

// Get attendance summary for today
export const getTodaysAttendanceSummary = async () => {
  try {
    const todayRecords = await getTodaysAttendanceRecords();
    
    const punchInRecords = todayRecords.filter(record => record.type === 'punch_in');
    const punchOutRecords = todayRecords.filter(record => record.type === 'punch_out');
    
    return {
      totalRecords: todayRecords.length,
      punchInCount: punchInRecords.length,
      punchOutCount: punchOutRecords.length,
      lastPunchIn: punchInRecords.length > 0 ? punchInRecords[punchInRecords.length - 1] : null,
      lastPunchOut: punchOutRecords.length > 0 ? punchOutRecords[punchOutRecords.length - 1] : null,
      hasLocationData: todayRecords.every(record => record.location && record.location.latitude),
      hasPhotoData: todayRecords.every(record => record.photo && record.photo.uri),
    };
  } catch (error) {
    console.error('Failed to get attendance summary:', error);
    return {
      totalRecords: 0,
      punchInCount: 0,
      punchOutCount: 0,
      lastPunchIn: null,
      lastPunchOut: null,
      hasLocationData: false,
      hasPhotoData: false,
    };
  }
};

// Format location for display
export const formatAttendanceLocation = (locationData) => {
  if (!locationData || !locationData.latitude) return '📍 Location not available';
  
  return `📍 ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)} (±${Math.round(locationData.accuracy)}m)`;
};

// Format attendance record for display
export const formatAttendanceRecord = (record) => {
  if (!record) return 'No record available';
  
  const time = new Date(record.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const type = record.type === 'punch_in' ? 'Punch In' : 'Punch Out';
  const location = formatAttendanceLocation(record.location);
  
  return `${type} at ${time}\n${location}`;
};

// Clear all attendance records
export const clearAttendanceRecords = async () => {
  try {
    await AsyncStorage.removeItem(ATTENDANCE_RECORDS_KEY);
    console.log('All attendance records cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear attendance records:', error);
    return false;
  }
}; 