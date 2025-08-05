import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions'; 
import { ENV } from '../config/env';

const NativeMaps = () => {
  const [state, setState] = useState({
    pickupCord: {
      latitude: 30.7046,
      longitude: 76.7179,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    droplocationCord: {
      latitude: 30.6425,
      longitude: 76.8173,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  });

  const mapRef = useRef();
  const { pickupCord, droplocationCord } = state;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={pickupCord} 
        ref={mapRef}
        mapType="standard"
      >
        <Marker
          coordinate={pickupCord}
          pinColor="green"
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

export default NativeMaps;






// import React, { useState, useRef, useEffect } from 'react';
// import { View, StyleSheet, Text } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import { ENV } from '../config/env';

// const NativeMaps = () => {
//   const [state, setState] = useState({
//     pickupCord: {
//       latitude: 30.7046,
//       longitude: 76.7179,
//       latitudeDelta: 0.0922,
//       longitudeDelta: 0.0421,
//     },
//     droplocationCord: {
//       latitude: 30.6425,
//       longitude: 76.8173,
//       latitudeDelta: 0.0922,
//       longitudeDelta: 0.0421,
//     }
//   });

//   const [routeCoords, setRouteCoords] = useState([]);
//   const [routeInfo, setRouteInfo] = useState({
//     distance: '',
//     duration: '',
//     loaded: false
//   });

//   const mapRef = useRef();
//   const { pickupCord, droplocationCord } = state;

//   // Decode Google polyline (encoded route from API)
//   const decodePolyline = (encoded) => {
//     if (!encoded) return [];
    
//     let points = [];
//     let index = 0, lat = 0, lng = 0;

//     while (index < encoded.length) {
//       let b, shift = 0, result = 0;
//       do {
//         b = encoded.charAt(index++).charCodeAt(0) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
//       lat += dlat;

//       shift = 0;
//       result = 0;
//       do {
//         b = encoded.charAt(index++).charCodeAt(0) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
//       lng += dlng;

//       points.push({
//         latitude: lat / 1e5,
//         longitude: lng / 1e5
//       });
//     }
//     return points;
//   };

//   // Fetch route manually from Google Directions API
//   const fetchRoute = async () => {
//     try {
      
//       const url = `https://maps.googleapis.com/maps/api/directions/json?` +
//                   `origin=${pickupCord.latitude},${pickupCord.longitude}&` +
//                   `destination=${droplocationCord.latitude},${droplocationCord.longitude}&` +
//                   `key=${ENV.GOOGLE_MAPS_API_KEY}&` +
//                   `mode=driving&` +
//                   `alternatives=false`;

//       const response = await fetch(url);
//       const data = await response.json();

//       console.log('📍 Route data received:', data.status);

//       if (data.status === 'OK' && data.routes.length > 0) {
//         const route = data.routes[0];
//         const leg = route.legs[0];
        
//         // Decode the polyline to get coordinates
//         const encodedPolyline = route.overview_polyline.points;
//         const coordinates = decodePolyline(encodedPolyline);
        
//         console.log('✅ Route decoded:', coordinates.length, 'points');
        
//         setRouteCoords(coordinates);
//         setRouteInfo({
//           distance: leg.distance.text,
//           duration: leg.duration.text,
//           loaded: true
//         });

//         // Fit map to route
//         setTimeout(() => {
//           if (mapRef.current && coordinates.length > 0) {
//             mapRef.current.fitToCoordinates(coordinates, {
//               edgePadding: {
//                 right: 50,
//                 bottom: 100,
//                 left: 50,
//                 top: 100,
//               },
//               animated: true,
//             });
//           }
//         }, 1000);

//       } else {
//         console.log('❌ No routes found:', data.status);
//       }
//     } catch (error) {
//       console.log('❌ Route fetch error:', error);
//     }
//   };

//   useEffect(() => {
//     fetchRoute();
//   }, []);

//   return (
//     <View style={styles.container}>
//       {/* Route Info Panel */}
//       {/* <View style={styles.infoPanel}>
//         <Text style={styles.infoTitle}>📍 Route Info</Text>
//         {routeInfo.loaded ? (
//           <>
//             <Text style={styles.infoText}>
//               ✅ Route Loaded: {routeCoords.length} points
//             </Text>
//             <Text style={styles.infoText}>
//               📏 Distance: {routeInfo.distance}
//             </Text>
//             <Text style={styles.infoText}>
//               ⏱️ Duration: {routeInfo.duration}
//             </Text>
//           </>
//         ) : (
//           <Text style={styles.infoText}>⏳ Loading route...</Text>
//         )}
//       </View> */}

//       <MapView
//         style={StyleSheet.absoluteFill}
//         initialRegion={pickupCord} 
//         ref={mapRef}
//         showsUserLocation={false}
//         mapType="standard"
//       >
//         {/* Pickup Marker */}
//         <Marker
//           coordinate={pickupCord}
//           pinColor="green"
//           title="Pickup Location"
//           description="Start point"
//         />
        
//         {/* Drop Marker */}
//         <Marker
//           coordinate={droplocationCord}
//           pinColor="red"
//           title="Drop Location"
//           description="End point"
//         />
        
//         {/* Route Polyline */}
//         {routeCoords.length > 0 && (
//           <Polyline
//             coordinates={routeCoords}
//             strokeColor="#FF1493" // Hot pink
//             strokeWidth={4}
//             lineCap="round"
//             lineJoin="round"
//           />
//         )}
//       </MapView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   infoPanel: {
//     position: 'absolute',
//     top: 50,
//     left: 10,
//     right: 10,
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     padding: 15,
//     borderRadius: 10,
//     zIndex: 1000,
//   },
//   infoTitle: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 8,
//   },
//   infoText: {
//     color: 'white',
//     fontSize: 12,
//     marginBottom: 3,
//   },
// });

// export default NativeMaps;