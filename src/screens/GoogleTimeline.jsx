import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import { 
  getTimelineData, 
  getTimelineStats, 
  formatDuration,
  formatTime,
  formatDate,
  addTimelineActivity,
  ACTIVITY_TYPES
} from '../utils/timelineService';

const { width, height } = Dimensions.get('window');

const GoogleTimeline = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineData, setTimelineData] = useState([]);
  const [todayStats, setTodayStats] = useState({
    totalDistance: 0,
    totalDuration: 0,
    visits: 0,
    activities: [],
  });
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStartLocation, setTrackingStartLocation] = useState(null);
  const [liveTrackingData, setLiveTrackingData] = useState([]);

  useEffect(() => {
    loadTimelineData();
    checkTrackingStatus();
  }, [selectedDate]);

  useEffect(() => {
    if (isTracking) {
      startLiveTracking();
    }
  }, [isTracking]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      
      // Get timeline data using the new service
      const activities = await getTimelineData(selectedDate);
      const stats = await getTimelineStats(selectedDate);
      
      setTimelineData(activities);
      setTodayStats(stats);
      
    } catch (error) {
      console.error('Error loading timeline data:', error);
      // Fallback to sample data if service fails
      createSampleTimelineData();
    } finally {
      setLoading(false);
    }
  };

  const checkTrackingStatus = async () => {
    try {
      // Check if user is currently checked in
      const attendanceRecords = await AsyncStorage.getItem('attendance_records');
      if (attendanceRecords) {
        const records = JSON.parse(attendanceRecords);
        const todayRecords = records.filter(record => 
          record.date === selectedDate.toISOString().split('T')[0]
        );
        
        // Check if last record is punch_in and no punch_out after it
        if (todayRecords.length > 0) {
          const lastRecord = todayRecords[todayRecords.length - 1];
          const hasPunchOut = todayRecords.some(record => 
            record.type === 'punch_out' && 
            new Date(record.timestamp) > new Date(lastRecord.timestamp)
          );
          
          if (lastRecord.type === 'punch_in' && !hasPunchOut) {
            setIsTracking(true);
            setTrackingStartLocation(lastRecord.location);
            setCurrentLocation(lastRecord.location);
            console.log('✅ Live tracking active from punch-in location');
          } else {
            setIsTracking(false);
            setTrackingStartLocation(null);
            console.log('❌ No active tracking found');
          }
        }
      }
    } catch (error) {
      console.error('Error checking tracking status:', error);
    }
  };

  const startLiveTracking = () => {
    if (!trackingStartLocation) return;
    
    console.log('🗺️ Starting live tracking from:', trackingStartLocation);
    
    // Simulate live location updates every 30 seconds
    const trackingInterval = setInterval(async () => {
      try {
        // Get latest attendance records to check for new locations
        const attendanceRecords = await AsyncStorage.getItem('attendance_records');
        if (attendanceRecords) {
          const records = JSON.parse(attendanceRecords);
          const todayRecords = records.filter(record => 
            record.date === selectedDate.toISOString().split('T')[0] &&
            record.type === 'punch_in' &&
            new Date(record.timestamp) >= new Date(trackingStartLocation.timestamp)
          );
          
          if (todayRecords.length > 0) {
            const latestRecord = todayRecords[todayRecords.length - 1];
            if (latestRecord.location) {
              setCurrentLocation(latestRecord.location);
              
              // Add to live tracking data if it's a new location
              const isNewLocation = !liveTrackingData.some(point => 
                point.latitude === latestRecord.location.latitude &&
                point.longitude === latestRecord.location.longitude
              );
              
              if (isNewLocation) {
                const newTrackingPoint = {
                  id: Date.now(),
                  location: latestRecord.location,
                  timestamp: new Date(),
                  type: 'tracking_point'
                };
                
                setLiveTrackingData(prev => [...prev, newTrackingPoint]);
                console.log('📍 New tracking point added:', newTrackingPoint);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error updating live tracking:', error);
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(trackingInterval);
  };

  const createSampleTimelineData = () => {
    const sampleData = [
      {
        id: 'walking-1',
        type: 'walking',
        icon: '🚶',
        title: 'Walking',
        distance: 29,
        duration: 15.3, // hours
        startTime: new Date('2024-01-15T06:00:00'),
        endTime: new Date('2024-01-15T21:18:00'),
        locations: [],
      },
      {
        id: 'place-1',
        type: 'place',
        icon: '📍',
        title: 'Focalyt: A Skill-Tech brand of Focal S...',
        address: 'SCF 3,4, 2nd floor, Shiva Complex, Patiala Rd, Zirakpur, Punjab',
        arrivalTime: new Date('2024-01-15T10:31:00'),
        location: { latitude: 30.7333, longitude: 76.7794 },
      },
      {
        id: 'place-2',
        type: 'place',
        icon: '🏢',
        title: 'Office Building',
        address: 'Tech Park, Sector 62, Noida, Uttar Pradesh',
        arrivalTime: new Date('2024-01-15T09:15:00'),
        location: { latitude: 28.6139, longitude: 77.2090 },
      },
    ];
    
    setTimelineData(sampleData);
    setTodayStats({
      totalDistance: 29,
      totalDuration: 15.3,
      visits: 2,
      activities: sampleData,
    });
  };

  const handleDateChange = (direction) => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const renderActivityItem = ({ item, index }) => {
    const isLast = index === timelineData.length - 1;
    
    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineDot, { 
            backgroundColor: item.type === 'walking' ? '#3B82F6' : 
                          item.type === 'work_start' ? '#10B981' :
                          item.type === 'work_end' ? '#F59E0B' : '#10B981'
          }]}>
            <Text style={styles.timelineDotIcon}>{item.icon}</Text>
          </View>
          {!isLast && <View style={styles.timelineLine} />}
        </View>
        
        <View style={styles.timelineContent}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          
          {item.type === 'walking' ? (
            <View>
              <Text style={styles.timelineDetails}>
                {item.distance} km • {formatDuration(item.duration)}
              </Text>
              <Text style={styles.timelineTime}>
                Arrived at {formatTime(item.endTime || item.startTime)}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.timelineAddress} numberOfLines={2}>
                {item.address || 'No address available'}
              </Text>
              <Text style={styles.timelineTime}>
                {formatTime(item.startTime)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.currentTime}>
            {new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          <TouchableOpacity style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>📹</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.screenTitle}>Live Map</Text>
        
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>📍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>📶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>📱</Text>
          </TouchableOpacity>
          <Text style={styles.batteryText}>82</Text>
          <TouchableOpacity style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>☁️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon}>
            <Text style={styles.topBarIconText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View - Main Focus */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>🗺️ Live Tracking Map</Text>
          <Text style={styles.mapPlaceholderSubtext}>
            {isTracking ? 'Live tracking active' : 'No active tracking'}
          </Text>
          
          {/* Starting Point Display */}
          {trackingStartLocation && (
            <View style={styles.startingPointInfo}>
              <Text style={styles.startingPointTitle}>🚀 Starting Point</Text>
              <Text style={styles.startingPointCoords}>
                {trackingStartLocation.latitude?.toFixed(6)}, {trackingStartLocation.longitude?.toFixed(6)}
              </Text>
              <Text style={styles.startingPointAddress}>
                {trackingStartLocation.address || 'Punch-in location'}
              </Text>
            </View>
          )}
          
          {/* Current Location Display */}
          {currentLocation && currentLocation !== trackingStartLocation && (
            <View style={styles.currentLocationInfo}>
              <Text style={styles.currentLocationTitle}>📍 Current Location</Text>
              <Text style={styles.currentLocationCoords}>
                {currentLocation.latitude?.toFixed(6)}, {currentLocation.longitude?.toFixed(6)}
              </Text>
              <Text style={styles.currentLocationAddress}>
                {currentLocation.address || 'Location address loading...'}
              </Text>
            </View>
          )}
          
          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapControlButton}>
              <Text style={styles.mapControlIcon}>📍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapControlButton}>
              <Text style={styles.mapControlIcon}>N</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.recenterButton}>
              <Text style={styles.recenterButtonText}>Re-centre</Text>
            </TouchableOpacity>
          </View>
          
          {/* Live Tracking Status */}
          <View style={styles.trackingStatus}>
            <View style={[styles.trackingIndicator, { 
              backgroundColor: isTracking ? '#10B981' : '#F59E0B' 
            }]}>
              <Text style={styles.trackingIndicatorText}>
                {isTracking ? '●' : '○'}
              </Text>
            </View>
            <Text style={styles.trackingText}>
              {isTracking ? 'Live Tracking Active' : 'No Active Tracking'}
            </Text>
            {isTracking && (
              <Text style={styles.trackingPoints}>
                {liveTrackingData.length} tracking points
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Activity Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => handleDateChange('prev')}
          >
            <Text style={styles.dateSelectorIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dateSelectorText}
          >
            <Text style={styles.dateSelectorText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => handleDateChange('next')}
          >
            <Text style={styles.dateSelectorIcon}>→</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryIcon}>🚶</Text>
          <Text style={styles.summaryDistance}>{todayStats.totalDistance} km</Text>
          <Text style={styles.summaryDuration}>{formatDuration(todayStats.totalDuration)}</Text>
          <Text style={styles.summaryIcon}>📍</Text>
          <Text style={styles.summaryVisits}>{todayStats.visits} visit{todayStats.visits !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading timeline...</Text>
          </View>
        ) : (
          <FlatList
            data={timelineData}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.timelineList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>No activities today</Text>
                <Text style={styles.emptySubtitle}>Your timeline will appear here once you start moving</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 10,
  },
  topBarIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  topBarIconText: {
    fontSize: 16,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 4,
  },
  mapContainer: {
    height: 300,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  startingPointInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startingPointTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  startingPointCoords: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  startingPointAddress: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  currentLocationInfo: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentLocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  currentLocationCoords: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  currentLocationAddress: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  mapControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'flex-end',
  },
  mapControlButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapControlIcon: {
    fontSize: 16,
    color: '#1E293B',
  },
  recenterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recenterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  trackingStatus: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingIndicatorText: {
    fontSize: 8,
    color: '#FFFFFF',
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  trackingPoints: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  dateSelectorIcon: {
    fontSize: 16,
    color: '#64748B',
    marginHorizontal: 8,
  },
  dateSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  summaryDistance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 16,
  },
  summaryDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 16,
  },
  summaryVisits: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  timelineContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timelineList: {
    paddingVertical: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timelineDotIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  timelineDetails: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  timelineAddress: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default GoogleTimeline; 