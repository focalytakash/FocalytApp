# Google Timeline Feature for Employee App

## Overview
The Google Timeline feature allows employees to view their daily activities and movements in a timeline format similar to Google Maps. This feature tracks work activities, walking routes, and location visits throughout the day.

## Features

### 🗺️ Interactive Timeline View
- **Daily Activity Tracking**: View all activities for any selected date
- **Walking Routes**: See walking distances and durations between locations
- **Work Activities**: Track punch-in and punch-out times with locations
- **Location Visits**: View places visited during the day

### 📊 Activity Statistics
- **Total Distance**: Shows total walking distance for the day
- **Total Duration**: Displays total time spent walking
- **Visit Count**: Number of different places visited
- **Activity Count**: Total number of activities recorded

### 🎯 Interactive Features
- **Date Navigation**: Navigate between different dates using arrow buttons
- **Activity Editing**: Edit activity names and details
- **Location Confirmation**: Confirm if you're currently at a specific location
- **Activity Deletion**: Remove unwanted activities from the timeline
- **Data Refresh**: Refresh timeline data to get the latest information

### 🗺️ Map Integration
- **Route Visualization**: Interactive map showing walking routes
- **Location Markers**: Visual markers for visited places
- **Map Controls**: Re-center and navigation controls

## How to Use

### 1. Accessing the Timeline
- Open the employee app
- Navigate to the "Google Timeline" tab in the bottom navigation
- The timeline will automatically load today's activities

### 2. Navigating Dates
- Use the left arrow (←) to go to the previous day
- Use the right arrow (→) to go to the next day
- Tap on the date text to see a date picker (future enhancement)

### 3. Viewing Activities
- **Walking Activities**: Show distance and duration between locations
- **Work Activities**: Display punch-in/punch-out times with locations
- **Place Visits**: Show locations visited with addresses

### 4. Managing Activities
- **Edit Activity**: Tap the edit icon (✏️) next to any activity to modify its name
- **Delete Activity**: Tap the delete icon (🗑️) to remove an activity
- **Confirm Location**: Tap "Here" button to confirm you're at a specific location

### 5. Refreshing Data
- Tap the "🔄 Refresh Data" button to reload timeline data
- This will clear cached data and fetch fresh information

## Data Sources

The timeline integrates with the existing attendance system:

### Attendance Records
- **Punch-in Records**: Automatically creates "Work Started" activities
- **Punch-out Records**: Automatically creates "Work Ended" activities
- **Location Data**: Uses GPS coordinates from attendance records

### Walking Routes
- **Distance Calculation**: Uses Haversine formula to calculate distances between locations
- **Duration Calculation**: Calculates time spent between activities
- **Route Generation**: Creates walking activities between consecutive locations

## Technical Implementation

### Timeline Service (`src/utils/timelineService.js`)
- **Data Processing**: Converts attendance records to timeline activities
- **Caching**: Stores processed timeline data for better performance
- **CRUD Operations**: Add, update, delete timeline activities
- **Statistics**: Calculate daily statistics and metrics

### Timeline Screen (`src/screens/GoogleTimeline.jsx`)
- **UI Components**: Timeline view with activity cards
- **Interactive Elements**: Edit modals, confirmation dialogs
- **Real-time Updates**: Live data refresh and state management
- **Responsive Design**: Adapts to different screen sizes

## Data Structure

### Activity Object
```javascript
{
  id: "unique_activity_id",
  type: "walking|work_start|work_end|place",
  icon: "🚶|🏢|🏠|📍",
  title: "Activity Name",
  startTime: Date,
  endTime: Date, // for walking activities
  distance: number, // in kilometers
  duration: number, // in hours
  location: {
    latitude: number,
    longitude: number,
    address: string
  },
  address: string
}
```

### Statistics Object
```javascript
{
  totalDistance: number, // total walking distance
  totalDuration: number, // total walking time
  visits: number, // number of places visited
  activities: number // total number of activities
}
```

## Integration with Existing Features

### Attendance System
- **Automatic Integration**: Timeline automatically processes attendance records
- **Real-time Updates**: New attendance records appear in timeline
- **Location Tracking**: Uses GPS data from attendance punches

### Navigation
- **Bottom Tab**: Accessible via "Google Timeline" tab
- **Consistent UI**: Matches app's design language and navigation patterns

## Future Enhancements

### Planned Features
- **Date Picker**: Calendar view for date selection
- **Export Functionality**: Export timeline data to PDF/CSV
- **Route Visualization**: Actual map integration with route lines
- **Activity Categories**: Filter activities by type
- **Search Functionality**: Search for specific activities or locations
- **Sharing**: Share timeline with managers or colleagues

### Technical Improvements
- **Offline Support**: Work without internet connection
- **Background Sync**: Automatic data synchronization
- **Push Notifications**: Notifications for timeline updates
- **Analytics**: Usage statistics and insights

## Troubleshooting

### Common Issues

1. **No Activities Showing**
   - Check if you have attendance records for the selected date
   - Try refreshing the data using the refresh button
   - Ensure location permissions are enabled

2. **Incorrect Distances**
   - Verify GPS accuracy in device settings
   - Check if location services are enabled
   - Refresh data to recalculate distances

3. **Missing Locations**
   - Ensure attendance records include location data
   - Check if location permissions are granted
   - Verify internet connection for address resolution

### Support
For technical issues or feature requests, contact the development team or refer to the app's help documentation.

---

**Note**: This feature requires location permissions and attendance data to function properly. Make sure to grant necessary permissions when prompted. 