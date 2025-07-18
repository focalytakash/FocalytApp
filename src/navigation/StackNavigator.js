import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Dashboard from '../screens/Dashboard';
import AttendanceScreen from '../screens/AttendanceScreen';

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#1E293B',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerLeft: () => null, // Settings button is now in individual screens
      })}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={Dashboard}
        options={{
          title: '🏠 Dashboard',
          headerLeft: null, // No menu button on dashboard
        }}
      />
      <Stack.Screen 
        name="Attendance" 
        component={AttendanceScreen}
        options={{
          title: '📊 Attendance History',
        }}
      />

    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  menuIcon: {
    fontSize: 18,
  },
});

export default StackNavigator; 