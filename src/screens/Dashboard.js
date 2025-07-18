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
import { getLocationWithPermission, formatLocation } from '../utils/locationService';
import GPSStatus from '../components/GPSStatus';
import SettingsModal from './SettingsModal';


const { width } = Dimensions.get('window');

const Dashboard = ({ navigation }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workingHours, setWorkingHours] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // User Information
  const [userInfo] = useState({
    name: 'John Doe',
    designation: 'Software Developer',
    mobile: '+91 1234567890',
    email: 'john.doe@focalyt.com',
    location: 'Office',
    employeeId: 'EMP001'
  });

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

  // Handle Punch In
  const handlePunchIn = async () => {
    try {
      setLoading(true);
      
      // Get current location - GPS REQUIRED 
      const location = await getLocationWithPermission();
      
      // Check if location is available
      if (!location) {
        setLoading(false);
        Alert.alert(
          '📍 GPS Required',
          'Please enable GPS/Location services to punch in. Location is mandatory for attendance tracking.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable GPS', onPress: () => handlePunchIn() }
          ]
        );
        return; // Punch in nahi hoga without GPS
      }
      
      setCurrentLocation(location);
      const now = new Date();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsCheckedIn(true);
      setCheckInTime(now);
      setCheckOutTime(null);
      setLoading(false);
      
      Alert.alert(
        '🎉 Welcome Back!',
        `✅ Punch In: ${now.toLocaleTimeString()}\n📍 Location: ${formatLocation(location)}\n\nHave a productive day ahead!`,
        [{ text: 'Let\'s Go!', style: 'default' }]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('❌ Error', 'Failed to punch in. Please try again.');
    }
  };

  // Handle Punch Out
  const handlePunchOut = async () => {
    try {
      setLoading(true);
      
      // Get current location for punch out - GPS REQUIRED
      const location = await getLocationWithPermission();
      
      // Check if location is available
      if (!location) {
        setLoading(false);
        Alert.alert(
          '📍 GPS Required',
          'Please enable GPS/Location services to punch out. Location is mandatory for attendance tracking.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable GPS', onPress: () => handlePunchOut() }
          ]
        );
        return; // Punch out nahi hoga without GPS
      }
      
      setCurrentLocation(location);
      const now = new Date();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsCheckedIn(false);
      setCheckOutTime(now);
      setLoading(false);
      
      if (checkInTime) {
        const totalTime = now - checkInTime;
        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        
        Alert.alert(
          '🌟 Great Work Today!',
          `✅ Punch Out: ${now.toLocaleTimeString()}\n⏱️ Total Time: ${hours}h ${minutes}m\n📍 Location: ${formatLocation(location)}\n\nSee you tomorrow!`,
          [{ text: 'Thanks!', style: 'default' }]
        );
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('❌ Error', 'Failed to punch out. Please try again.');
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
                <Text style={styles.userName}>{userInfo.name}</Text>
                <Text style={styles.designation}>{userInfo.designation}</Text>
              </View>
            </View>
            <View style={styles.timeDisplay}>
              <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
              <Text style={styles.date}>{formatDate(currentTime)}</Text>
            </View>
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

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.sectionTitle}>👤 Employee Profile</Text>
            <GPSStatus 
              hasLocation={!!currentLocation}
              onRefresh={async () => {
                const location = await getLocationWithPermission();
                setCurrentLocation(location);
              }}
              showDetails={true}
            />
          </View>
          <View style={styles.profileGrid}>
            <View style={styles.profileItem}>
              <Text style={styles.profileIcon}>🆔</Text>
              <View>
                <Text style={styles.profileLabel}>Employee ID</Text>
                <Text style={styles.profileValue}>{userInfo.employeeId}</Text>
              </View>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileIcon}>📱</Text>
              <View>
                <Text style={styles.profileLabel}>Mobile</Text>
                <Text style={styles.profileValue}>{userInfo.mobile}</Text>
              </View>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileIcon}>✉️</Text>
              <View>
                <Text style={styles.profileLabel}>Email</Text>
                <Text style={styles.profileValue}>{userInfo.email}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.profileItem}
              onPress={async () => {
                const location = await getLocationWithPermission();
                setCurrentLocation(location);
              }}
            >
              <Text style={styles.profileIcon}>📍</Text>
              <View>
                <Text style={styles.profileLabel}>Current Location</Text>
                <Text style={styles.profileValue}>
                  {currentLocation ? formatLocation(currentLocation) : 'Tap to get location'}
                </Text>
              </View>
            </TouchableOpacity>
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
          {/* GPS Status Warning */}
          {!currentLocation && (
            <View style={styles.gpsWarning}>
              <Text style={styles.gpsWarningText}>
                ⚠️ GPS required for attendance tracking
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: isCheckedIn ? '#EF4444' : '#10B981',
              opacity: !currentLocation && !isCheckedIn ? 0.6 : 1,
            }]}
            onPress={isCheckedIn ? handlePunchOut : handlePunchIn}
            disabled={loading || (!currentLocation && !isCheckedIn)}
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
});

export default Dashboard;


