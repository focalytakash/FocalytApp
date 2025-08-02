import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { logout } from '../utils/authUtils';

const SidePanel = ({ visible, onClose, navigation }) => {
  const menuItems = [
    {
      id: 'profile',
      title: 'Employee Details/Profile',
      icon: '👤',
      action: () => {
        onClose();
        navigation.navigate('EmployeeProfile');
      },
    },
    {
      id: 'password',
      title: 'Change Password',
      icon: '🔑',
      action: () => {
        onClose();
        Alert.alert('Change Password', 'Change password screen will be implemented');
      },
    },
    {
      id: 'about',
      title: 'About Us',
      icon: 'ℹ️',
      action: () => {
        onClose();
        Alert.alert('About Us', 'About us screen will be implemented');
      },
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      icon: '📋',
      action: () => {
        onClose();
        Alert.alert('Terms & Conditions', 'Terms & conditions screen will be implemented');
      },
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: '🔒',
      action: () => {
        onClose();
        Alert.alert('Privacy Policy', 'Privacy policy screen will be implemented');
      },
    },
    {
      id: 'salary',
      title: 'Salary Statement',
      icon: '💰',
      action: () => {
        onClose();
        Alert.alert('Salary Statement', 'Salary statement screen will be implemented');
      },
    },
  ];

  const handleLogout = async () => {
    Alert.alert(
      '🚪 Logout',
      'क्या आप लॉगआउट करना चाहते हैं?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              onClose();
              
              // Clear all stored data
              const logoutSuccess = await logout();
              
              if (logoutSuccess) {
                // Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
                console.log('✅ Logout successful from SidePanel');
              } else {
                Alert.alert('❌ Error', 'Logout failed. Please try again.');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Logout failed: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sidePanel}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>F</Text>
              </View>
              <Text style={styles.appName}>Focalyt</Text>
              <Text style={styles.appSubtitle}>Settings</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JD</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>John Doe</Text>
              <Text style={styles.userRole}>Software Developer</Text>
              <Text style={styles.userEmail}>john.doe@focalyt.com</Text>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuText}>{item.title}</Text>
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Close Panel Button */}
          <View style={styles.closePanelContainer}>
            <TouchableOpacity style={styles.closePanelButton} onPress={onClose}>
              <Text style={styles.closePanelIcon}>✕</Text>
              <Text style={styles.closePanelText}>Close Panel</Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overlay to close panel */}
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayTouch: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidePanel: {
    width: 320,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  userRole: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
  },
  closePanelContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closePanelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closePanelIcon: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  closePanelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
});

export default SidePanel; 