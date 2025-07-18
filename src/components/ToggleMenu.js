import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ToggleMenu = ({ navigation }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showMenu = () => {
    setIsVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsVisible(false));
  };

  const navigateToScreen = (screenName) => {
    console.log('🔍 Navigating to:', screenName);
    console.log('🔍 Navigation object:', navigation);
    hideMenu();
    navigation.navigate(screenName);
  };

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: '🏠', screen: 'Dashboard' },
    { id: 'attendance', title: 'Attendance', icon: '📊', screen: 'Attendance' },
  ];

  return (
    <>
      {/* Toggle Button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={showMenu}
        activeOpacity={0.8}
      >
        <Text style={styles.toggleIcon}>☰</Text>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideMenu}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={hideMenu}
          >
            <View style={styles.menuContainer}>
              {/* Menu Header */}
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>🏢 Focalyt</Text>
                <Text style={styles.menuSubtitle}>Employee Portal</Text>
              </View>

              {/* Scrollable Menu Content */}
              <ScrollView style={styles.menuScrollView} showsVerticalScrollIndicator={false}>
                {/* Menu Items */}
                <View style={styles.menuItems}>
                  {menuItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.menuItem}
                      onPress={() => {
                        console.log('🔍 Menu item clicked:', item.title, item.screen);
                        navigateToScreen(item.screen);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      <Text style={styles.menuText}>{item.title}</Text>
                      <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Logout Button - Moved up inside ScrollView */}
                <View style={styles.logoutSection}>
                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => {
                      hideMenu();
                      navigation.navigate('Login');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.logoutIcon}>🚪</Text>
                    <Text style={styles.logoutText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  toggleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.8,
    height: height,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    justifyContent: 'space-between', // Add this
  },
  menuHeader: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#3B82F6',
  },
  menuTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  menuScrollView: {
    flex: 1,
  },
  menuItems: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
  },
  logoutSection: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 15,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default ToggleMenu; 