import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import SettingsModal from './SettingsModal';

const SettingsScreen = ({ navigation }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Auto-open settings modal when screen loads
  useEffect(() => {
    setShowSettingsModal(true);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>⚙️ Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account & preferences</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Settings Panel</Text>
          <Text style={styles.infoDescription}>
            The settings panel should have opened automatically. If it didn't, tap the button below to open it.
          </Text>
          
          <TouchableOpacity 
            style={styles.openButton}
            onPress={() => setShowSettingsModal(true)}
          >
            <Text style={styles.openButtonText}>Open Settings Panel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    color: '#1E293B',
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 20,
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 20,
  },
  openButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen; 