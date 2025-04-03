import Dashboard from '../screens/Dashboard';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} /> {/* ✅ yeh hona chahiye */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
