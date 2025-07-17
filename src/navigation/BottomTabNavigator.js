import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, Alert, View } from 'react-native';

// Import your screens
import StackNavigator from './StackNavigator';
import AttendanceScreen from '../screens/AttendanceScreen';
import SettingsModal from '../screens/SettingsModal';

const Tab = createBottomTabNavigator();

// Custom Settings Tab Component
const SettingsTab = ({ navigation }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Auto-open settings modal when tab is pressed
  useEffect(() => {
    setShowSettingsModal(true);
  }, []);

  const handleCloseModal = () => {
    setShowSettingsModal(false);
    // Navigate back to Dashboard tab
    navigation.navigate('Dashboard');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={handleCloseModal}
        navigation={navigation}
      />
    </View>
  );
};

// Custom Logout Tab Component
const LogoutTab = ({ navigation }) => {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Add any logout logic here (clear tokens, etc.)
            navigation.navigate('Login');
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
            <Text style={{ fontSize: 24, color: '#dc3545' }}>🚪</Text>
          ),
          tabBarLabel: 'Logout',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            color: '#dc3545',
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator; 