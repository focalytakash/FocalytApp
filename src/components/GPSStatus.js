import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const GPSStatus = ({ 
  hasLocation, 
  onRefresh, 
  showDetails = false 
}) => {
  const handleGPSHelp = () => {
    Alert.alert(
      'GPS Help',
      'To enable GPS:\n\n' +
      '📱 Android:\n' +
      '• Settings > Location > Turn On\n' +
      '• Settings > Apps > FocalytApp > Permissions > Location > Allow\n\n' +
      '🍎 iOS:\n' +
      '• Settings > Privacy > Location Services > Turn On\n' +
      '• Settings > FocalytApp > Location > While Using App',
      [
        { text: 'Got it', style: 'default' },
        { text: 'Refresh GPS', onPress: onRefresh }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusIndicator, { 
        backgroundColor: hasLocation ? '#D1FAE5' : '#FEF3C7' 
      }]}>
        <Text style={[styles.statusIcon, { 
          color: hasLocation ? '#065F46' : '#92400E' 
        }]}>
          {hasLocation ? '📍' : '⚠️'}
        </Text>
        <Text style={[styles.statusText, { 
          color: hasLocation ? '#065F46' : '#92400E' 
        }]}>
          {hasLocation ? 'GPS Active' : 'GPS Off'}
        </Text>
      </View>
      
      {showDetails && (
        <TouchableOpacity style={styles.helpButton} onPress={handleGPSHelp}>
          <Text style={styles.helpText}>?</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  helpButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
});

export default GPSStatus; 