import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  getLocationWithPermission,
  checkLocationPermission,
  requestLocationPermission,
  getCurrentLocation,
  isLocationEnabled,
  formatLocation,
  getSuperAccurateLocation, // Import the new super accuracy function
} from '../utils/locationService';
import RNLocation from 'react-native-location';

const LocationTestPage = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [locationEnabled, setLocationEnabled] = useState('unknown');
  const [testResults, setTestResults] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [superLoading, setSuperLoading] = useState(false); // New loading state for super accuracy

  // Add test result to the list
  const addTestResult = (test, result, details = '') => {
    const newResult = {
      id: Date.now(),
      test,
      result,
      details,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTestResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  // Check permission status
  const handleCheckPermission = async () => {
    setLoading(true);
    try {
      const hasPermission = await checkLocationPermission();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
      
      addTestResult(
        'Check Permission',
        hasPermission ? 'SUCCESS' : 'DENIED',
        `Permission: ${hasPermission ? 'Granted' : 'Denied'}`
      );
      
      Alert.alert(
        'Permission Status',
        `Location permission: ${hasPermission ? 'Granted' : 'Denied'}`
      );
    } catch (error) {
      console.error('Error checking permission:', error);
      addTestResult('Check Permission', 'ERROR', error.message);
      Alert.alert('Error', 'Failed to check location permission');
    } finally {
      setLoading(false);
    }
  };

  // Request permission only
  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const granted = await requestLocationPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      addTestResult(
        'Request Permission',
        granted ? 'SUCCESS' : 'DENIED',
        `Permission ${granted ? 'granted' : 'denied'}`
      );
      
      Alert.alert(
        'Permission Request',
        `Permission ${granted ? 'granted' : 'denied'}`
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      addTestResult('Request Permission', 'ERROR', error.message);
      Alert.alert('Error', 'Failed to request permission');
    } finally {
      setLoading(false);
    }
  };

  // Check if location services are enabled
  const handleCheckLocationEnabled = async () => {
    setLoading(true);
    try {
      const enabled = await isLocationEnabled();
      setLocationEnabled(enabled ? 'enabled' : 'disabled');
      
      addTestResult(
        'Check Location Services',
        enabled ? 'SUCCESS' : 'DISABLED',
        `Location services: ${enabled ? 'Enabled' : 'Disabled'}`
      );
      
      Alert.alert(
        'Location Services',
        `Location services: ${enabled ? 'Enabled' : 'Disabled'}`
      );
    } catch (error) {
      console.error('Error checking location services:', error);
      addTestResult('Check Location Services', 'ERROR', error.message);
      Alert.alert('Error', 'Failed to check location services');
    } finally {
      setLoading(false);
    }
  };

  // Get location without full permission flow
  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      
      const isReal = !currentLocation.error && currentLocation.accuracy < 1000;
      addTestResult(
        'Get Current Location',
        isReal ? 'SUCCESS' : 'FALLBACK',
        `${formatLocation(currentLocation)} (±${currentLocation.accuracy}m)`
      );
      
      Alert.alert(
        'Current Location',
        `Location: ${formatLocation(currentLocation)}\nAccuracy: ±${currentLocation.accuracy}m${currentLocation.error ? `\nNote: ${currentLocation.error}` : ''}`
      );
    } catch (error) {
      console.error('Error getting location:', error);
      addTestResult('Get Current Location', 'ERROR', error.message);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  // Full location flow with permissions
  const handleGetLocationWithPermission = async () => {
    setLoading(true);
    try {
      const currentLocation = await getLocationWithPermission();
      setLocation(currentLocation);
      
      const isReal = !currentLocation.error && currentLocation.accuracy < 1000;
      addTestResult(
        'Full Location Flow',
        isReal ? 'SUCCESS' : 'FALLBACK',
        `${formatLocation(currentLocation)} (±${currentLocation.accuracy}m)`
      );
      
      if (currentLocation.error) {
        Alert.alert(
          'Location Retrieved (Fallback)',
          `Using fallback location due to: ${currentLocation.error}\n\nLocation: ${formatLocation(currentLocation)}`
        );
      } else {
        Alert.alert(
          'Location Retrieved',
          `Real location obtained!\n\nLocation: ${formatLocation(currentLocation)}\nAccuracy: ±${currentLocation.accuracy}m`
        );
      }
    } catch (error) {
      console.error('Error getting location with permission:', error);
      addTestResult('Full Location Flow', 'ERROR', error.message);
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  // Refresh all status
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Check all statuses
      const [permission, locationSvc] = await Promise.all([
        checkLocationPermission().catch(() => false),
        isLocationEnabled().catch(() => false),
      ]);
      
      setPermissionStatus(permission ? 'granted' : 'denied');
      setLocationEnabled(locationSvc ? 'enabled' : 'disabled');
      
      addTestResult('Refresh Status', 'SUCCESS', 'All statuses updated');
    } catch (error) {
      console.error('Error refreshing:', error);
      addTestResult('Refresh Status', 'ERROR', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Clear test results
  const clearResults = () => {
    setTestResults([]);
    setLocation(null);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'granted':
      case 'enabled':
        return '#34C759';
      case 'denied':
      case 'disabled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  // Get result color
  const getResultColor = (result) => {
    switch (result) {
      case 'SUCCESS':
        return '#34C759';
      case 'FALLBACK':
        return '#FF9500';
      case 'ERROR':
      case 'DENIED':
      case 'DISABLED':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const testSuperAccuracy = async () => {
    setSuperLoading(true);
    const startTime = Date.now();
    
    try {
      Alert.alert(
        '🚀 Super High Accuracy Mode',
        'This will take 15-30 seconds to get the most precise location possible. Please stay still and ensure you have clear sky view.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setSuperLoading(false) },
          { 
            text: 'Start Super Test', 
            onPress: async () => {
              console.log('🚀 Starting super high accuracy test...');
              
              const result = await getSuperAccurateLocation(true);
              const endTime = Date.now();
              
              setLocation(result);
              
              // Add to test history
              const historyItem = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                type: '🚀 SUPER ACCURACY',
                accuracy: result.accuracy?.toFixed(1) + 'm',
                duration: Math.round((endTime - startTime) / 1000) + 's',
                coordinates: `${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
                success: !result.error,
                isHighAccuracy: result.accuracy < 10
              };
              
              setTestResults(prev => [historyItem, ...prev.slice(0, 4)]);
              setSuperLoading(false);
              
              if (result.accuracy < 10) {
                Alert.alert('🎯 Excellent!', `Super high accuracy achieved: ${result.accuracy.toFixed(1)}m`);
              } else if (result.accuracy < 50) {
                Alert.alert('✅ Good!', `Good accuracy achieved: ${result.accuracy.toFixed(1)}m`);
              } else {
                Alert.alert('⚠️ Fair', `Accuracy: ${result.accuracy.toFixed(1)}m. Try moving to open area.`);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Super accuracy test failed:', error);
      setSuperLoading(false);
      Alert.alert('Error', 'Super accuracy test failed');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Location Service Testing</Text>
        <Text style={styles.subtitle}>react-native-location + react-native-permissions</Text>
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Current Status</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Permission:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(permissionStatus) }]}>
            <Text style={styles.statusText}>{permissionStatus.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Location Services:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(locationEnabled) }]}>
            <Text style={styles.statusText}>{locationEnabled.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test Functions</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleCheckPermission}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Check Permission Status</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRequestPermission}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.tertiaryButton]}
          onPress={handleCheckLocationEnabled}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Check Location Services</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleGetCurrentLocation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Get Current Location (Direct)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={handleGetLocationWithPermission}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Get Location (Full Flow)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, superLoading ? styles.buttonDisabled : styles.superButton]}
          onPress={testSuperAccuracy}
          disabled={loading || superLoading}
        >
          <Text style={styles.buttonText}>
            {superLoading ? '🚀 Super Testing...' : '🚀 Super High Accuracy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#009688' }]}
          onPress={async () => {
            try {
              const granted = await RNLocation.requestPermission({
                ios: 'whenInUse',
                android: { detail: 'fine' }
              });
              if (!granted) {
                Alert.alert('Location permission denied');
                return;
              }
              const location = await RNLocation.getLatestLocation({ timeout: 10000, enableHighAccuracy: true });
              if (location) {
                Alert.alert('Coordinates', `Latitude: ${location.latitude}\nLongitude: ${location.longitude}`);
                console.log('Coordinates:', location.latitude, location.longitude);
              } else {
                Alert.alert('Location not found!');
                console.log('No location data');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to get coordinates');
            }
          }}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Get Only Coordinates</Text>
        </TouchableOpacity>
      </View>

      {/* Current Location Display */}
      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Current Location</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Latitude:</Text>
              <Text style={styles.locationValue}>{location.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Longitude:</Text>
              <Text style={styles.locationValue}>{location.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Accuracy:</Text>
              <Text style={[
                styles.locationValue, 
                location.accuracy < 10 ? styles.excellentAccuracy :
                location.accuracy < 50 ? styles.goodAccuracy : styles.fairAccuracy
              ]}>
                {location.accuracy?.toFixed(1)}m {location.accuracy < 10 ? '🎯' : location.accuracy < 50 ? '✅' : '⚠️'}
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Timestamp:</Text>
              <Text style={styles.locationValue}>{new Date(location.timestamp).toLocaleString()}</Text>
            </View>
            
            {/* Address Details */}
            {location.address && (
              <>
                <View style={styles.addressDivider}>
                  <Text style={styles.addressTitle}>🏠 Address Details</Text>
                  {location.address.confidence && (
                    <Text style={[
                      styles.confidenceText,
                      location.address.confidence === 'high' ? styles.highConfidence :
                      location.address.confidence === 'medium' ? styles.mediumConfidence : styles.lowConfidence
                    ]}>
                      Confidence: {location.address.confidence.toUpperCase()} {
                        location.address.confidence === 'high' ? '🎯' :
                        location.address.confidence === 'medium' ? '✅' : '⚠️'
                      }
                    </Text>
                  )}
                </View>
                
                {/* Building Name - Prominent Display */}
                {location.address.buildingName && (
                  <View style={styles.buildingNameContainer}>
                    <Text style={styles.buildingNameLabel}>🏢 Building/Establishment:</Text>
                    <Text style={styles.buildingNameText}>{location.address.buildingName}</Text>
                    {location.address.isBuilding && (
                      <Text style={styles.buildingTypeText}>📍 Exact Location</Text>
                    )}
                  </View>
                )}
                
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Address:</Text>
                  <Text style={[styles.locationValue, styles.addressText]}>
                    {location.address.customFormattedAddress || location.address.formattedAddress}
                  </Text>
                </View>
                
                {location.address.street && location.address.street !== 'Street not available' && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Street:</Text>
                    <Text style={styles.locationValue}>
                      {location.address.houseNumber ? `${location.address.houseNumber} ` : ''}
                      {location.address.street}
                    </Text>
                  </View>
                )}
                {location.address.area && location.address.area !== 'Area not available' && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Area:</Text>
                    <Text style={[styles.locationValue, styles.areaText]}>{location.address.area}</Text>
                  </View>
                )}
                {location.address.city && location.address.city !== 'City not available' && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>City:</Text>
                    <Text style={[styles.locationValue, styles.cityText]}>{location.address.city}</Text>
                  </View>
                )}
                {location.address.district && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>District:</Text>
                    <Text style={styles.locationValue}>{location.address.district}</Text>
                  </View>
                )}
                {location.address.state && location.address.state !== 'State not available' && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>State:</Text>
                    <Text style={styles.locationValue}>{location.address.state}</Text>
                  </View>
                )}
                {location.address.postalCode && location.address.postalCode !== 'Postal code not available' && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Postal Code:</Text>
                    <Text style={[styles.locationValue, styles.postalCodeText]}>{location.address.postalCode}</Text>
                    {location.address.postalCodeNote && (
                      <Text style={styles.noteText}> (Auto-corrected)</Text>
                    )}
                  </View>
                )}
                
                {/* Service Information */}
                <View style={styles.serviceInfoDivider}>
                  <Text style={styles.serviceInfoTitle}>📊 Service Information</Text>
                </View>
                
                {location.address.source && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Address Source:</Text>
                    <Text style={[
                      styles.locationValue, 
                      styles.sourceText,
                      location.address.source.includes('Indian') ? styles.indianSource : null,
                      location.address.source.includes('Google') ? styles.googleSource : null
                    ]}>
                      {location.address.source.includes('Google') ? '🌟 ' : ''}
                      {location.address.source}
                      {location.address.source.includes('Google Places') ? ' (Premium)' : ''}
                    </Text>
                  </View>
                )}
                {location.address.confidence && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Data Quality:</Text>
                    <Text style={[
                      styles.locationValue,
                      location.address.confidence === 'high' ? styles.highConfidence :
                      location.address.confidence === 'medium' ? styles.mediumConfidence : styles.lowConfidence
                    ]}>
                      {location.address.confidence.toUpperCase()} {
                        location.address.confidence === 'high' ? '🎯' :
                        location.address.confidence === 'medium' ? '✅' : '⚠️'
                      }
                      {location.address.source?.includes('Google') ? ' PREMIUM' : ''}
                    </Text>
                  </View>
                )}
                {location.address.placeId && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Google Place ID:</Text>
                    <Text style={[styles.locationValue, styles.placeIdText]}>
                      {location.address.placeId.substring(0, 20)}...
                    </Text>
                  </View>
                )}
                {location.address.error && (
                  <View style={styles.locationRow}>
                    <Text style={styles.locationLabel}>Address Status:</Text>
                    <Text style={styles.errorText}>{location.address.error}</Text>
                  </View>
                )}
              </>
            )}
            
            {location.error && (
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Location Status:</Text>
                <Text style={styles.errorText}>{location.error}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Test Results History */}
      <View style={styles.section}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>📋 Test Results</Text>
          <TouchableOpacity onPress={clearResults} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet. Run some tests!</Text>
        ) : (
          testResults.map((result) => (
            <View key={result.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTest}>{result.test}</Text>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
              </View>
              <View style={styles.resultBody}>
                <View style={[styles.resultBadge, { backgroundColor: getResultColor(result.result) }]}>
                  <Text style={styles.resultBadgeText}>{result.result}</Text>
                </View>
                {result.details ? <Text style={styles.resultDetails}>{result.details}</Text> : null}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Instructions</Text>
        <Text style={styles.instruction}>1. Check permission status first</Text>
        <Text style={styles.instruction}>2. Request permission if denied</Text>
        <Text style={styles.instruction}>3. Verify location services are enabled</Text>
        <Text style={styles.instruction}>4. Test direct location vs full flow</Text>
        <Text style={styles.instruction}>5. Check console logs for detailed info</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#000000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#5856D6',
  },
  tertiaryButton: {
    backgroundColor: '#AF52DE',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  resultCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTest: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  resultTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  resultBody: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  resultBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  resultDetails: {
    fontSize: 12,
    color: '#8E8E93',
    flex: 1,
  },
  instruction: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  addressDivider: {
    marginTop: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  addressText: {
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
  sourceText: {
    fontStyle: 'italic',
    color: '#8E8E93',
  },
  superButton: {
    backgroundColor: '#FF6B35', // Orange for super accuracy
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  
  excellentAccuracy: {
    color: '#00C851', // Green for excellent accuracy (<10m)
    fontWeight: 'bold',
  },
  
  goodAccuracy: {
    color: '#FF8800', // Orange for good accuracy (10-50m)
    fontWeight: 'bold',
  },
  
  fairAccuracy: {
    color: '#FF4444', // Red for fair accuracy (>50m)
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  highConfidence: {
    color: '#00C851', // Green for high confidence
  },
  mediumConfidence: {
    color: '#FF8800', // Orange for medium confidence
  },
  lowConfidence: {
    color: '#FF4444', // Red for low confidence
  },
  areaText: {
    fontStyle: 'italic',
  },
  cityText: {
    fontWeight: 'bold',
  },
  postalCodeText: {
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  indianSource: {
    color: '#FF6B35', // Orange for Indian source
  },
  googleSource: {
    color: '#007AFF', // Blue for Google source
  },
  placeIdText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  buildingNameContainer: {
    backgroundColor: '#E0E0E0',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  buildingNameLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  buildingNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF', // Blue for building name
    textAlign: 'center',
  },
  buildingTypeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  serviceInfoDivider: {
    marginTop: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
  },
  serviceInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
});

export default LocationTestPage; 