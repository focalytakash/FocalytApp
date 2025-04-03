
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

// Import screens
import LoginScreen from './src/components/layouts/login/login';
// Import other screens
// import DashboardScreen from './src/pages/Dashboard';
// import SignUpScreen from './src/pages/SignUp';
// import ForgotPasswordScreen from './src/pages/ForgotPassword';


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
        
        {/* Add other screens to your navigation stack */}
        {/* 
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ headerShown: false }}
        />
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

// import { View, Text, Image, StyleSheet } from 'react-native';

// function App() {
//   return (
//     <View style={styles.container}>
//       <View style={styles.row}>
//         <View style={styles.col}>
//           <View style={styles.logoContainer}>
//             <Image
//               source={require('./assets/images/logo/focalyt_new_logo.png')}
//               style={styles.logo}
//             />
//           </View>
//           <View style={styles.loginContainer}>
//             <Text style={styles.loginText}>Focalyt</Text>
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20 },
//   row: { flexDirection: 'row' },
//   col: { flex: 1 },
//   logoContainer: { alignItems: 'center', marginBottom: 20 },
//   logo: { width: 100, height: 100, resizeMode: 'contain' },
//   loginContainer: { alignItems: 'center' },
//   loginText: { fontSize: 24, fontWeight: 'bold' },
// });

// export default App;
