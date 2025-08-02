
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { requestAttendancePermissions } from './src/utils/permissionService';

function App() {
  // Optional: Request permissions on app start
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        // Uncomment below to request permissions on app launch
        // const permissions = await requestAttendancePermissions();
        // console.log('App permissions:', permissions);
      } catch (error) {
        console.error('Permission initialization error:', error);
      }
    };

    // Small delay to let the app load first
    setTimeout(initializePermissions, 2000);
  }, []);

  return (
    <>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <AppNavigator />
    </>
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
