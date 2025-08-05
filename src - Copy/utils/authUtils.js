import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clear all user data from AsyncStorage and logout the user
 */
export const logout = async () => {
    try {
        await AsyncStorage.clear();
        console.log('✅ User logged out successfully');
        return true;
    } catch (error) {
        console.log('❌ Logout error:', error);
        return false;
    }
};

/**
 * Check if user is logged in by checking for stored token
 */
export const isUserLoggedIn = async () => {
    try {
        console.log('isUserLoggedIn');
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        console.log('token', token);
        console.log('userData', userData);
        if(token && userData){
            return true;
        }
        else{
            return false;
        }
    } catch (error) {
        console.log('❌ Error checking login status:', error);
        return false;
    }
};

/**
 * Get stored user data
 */
export const getUserData = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        const candidateName = await AsyncStorage.getItem('candidate');
        
        if (token && userData) {
            return {
                token,
                user: JSON.parse(userData),
                candidateName
            };
        }
        return null;
    } catch (error) {
        console.log('❌ Error getting user data:', error);
        return null;
    }
}; 