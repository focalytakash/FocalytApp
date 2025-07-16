
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

// Import screens
import LoginScreen from './src/components/layouts/login'
import DashboardScreen from './src/screens/Dashboard';


// Create navigation stack
const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ headerShown: false }}
        />
        
        {/* Add other screens to your navigation stack */}
        {/* 
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen} 
          options={{ headerShown: false }}
        />
        */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;


// import { NewAppScreen } from '@react-native/new-app-screen';
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';

// function App() {
//   const isDarkMode = useColorScheme() === 'dark';

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//       <NewAppScreen templateFileName="App.tsx" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

// export default App;
