import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../components/layouts/login';
import BottomTabNavigator from './BottomTabNavigator';
import EmployeeProfile from '../screens/EmployeeProfile';
import ChooseLocation from '../screens/ChooseLocation';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainApp" component={BottomTabNavigator} />
        <Stack.Screen name="EmployeeProfile" component={EmployeeProfile} />
        <Stack.Screen name="ChooseLocation" component={ChooseLocation} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
