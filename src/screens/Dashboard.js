import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Dashboard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard Screen</Text>
      <Text style={styles.subText}>Welcome to Focalyt Dashboard!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default Dashboard; 