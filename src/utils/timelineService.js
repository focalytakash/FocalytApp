import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAttendanceRecords, getTodaysAttendanceRecords } from './attendanceService';

// Storage keys
const TIMELINE_DATA_KEY = 'timeline_data';
const WORKDAY_LOCATIONS_KEY = 'workdayLocations';

// Timeline activity types
export const ACTIVITY_TYPES = {
  WALKING: 'walking',
  PLACE_VISIT: 'place',
  WORK_START: 'work_start',
  WORK_END: 'work_end',
  BREAK: 'break',
  MEETING: 'meeting',
};

// Process attendance records into timeline activities
export const processAttendanceToTimeline = async (date = new Date()) => {
  try {
    const targetDate = date.toISOString().split('T')[0];
    const allRecords = await getAttendanceRecords();
    const dayRecords = allRecords.filter(record => record.date === targetDate);
    
    const activities = [];
    
    if (dayRecords.length > 0) {
      // Sort records by timestamp
      dayRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Create work activities from punch in/out
      dayRecords.forEach((record, index) => {
        if (record.type === 'punch_in') {
          activities.push({
            id: `work_start_${record.id}`,
            type: ACTIVITY_TYPES.WORK_START,
            icon: '🏢',
            title: 'Work Started',
            startTime: new Date(record.timestamp),
            location: record.location,
            address: record.location?.address || 'Unknown Location',
            duration: 0,
            distance: 0,
          });
        } else if (record.type === 'punch_out') {
          activities.push({
            id: `work_end_${record.id}`,
            type: ACTIVITY_TYPES.WORK_END,
            icon: '🏠',
            title: 'Work Ended',
            startTime: new Date(record.timestamp),
            location: record.location,
            address: record.location?.address || 'Unknown Location',
            duration: 0,
            distance: 0,
          });
        }
      });
      
      // Create walking activities between locations
      for (let i = 0; i < activities.length - 1; i++) {
        const currentActivity = activities[i];
        const nextActivity = activities[i + 1];
        
        if (currentActivity.location && nextActivity.location) {
          const distance = calculateDistance(
            currentActivity.location.latitude,
            currentActivity.location.longitude,
            nextActivity.location.latitude,
            nextActivity.location.longitude
          );
          
          const duration = (new Date(nextActivity.startTime) - new Date(currentActivity.startTime)) / (1000 * 60 * 60); // hours
          
          if (distance > 0.01) { // Only add walking if distance > 10 meters
            activities.splice(i + 1, 0, {
              id: `walking_${currentActivity.id}_${nextActivity.id}`,
              type: ACTIVITY_TYPES.WALKING,
              icon: '🚶',
              title: 'Walking',
              startTime: new Date(currentActivity.startTime),
              endTime: new Date(nextActivity.startTime),
              duration: duration,
              distance: distance,
              locations: [currentActivity.location, nextActivity.location],
            });
            i++; // Skip the walking activity we just inserted
          }
        }
      }
    }
    
    return activities;
  } catch (error) {
    console.error('Error processing attendance to timeline:', error);
    return [];
  }
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Get timeline data for a specific date
export const getTimelineData = async (date = new Date()) => {
  try {
    const targetDate = date.toISOString().split('T')[0];
    
    // Try to get cached timeline data
    const cachedData = await AsyncStorage.getItem(`${TIMELINE_DATA_KEY}_${targetDate}`);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      // Convert string dates back to Date objects
      return parsed.map(activity => ({
        ...activity,
        startTime: new Date(activity.startTime),
        endTime: activity.endTime ? new Date(activity.endTime) : null,
      }));
    }
    
    // Process attendance data
    const activities = await processAttendanceToTimeline(date);
    
    // Cache the processed data
    await AsyncStorage.setItem(`${TIMELINE_DATA_KEY}_${targetDate}`, JSON.stringify(activities));
    
    return activities;
  } catch (error) {
    console.error('Error getting timeline data:', error);
    return [];
  }
};

// Get timeline statistics for a date
export const getTimelineStats = async (date = new Date()) => {
  try {
    const activities = await getTimelineData(date);
    
    const totalDistance = activities
      .filter(activity => activity.type === ACTIVITY_TYPES.WALKING)
      .reduce((sum, activity) => sum + (activity.distance || 0), 0);
    
    const totalDuration = activities
      .filter(activity => activity.type === ACTIVITY_TYPES.WALKING)
      .reduce((sum, activity) => sum + (activity.duration || 0), 0);
    
    const visits = activities.filter(activity => 
      activity.type === ACTIVITY_TYPES.PLACE_VISIT || 
      activity.type === ACTIVITY_TYPES.WORK_START || 
      activity.type === ACTIVITY_TYPES.WORK_END
    ).length;
    
    return {
      totalDistance,
      totalDuration,
      visits,
      activities: activities.length,
    };
  } catch (error) {
    console.error('Error getting timeline stats:', error);
    return {
      totalDistance: 0,
      totalDuration: 0,
      visits: 0,
      activities: 0,
    };
  }
};

// Add a custom timeline activity
export const addTimelineActivity = async (activity, date = new Date()) => {
  try {
    const targetDate = date.toISOString().split('T')[0];
    const existingActivities = await getTimelineData(date);
    
    const newActivity = {
      id: `custom_${Date.now()}`,
      ...activity,
      startTime: new Date(),
    };
    
    existingActivities.push(newActivity);
    
    // Sort by start time
    existingActivities.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    // Update cache
    await AsyncStorage.setItem(`${TIMELINE_DATA_KEY}_${targetDate}`, JSON.stringify(existingActivities));
    
    return newActivity;
  } catch (error) {
    console.error('Error adding timeline activity:', error);
    throw error;
  }
};

// Update a timeline activity
export const updateTimelineActivity = async (activityId, updates, date = new Date()) => {
  try {
    const targetDate = date.toISOString().split('T')[0];
    const activities = await getTimelineData(date);
    
    const updatedActivities = activities.map(activity => 
      activity.id === activityId ? { ...activity, ...updates } : activity
    );
    
    // Update cache
    await AsyncStorage.setItem(`${TIMELINE_DATA_KEY}_${targetDate}`, JSON.stringify(updatedActivities));
    
    return updatedActivities.find(activity => activity.id === activityId);
  } catch (error) {
    console.error('Error updating timeline activity:', error);
    throw error;
  }
};

// Delete a timeline activity
export const deleteTimelineActivity = async (activityId, date = new Date()) => {
  try {
    const targetDate = date.toISOString().split('T')[0];
    const activities = await getTimelineData(date);
    
    const filteredActivities = activities.filter(activity => activity.id !== activityId);
    
    // Update cache
    await AsyncStorage.setItem(`${TIMELINE_DATA_KEY}_${targetDate}`, JSON.stringify(filteredActivities));
    
    return true;
  } catch (error) {
    console.error('Error deleting timeline activity:', error);
    throw error;
  }
};

// Clear timeline cache for a date
export const clearTimelineCache = async (date = new Date()) => {
  try {
    const targetDate = date.toISOString().split('T')[0];
    await AsyncStorage.removeItem(`${TIMELINE_DATA_KEY}_${targetDate}`);
    return true;
  } catch (error) {
    console.error('Error clearing timeline cache:', error);
    return false;
  }
};

// Get available dates with timeline data
export const getTimelineDates = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const timelineKeys = keys.filter(key => key.startsWith(TIMELINE_DATA_KEY));
    
    return timelineKeys.map(key => {
      const dateStr = key.replace(`${TIMELINE_DATA_KEY}_`, '');
      return new Date(dateStr);
    }).sort((a, b) => b - a); // Sort descending (most recent first)
  } catch (error) {
    console.error('Error getting timeline dates:', error);
    return [];
  }
};

// Format duration for display
export const formatDuration = (hours) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours} hr ${minutes} min`;
};

// Format time for display
export const formatTime = (date) => {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Format date for display
export const formatDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }
}; 