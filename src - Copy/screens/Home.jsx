import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { ENV } from '../config/env';




const Home = ({ navigation, route }) => {
  const [state, setState] = useState({

    selectedLocation: null
  });

  const mapRef = useRef();
  const { pickupCord, droplocationCord, selectedLocation } = state;

  // Listen for route params when returning from ChooseLocation
  React.useEffect(() => {
    if (route.params?.selectedLocation) {
      const newLocation = route.params.selectedLocation;
      setState(prevState => ({
        ...prevState,
        droplocationCord: {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        selectedLocation: newLocation
      }));
    }

    // Handle pickup location if provided
    if (route.params?.pickupLocation) {
      const pickupLocation = route.params.pickupLocation;
      setState(prevState => ({
        ...prevState,
        pickupCord: {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }
      }));
    }
  }, [route.params]);

  const onPressLocation = () => {
    navigation.navigate('ChooseLocation');
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={pickupCord}
          ref={mapRef}
          mapType="standard"
        >
          <Marker
            coordinate={pickupCord}
            pinColor="green"
          // image={ImagePath.isCurLoc}
          />
          <Marker
            coordinate={droplocationCord}
            pinColor="red"
          />

          <MapViewDirections
            origin={pickupCord}
            destination={droplocationCord}
            apikey={ENV.GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="hotpink"
            optimizeWaypoints={true}
            precision="high"
            mode="DRIVING"
            language="en"
            region="IN"
            onReady={result => {
              console.log('✅ Directions loaded:', result);
              console.log('📏 Distance:', result.distance);
              console.log('⏱️ Duration:', result.duration);

              // Small delay to ensure map is ready
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.fitToCoordinates(result.coordinates, {
                    edgePadding: {
                      right: 50,
                      bottom: 300,
                      left: 50,
                      top: 100,
                    },
                    animated: true,
                  });
                }
              }, 500);
            }}
            onError={(errorMessage) => {
              console.log('❌ Directions Error:', errorMessage);
            }}
          />
        </MapView>


        <View style={styles.bottomCard}>
          <Text> where are you going?</Text>
          <TouchableOpacity style={styles.inputStyle} onPress={onPressLocation}>
            <Text>Choose Location</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bottomCard: {
    backgroundColor: 'white',
    width: '100%',
    padding: 30,
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
  },
  inputStyle: {
    backgroundColor: '#F8FAFC',
    height: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  }
});

export default Home;

// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// const Home = ({ navigation }) => {
//   return (
//     <View style={styles.container}>
//       <Text>Home</Text>
//       <TouchableOpacity onPress={() => navigation.navigate('ChooseLocation')}>
//         <Text>test...</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default Home;

