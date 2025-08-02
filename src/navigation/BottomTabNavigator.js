import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, Alert, View } from 'react-native';

// Import your screens
import StackNavigator from './StackNavigator';
import AttendanceScreen from '../screens/AttendanceScreen';
import SidePanel from '../components/SidePanel';
import LocationTestPage from '../components/LocationTestPage';
import ExactLocationDetector from '../components/ExactLocationDetector';
import NewDashboard from '../screens/NewDashboard';
import GoogleTimeline from '../screens/GoogleTimeline';
import NativeMaps from '../screens/NativeMaps';
// Import auth utilities
import { logout } from '../utils/authUtils';
import DashboardEnhanced from '../screens/DashboardEnhanced';
import ExactLocationDetectorEnhanced from '../components/ExactLocationDetectorEnhanced';
import Home from '../screens/Home';
import ChooseLocation from '../screens/ChooseLocation';

const Tab = createBottomTabNavigator();

// Custom Settings Tab Component
const SettingsTab = ({ navigation }) => {
  const [showSidePanel, setShowSidePanel] = useState(true); // Start with panel open

  // Reset panel to visible every time this component mounts/focuses
  useEffect(() => {
    setShowSidePanel(true);
  }, []);

  // Listen for tab focus to reset panel
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setShowSidePanel(true);
    });

    return unsubscribe;
  }, [navigation]);

  const handleClosePanel = () => {
    setShowSidePanel(false);
    // Navigate back to Dashboard tab
    navigation.navigate('Dashboard');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <SidePanel
        visible={showSidePanel}
        onClose={handleClosePanel}
        navigation={navigation}
      />
      
      {/* Debug info */}
      <View style={{ position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.8)', padding: 10, borderRadius: 5 }}>
        <Text style={{ color: 'white', fontSize: 12 }}>SidePanel: {showSidePanel ? 'Visible' : 'Hidden'}</Text>
      </View>
    </View>
  );
};

// Custom Logout Tab Component
const LogoutTab = ({ navigation }) => {
  const handleLogout = async () => {
    Alert.alert(
      '🚪 Logout',
      'Do you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading
              Alert.alert('Logging out...', 'Please wait...');
              
              // Clear all stored data
              const logoutSuccess = await logout();
              
              if (logoutSuccess) {
                // Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
                console.log('✅ Logout successful, navigated to Login');
              } else {
                Alert.alert('❌ Error', 'Logout failed. Please try again.');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Logout failed: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
      }}
      onPress={handleLogout}
    >
      <Text style={{ fontSize: 16, color: '#dc3545', fontWeight: '600' }}>
        🚪 Logout
      </Text>
    </TouchableOpacity>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          marginBottom: 15,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false, // Hide headers since we're using bottom tabs
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={StackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
          tabBarLabel: 'Dashboard',
        }}
      />
      {/* <Tab.Screen
        name="DashboardEnhanced"
        component={DashboardEnhanced}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
          tabBarLabel: 'Dashboard Enhanced',
        }}
        /> */}
      
       <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>📊</Text>
          ),
          tabBarLabel: 'Attendance',
        }}
      /> 
      
      {/* <Tab.Screen
        name="LocationTest"
        component={LocationTestPage}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>📍</Text>
          ),
          tabBarLabel: 'Location Test',
        }}
      /> */}
<Tab.Screen name="NativeMaps" component={NativeMaps}  options={{
        tabBarIcon: ({ color, size }) => (
          <Text style={{ fontSize: 24, color }}>🗺️</Text>
        ),
        tabBarLabel: 'Native Maps',
      }}/>
      
      <Tab.Screen
        name="ExactLocation"
        component={ExactLocationDetector}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🎯</Text>
          ),
          tabBarLabel: 'Exact Location',
        }}
      />
      
      <Tab.Screen
        name="NewDashboard"
        component={NewDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🆕</Text>
          ),
          tabBarLabel: 'New Dashboard',
        }}
      />
      

      
      {/* <Tab.Screen
        name="GoogleTimeline"
        component={GoogleTimeline}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🗺️</Text>
          ),
          tabBarLabel: 'Google Timeline',
        }}
      /> */}

      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
          tabBarLabel: 'Home',
        }}
      />
      
      <Tab.Screen
        name="Settings"
        component={SettingsTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>⚙️</Text>
          ),
          tabBarLabel: 'Settings',
        }}
      />
      
      <Tab.Screen
        name="Logout"
        component={LogoutTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🚪</Text>
          ),
          tabBarLabel: 'Logout',
        }}
      />
      <Tab.Screen
        name="ChooseLocation"
        component={ChooseLocation}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🚪</Text>
          ),
          tabBarLabel: 'Logout',
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator; 