import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { logout } from '../utils/authUtils';

const LogoutButton = ({ navigation, buttonStyle, textStyle }) => {
    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await logout();
                        if (success) {
                            // Navigate back to login screen
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } else {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <TouchableOpacity 
            style={[styles.logoutButton, buttonStyle]} 
            onPress={handleLogout}
            activeOpacity={0.8}
        >
            <Text style={[styles.logoutText, textStyle]}>Logout</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    logoutButton: {
        backgroundColor: '#FF4444',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LogoutButton; 