import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AddressPickup from '../components/AddressPickup/AddressPickup';
import CustomBtn from '../components/CustomBtn/CustomBtn';
import { useNavigation } from '@react-navigation/native';

const ChooseLocation = () => {
  const navigation = useNavigation();
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);

  const handlePickupLocationSelect = (location) => {
    console.log('Pickup location selected:', location);
    setPickupLocation(location);
  };

  const handleDropLocationSelect = (location) => {
    console.log('Drop location selected:', location);
    setDropLocation(location);
  };

  const onDone = () => {
    if (!pickupLocation || !dropLocation) {
      Alert.alert('Error', 'Please select both pickup and drop locations');
      return;
    }

    // Pass both locations back to Home screen
    navigation.navigate('Home', { 
      selectedLocation: dropLocation,
      pickupLocation: pickupLocation 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AddressPickup 
          placeholderText='Search Pickup location' 
          onLocationSelect={handlePickupLocationSelect}
        />
        <AddressPickup 
          placeholderText='Search Drop location' 
          onLocationSelect={handleDropLocationSelect}
        />
        <CustomBtn 
          btnText='Search' 
          btnStyle={styles.searchButton} 
          onPress={onDone}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  searchButton: {
    marginTop: 20,
  },
});

export default ChooseLocation;
