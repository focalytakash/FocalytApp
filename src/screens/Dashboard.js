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
} from 'react-native';
import { 
  saveAttendanceRecord, 
  getTodaysAttendanceSummary, 
  getLastPunchInLocation, 
  formatAttendanceLocation 
} from '../utils/attendanceService';
import { 
  requestAttendancePermissions, 
  checkAttendancePermissions, 
  showPermissionAlert 
} from '../utils/permissionService';
import { captureAttendancePhoto } from '../utils/cameraService';
import { getLocationWithPermission } from '../utils/locationService';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width } = Dimensions.get('window');

const Dashboard = ({ navigation }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workingHours, setWorkingHours] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [lastPunchInInfo, setLastPunchInInfo] = useState(null);

  // User Information
  const [userInfo, setUserInfo] = useState(null);

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
    console.log('userInfo', userInfo);
  }, [userInfo]);

  useEffect(() => {
    const showAllData = async () => {
      try {
        console.log('showAllData');
        const keys = await AsyncStorage.getAllKeys();
        console.log('keys', keys);
        const result = await AsyncStorage.multiGet(keys);
        console.log('result', result);
        result.forEach(([key, value]) => {
          console.log(`${key}: ${value}`);
        });
      } catch (error) {
        console.log('Error fetching AsyncStorage data:', error);
      }
    };
    showAllData();
  }, []);

  // Initialize app - simplified version
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing FocalytApp...');
        
        // Just load attendance data - no permissions needed
        await loadAttendanceData();
        
        console.log('✅ App initialized successfully');
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };
    
    // Small delay for better UX
    const timer = setTimeout(initializeApp, 1000);
    
    return () => clearTimeout(timer);
  }, []);



  // Check permissions status
  const checkPermissionStatus = async () => {
    try {
      const permissions = await checkAttendancePermissions();
      
      Alert.alert(
        'Permission Status',
        `Camera: ${permissions.camera ? '✅' : '❌'}\n` +
        `Location: ${permissions.location ? '✅' : '❌'}\n` +
        `Storage: ${permissions.storage ? '✅' : '❌'}\n` +
        `All Granted: ${permissions.allGranted ? '✅' : '❌'}`
      );
    } catch (error) {
      console.error('❌ Permission check failed:', error);
    }
  };

  // Load attendance data
  const loadAttendanceData = async () => {
    try {
      console.log('📊 Loading attendance data...');
      
      // Get today's attendance summary
      const summary = await getTodaysAttendanceSummary();
      setAttendanceSummary(summary);
      
      // Get last punch in location info
      const lastPunchIn = await getLastPunchInLocation();
      setLastPunchInInfo(lastPunchIn);
      
      console.log('📊 Attendance data loaded:', {
        totalRecords: summary.totalRecords,
        hasLastPunchIn: !!lastPunchIn,
      });
      
    } catch (error) {
      console.error('❌ Failed to load attendance data:', error);
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate working hours
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

  // Enhanced Punch In with Camera + Location + Permissions
  const handlePunchIn = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      console.log('🚀 Starting enhanced punch in with permissions...');
      
      // Step 1: Request all required permissions
      const permissions = await requestAttendancePermissions();
      
      if (!permissions.allGranted) {
        Alert.alert(
          'Permissions Required',
          'Camera and Location permissions are required for attendance.\nPlease grant permissions to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Grant Permissions', 
              onPress: () => handlePunchIn() // Try again
            }
          ]
        );
        return;
      }
      
      console.log('✅ All permissions granted');
      
      // Step 2: Capture attendance photo
      console.log('📸 Capturing attendance photo...');
      const photoData = await captureAttendancePhoto();
      
      if (!photoData) {
        Alert.alert(
          'Photo Required',
          'Please take a photo for attendance verification.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => handlePunchIn() }
          ]
        );
        return;
      }
      
      console.log('✅ Photo captured successfully');
      
      // Step 3: Get current location
      console.log('📍 Getting current location...');
      const locationData = await getLocationWithPermission();
      
      // Note: Location can be optional - don't block if unavailable
      if (!locationData) {
        console.log('⚠️ Location not available, continuing without it');
      } else {
        console.log('✅ Location obtained successfully');
      }
      
      // Step 4: Save attendance record with photo and location
      await saveAttendanceRecord(photoData, locationData, 'punch_in');
      
      // Step 5: Update UI
      const now = new Date();
      setIsCheckedIn(true);
      setCheckInTime(now);
      setCheckOutTime(null);
      
      await loadAttendanceData();
      
      Alert.alert(
        'Success! 🎉', 
        `Punch In: ${now.toLocaleTimeString()}\n` +
        `Photo: ✅ Captured\n` +
        `Location: ${locationData ? '✅ Recorded' : '⚠️ Not available'}\n` +
        `Time recorded successfully!`
      );
      
    } catch (error) {
      console.error('❌ Enhanced punch in failed:', error);
      Alert.alert(
        'Punch In Failed', 
        'Something went wrong. Please try again.',
        [
          { text: 'OK' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Punch Out with Camera + Location + Permissions
  const handlePunchOut = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      console.log('🏁 Starting enhanced punch out...');
      
      // Step 1: Check permissions (should already be granted from punch in)
      const permissions = await checkAttendancePermissions();
      
      if (!permissions.allGranted) {
        // Request permissions if not available
        const newPermissions = await requestAttendancePermissions();
        if (!newPermissions.allGranted) {
          Alert.alert(
            'Permissions Required',
            'Camera and Location permissions are required for attendance verification.'
          );
          return;
        }
      }
      
      // Step 2: Capture punch out photo
      console.log('📸 Capturing punch out photo...');
      const photoData = await captureAttendancePhoto();
      
      if (!photoData) {
        Alert.alert(
          'Photo Required',
          'Please take a photo for punch out verification.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => handlePunchOut() }
          ]
        );
        return;
      }
      
      console.log('✅ Photo captured successfully');
      
      // Step 3: Get current location
      console.log('📍 Getting current location...');
      const locationData = await getLocationWithPermission();
      
      if (!locationData) {
        console.log('⚠️ Location not available, continuing without it');
      } else {
        console.log('✅ Location obtained successfully');
      }
      
      // Step 4: Save attendance record with photo and location
      await saveAttendanceRecord(photoData, locationData, 'punch_out');
      
      // Step 5: Update UI
      const now = new Date();
      setIsCheckedIn(false);
      setCheckOutTime(now);
      
      await loadAttendanceData();
      
      if (checkInTime) {
        const totalTime = now - checkInTime;
        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        
        Alert.alert(
          'Great Work! 🎉',
          `Punch Out: ${now.toLocaleTimeString()}\n` +
          `Total Time: ${hours}h ${minutes}m\n` +
          `Photo: ✅ Captured\n` +
          `Location: ${locationData ? '✅ Recorded' : '⚠️ Not available'}`
        );
      }
      
    } catch (error) {
      console.error('❌ Enhanced punch out failed:', error);
      Alert.alert(
        'Punch Out Failed', 
        'Something went wrong. Please try again.',
        [
          { text: 'OK' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
      {/* Floating Background Elements */}
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      
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
            
            {/* Permission Test Button */}
            <TouchableOpacity 
              style={styles.permissionTestButton}
              onPress={checkPermissionStatus}
            >
              <Text style={styles.permissionTestIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

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

        {/* Today's Attendance Records */}
        {attendanceSummary && attendanceSummary.totalRecords > 0 && (
          <View style={styles.attendanceRecordsCard}>
            <View style={styles.recordsHeader}>
              <Text style={styles.sectionTitle}>📊 Today's Attendance Records</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadAttendanceData}
              >
                <Text style={styles.refreshIcon}>🔄</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.recordsSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryIcon}>⏰</Text>
                <Text style={styles.summaryValue}>{attendanceSummary.totalRecords}</Text>
                <Text style={styles.summaryLabel}>Records</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryIcon}>🚀</Text>
                <Text style={styles.summaryValue}>{attendanceSummary.punchInCount}</Text>
                <Text style={styles.summaryLabel}>Punch In</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryIcon}>🏁</Text>
                <Text style={styles.summaryValue}>{attendanceSummary.punchOutCount}</Text>
                <Text style={styles.summaryLabel}>Punch Out</Text>
              </View>
            </View>
            
            {/* Remove location-related info since we're not tracking location anymore */}
            {lastPunchInInfo && (
              <View style={styles.lastRecordInfo}>
                <Text style={styles.lastRecordTitle}>⏰ Last Punch In Time:</Text>
                <Text style={styles.lastRecordLocation}>
                  📅 {new Date(lastPunchInInfo.timestamp).toLocaleString()}
                </Text>
              </View>
            )}
            
            {/* Remove photo and location status indicators */}
            <View style={styles.dataStatusRow}>
              <View style={styles.dataStatus}>
                <Text style={styles.statusSuccess}>
                  ⏰ ✅
                </Text>
                <Text style={styles.statusLabel}>Time Tracked</Text>
              </View>
              <View style={styles.dataStatus}>
                <Text style={styles.statusSuccess}>
                  📝 ✅
                </Text>
                <Text style={styles.statusLabel}>Records Saved</Text>
              </View>
            </View>
          </View>
        )}

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.sectionTitle}>👤 Employee Profile</Text>
            {/* Remove GPSStatus component */}
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
            {/* Remove Current Location item */}
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

        {/* Action Button */}
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
                  {isCheckedIn ? 'End your productive day' : 'Start your amazing journey'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🏢 Focalyt Attendance System</Text>
          <Text style={styles.footerSubText}>Empowering productivity, one check-in at a time</Text>
        </View>
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#3B82F6',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#10B981',
    top: 200,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#F59E0B',
    bottom: 300,
    right: -50,
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
  locationStatus: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationStatusText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
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
  gpsWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  gpsWarningText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
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
  // Attendance Records Card Styles
  attendanceRecordsCard: {
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
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 14,
  },
  recordsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  lastRecordInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  lastRecordTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  lastRecordLocation: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 2,
  },
  lastRecordTime: {
    fontSize: 11,
    color: '#64748B',
  },
  dataStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dataStatus: {
    alignItems: 'center',
  },
  statusSuccess: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusError: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  permissionTestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  permissionTestIcon: {
    fontSize: 20,
    color: '#1E293B',
  },
});

export default Dashboard;


