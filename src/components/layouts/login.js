// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { isUserLoggedIn } from '../../utils/authUtils';

// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     StyleSheet,
//     Image,
//     KeyboardAvoidingView,
//     Platform,
//     ScrollView,
//     Alert,
// } from 'react-native';

// const LoginScreen = ({ navigation }) => {
//     const [mobile, setMobile] = useState('');
//     const [otp, setOTP] = useState('');
//     const [showOtpInput, setShowOtpInput] = useState(false); // ✅ correct
//     const [showLoginbtn, setshowLoginbtn] = useState(false); // ✅ correct
//     const [showSendOtp, setShowSendOtp] = useState(true);
//     const [sendOtpText, setSendOtpText] = useState('Send OTP'); // ✅ correct
//     const [fullName, setFullName] = useState('');
//     const [gender, setGender] = useState('');
//     const [city, setCity] = useState('');
//     const [showUserDetail, setShowUserDetail] = useState(false);
//     const [newUser, setNewUser] = useState('false');
//     const [user, setUser] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);

//     console.log('showOtpInput', showOtpInput);
//     // const backendUrl = 'http://10.0.2.2:8080';
//     const backendUrl = 'http://192.168.1.27:8080';
//     // const backendUrl = 'https://focalyt.com/api';

//     useEffect(() => {
//         const checkLogin = async () => {
//             try {
//                 setIsLoading(true);
//                 const isLoggedIn = await isUserLoggedIn();
//                 console.log('isLoggedIn', isLoggedIn);
//                 if (isLoggedIn) {
//                     navigation.navigate('MainApp');
//                 }
//                 else { }
//                 setIsLoading(false);
//             }
//             catch (error) {
//                 console.log('❌ Error checking existing login:', error);
//                 setIsLoading(false);
//             }
//         }
//         checkLogin();
//     }, []);


//     // Check if user is already logged in


//     const handleSendOtp = async () => {
//         const body = {
//             mobile
//         }

//         console.log('🔁 handleSendOtp called');
//         console.log(' mobile', mobile);
//         if (mobile.length !== 10) {
//             Alert.alert("Please enter valid mobile number");
//             return;
//         }
//         console.log("✅ Valid number, calling API...");

//         try {
//             console.log("🔁 backendUrl", backendUrl);
//             const res = await axios.post(`${backendUrl}/college/androidApp/login/send-otp`, { mobile });
//             console.log("res", res);
//             if (res.data.status) {
//                 console.log("✅ OTP sent:", res.data);
//                 setShowOtpInput(true); // OTP field show kar do
//                 setSendOtpText('Resend OTP');
//                 setshowLoginbtn(true);

//             } else if (res.data.status == true && res.data.newUser == true) {
//                 setShowSendOtp(false);
//                 setshowLoginbtn(true);

//             }
//             else {
//                 Alert.alert("Error", res.data.message);
//             }
//         } catch (err) {
//             console.log(err);
//             Alert.alert("Server Error", "Something went wrong");
//         }
//     };
//     const Loginbtn = async () => {

//         try {


//             console.log("mobile: otp", mobile, otp);
//             const res = await axios.post(`${backendUrl}/college/androidApp/login/verify-otp`, {
//                 mobile,
//                 otp
//             });
//             console.log("res", res.data);
//             if (res.data.status) {
//                 AsyncStorage.setItem('token', res.data.datatoken);
//                 AsyncStorage.setItem('user', JSON.stringify(res.data.data.user));
//                 navigation.navigate('MainApp');

//             } else {
//                 setErrorMessage('Login failed after OTP verification');
//             }




//         } catch (error) {
//             console.log("OTP Verify Error:", error);
//             Alert.alert("Server Error", "Something went wrong");
//         }
//     };



//     // Logout function - can be called from other components
//     const handleLogout = async () => {
//         try {
//             await AsyncStorage.clear();
//             console.log('✅ User logged out successfully');
//             // Reset all states
//             setMobile('');
//             setOTP('');
//             setShowOtpInput(false);
//             setshowLoginbtn(false);
//             setShowSendOtp(true);
//             setSendOtpText('Send OTP');
//             setFullName('');
//             setGender('');
//             setCity('');
//             setShowUserDetail(false);
//             setNewUser('false');
//             setUser(null);
//         } catch (error) {
//             console.log('❌ Logout error:', error);
//         }
//     };

//     if (isLoading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <Text style={styles.loadingText}>Loading...</Text>
//             </View>
//         );
//     }


//     return (
//         <KeyboardAvoidingView
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//             style={styles.container}
//         >
//             <ScrollView
//                 contentContainerStyle={styles.scrollContent}
//                 keyboardShouldPersistTaps="handled"
//             >
//                 <View style={styles.logoContainer}>
//                     <Image
//                         source={require('../../assets/images/logo/focalyt_new_logo.png')}
//                         style={styles.logo}
//                     />
//                     <Text style={styles.appName}>Focalyt</Text>
//                     <Text style={styles.welcomeText}>Sign in to continue</Text>
//                 </View>

//                 <View style={styles.formContainer}>
//                     <View style={[styles.inputContainer]}>
//                         <Text style={styles.inputLabel}>Mobile Number</Text>
//                         <TextInput
//                             style={styles.input}
//                             placeholder="Enter your mobile number"
//                             placeholderTextColor="#A0A0A0"
//                             value={mobile}
//                             onChangeText={text => {
//                                 const numericText = text.replace(/[^0-9]/g, '');
//                                 setMobile(numericText);
//                             }}
//                             keyboardType="number-pad"
//                             maxLength={10}
//                         />

//                     </View>
//                     {showUserDetail && (
//                         <>
//                             <View style={styles.inputContainer}>
//                                 <Text style={styles.inputLabel}>Full Name</Text>
//                                 <TextInput
//                                     style={styles.input}
//                                     placeholder="Enter your full name"
//                                     placeholderTextColor="#A0A0A0"
//                                     value={fullName}
//                                     onChangeText={setFullName}
//                                 />
//                             </View>
//                             <View style={styles.inputContainer}>
//                                 <Text style={styles.inputLabel}>Gender</Text>
//                                 <TextInput
//                                     style={styles.input}
//                                     placeholder="Male / Female / Other"
//                                     placeholderTextColor="#A0A0A0"
//                                     value={gender}
//                                     onChangeText={setGender}
//                                 />
//                             </View>
//                             <View style={styles.inputContainer}>
//                                 <Text style={styles.inputLabel}>City</Text>
//                                 <TextInput
//                                     style={styles.input}
//                                     placeholder="Enter your city"
//                                     placeholderTextColor="#A0A0A0"
//                                     value={city}
//                                     onChangeText={setCity}
//                                 />
//                             </View></>
//                     )}

//                     {showOtpInput && (
//                         <View style={[styles.inputContainer]}>
//                             <Text style={styles.inputLabel}>Enter OTP</Text>
//                             <View style={styles.passwordContainer}>
//                                 <TextInput
//                                     style={styles.passwordInput}
//                                     placeholder="Enter your otp"
//                                     placeholderTextColor="#A0A0A0"
//                                     value={otp}

//                                     keyboardType="number-pad"
//                                     maxLength={4}
//                                     onChangeText={text => {
//                                         const numericText = text.replace(/[^0-9]/g, '');
//                                         setOTP(numericText);
//                                     }}
//                                 />

//                             </View>
//                         </View>)}
//                     {showSendOtp && (
//                         <TouchableOpacity
//                             style={styles.sendOTPButton}
//                             onPress={handleSendOtp}
//                             activeOpacity={0.8}
//                         >
//                             <Text style={styles.loginButtonText}>{sendOtpText}</Text>
//                         </TouchableOpacity>)}
//                     {showLoginbtn && (
//                         <TouchableOpacity
//                             style={styles.loginButton}
//                             onPress={Loginbtn}
//                             activeOpacity={0.8}
//                         >
//                             <Text style={styles.loginButtonText}>Login</Text>
//                         </TouchableOpacity>)}


//                 </View>
//             </ScrollView>
//         </KeyboardAvoidingView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#FFFFFF',
//     },
//     scrollContent: {
//         flexGrow: 1,
//         padding: 24,
//     },
//     logoContainer: {
//         alignItems: 'center',
//         marginTop: 40,
//         marginBottom: 30,
//     },
//     logo: {
//         width: 100,
//         height: 100,
//         resizeMode: 'contain',
//     },
//     appName: {
//         fontSize: 28,
//         fontWeight: 'bold',
//         color: '#333333',
//         marginTop: 12,
//     },
//     welcomeText: {
//         fontSize: 16,
//         color: '#666666',
//         marginTop: 8,
//     },
//     formContainer: {
//         marginBottom: 24,
//     },
//     inputContainer: {
//         marginBottom: 16,
//     },

//     inputLabel: {
//         fontSize: 14,
//         fontWeight: '500',
//         color: '#333333',
//         marginBottom: 8,
//     },
//     input: {
//         height: 50,
//         backgroundColor: '#F7F7F7',
//         borderRadius: 8,
//         paddingHorizontal: 16,
//         fontSize: 16,
//         color: '#333333',
//         borderWidth: 1,
//         borderColor: '#EEEEEE',
//     },
//     passwordContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         height: 50,
//         backgroundColor: '#F7F7F7',
//         borderRadius: 8,
//         borderWidth: 1,
//         borderColor: '#EEEEEE',
//     },
//     passwordInput: {
//         flex: 1,
//         paddingHorizontal: 16,
//         fontSize: 16,
//         color: '#333333',
//     },
//     eyeIcon: {
//         padding: 12,
//     },
//     forgotPasswordButton: {
//         alignSelf: 'flex-end',
//         marginBottom: 24,
//     },
//     forgotPasswordText: {
//         color: '#3C7BF4',
//         fontSize: 14,
//     },
//     sendOTPButton: {
//         backgroundColor: '#3C7BF4',
//         borderRadius: 8,
//         height: 50,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginBottom: 24,
//         elevation: 2,

//     },
//     loginButton: {

//         backgroundColor: '#3C7BF4',
//         borderRadius: 8,
//         height: 50,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginBottom: 24,
//         elevation: 2,
//     },
//     loginButtonText: {
//         color: '#FFFFFF',
//         fontSize: 16,
//         fontWeight: '600',
//     },
//     dividerContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 24,
//     },
//     divider: {
//         flex: 1,
//         height: 1,
//         backgroundColor: '#EEEEEE',
//     },
//     dividerText: {
//         marginHorizontal: 10,
//         color: '#666666',
//         fontSize: 14,
//     },
//     socialButtonsContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginBottom: 24,
//     },
//     socialButton: {
//         flex: 1,
//         height: 50,
//         borderWidth: 1,
//         borderColor: '#DDDDDD',
//         borderRadius: 8,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginHorizontal: 6,
//     },
//     socialButtonText: {
//         color: '#333333',
//         fontSize: 14,
//         fontWeight: '500',
//     },
//     signUpContainer: {
//         flexDirection: 'row',
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginTop: 12,
//     },
//     signUpText: {
//         color: '#666666',
//         fontSize: 14,
//     },
//     signUpButtonText: {
//         color: '#3C7BF4',
//         fontSize: 14,
//         fontWeight: '600',
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#FFFFFF',
//     },
//     loadingText: {
//         marginTop: 20,
//         fontSize: 16,
//         color: '#666666',
//     },
// });

// export default LoginScreen;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isUserLoggedIn } from '../../utils/authUtils';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';



const LoginScreen = ({ navigation }) => {
    const [mobile, setMobile] = useState('');
    const [otp, setOTP] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false); // ✅ correct
    const [showLoginbtn, setshowLoginbtn] = useState(false); // ✅ correct
    const [showSendOtp, setShowSendOtp] = useState(true);
    const [sendOtpText, setSendOtpText] = useState('Send OTP'); // ✅ correct
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [city, setCity] = useState('');
    const [showUserDetail, setShowUserDetail] = useState(false);
    const [newUser, setNewUser] = useState('false');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    console.log('showOtpInput', showOtpInput);
    // const backendUrl = 'http://10.0.2.2:8080/api';
    const backendUrl = 'https://focalyt.com/api';

    useEffect(() => {
        const checkLogin = async () => {
        try{
            setIsLoading(true);
            const isLoggedIn = await isUserLoggedIn();
            console.log('isLoggedIn', isLoggedIn);
            if(isLoggedIn){
                navigation.navigate('MainApp');
            }
            else{}
            setIsLoading(false);
        }
        catch(error){
            console.log('❌ Error checking existing login:', error);
            setIsLoading(false);
        }
    }
    checkLogin();
    }, []);


    // Check if user is already logged in
    

    const handleSendOtp = async () => {
        const body = {
            mobile
        }

        console.log('🔁 handleSendOtp called');
        console.log(' mobile', mobile);
        if (mobile.length !== 10) {
            Alert.alert("Please enter valid mobile number");
            return;
        }
        console.log("✅ Valid number, calling API...");

        try {
            const res = await axios.post(`${backendUrl}/api/sendCandidateOtp`, { mobile });
            if (res.data.status == true && res.data.newUser == false) {
                console.log("✅ OTP sent:", res.data);
                setShowOtpInput(true); // OTP field show kar do
                setSendOtpText('Resend OTP');
                setshowLoginbtn(true);
                setUser(res.data.user);
                setNewUser(false)

            } else if (res.data.status == true && res.data.newUser == true) {
                setShowSendOtp(false);
                setShowUserDetail(true);
                setshowLoginbtn(true);
                setNewUser(true)

            }
            else {
                Alert.alert("Error", res.data.message);
            }
        } catch (err) {
            console.log(err);
            Alert.alert("Server Error", "Something went wrong");
        }
    };
    const Loginbtn = async () => {

        try {

            if (newUser == false) {
                console.log("mobile: otp", mobile, otp);
                const res = await axios.post(`${backendUrl}/api/verifyOtp`, {
                    mobile,
                    otp
                });
                console.log("res", res.data);
                if (res.data.status) {
                    const loginRes = await axios.post(`${backendUrl}/api/otpCandidateLogin`, { mobile: mobile });
                    console.log("loginRes", loginRes.data);
                    const token = loginRes.data.token;
                    const verificationBody = { mobile: mobile, verified: true }
                    const headers = { headers: { 'x-auth': token } };
                    const verifyRes = await axios.post(`${backendUrl}/candidate/verification`, verificationBody, headers);
                    console.log("verifyRes", verifyRes.data);
                    if (verifyRes.data.status) {
                        AsyncStorage.setItem('candidate', loginRes.data.name);
                        AsyncStorage.setItem('token', loginRes.data.token);
                        AsyncStorage.setItem('user', JSON.stringify(loginRes.data.user));


                        navigation.navigate('MainApp');

                    } else {
                        setErrorMessage('Login failed after OTP verification');
                    }
                } else {
                    Alert.alert("Failed", res.data.message);
                }
            }
            else if (newUser == true) {
                //register API





            }

        } catch (error) {
            console.log("OTP Verify Error:", error);
            Alert.alert("Server Error", "Something went wrong");
        }
    };



    // Logout function - can be called from other components
    const handleLogout = async () => {
        try {
            await AsyncStorage.clear();
            console.log('✅ User logged out successfully');
            // Reset all states
            setMobile('');
            setOTP('');
            setShowOtpInput(false);
            setshowLoginbtn(false);
            setShowSendOtp(true);
            setSendOtpText('Send OTP');
            setFullName('');
            setGender('');
            setCity('');
            setShowUserDetail(false);
            setNewUser('false');
            setUser(null);
        } catch (error) {
            console.log('❌ Logout error:', error);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/logo/focalyt_new_logo.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.appName}>Focalyt</Text>
                    <Text style={styles.welcomeText}>Sign in to continue</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={[styles.inputContainer]}>
                        <Text style={styles.inputLabel}>Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your mobile number"
                            placeholderTextColor="#A0A0A0"
                            value={mobile}
                            onChangeText={text => {
                                const numericText = text.replace(/[^0-9]/g, '');
                                setMobile(numericText);
                            }}
                            keyboardType="number-pad"
                            maxLength={10}
                        />

                    </View>
                    {showUserDetail && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#A0A0A0"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Gender</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Male / Female / Other"
                                    placeholderTextColor="#A0A0A0"
                                    value={gender}
                                    onChangeText={setGender}
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>City</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your city"
                                    placeholderTextColor="#A0A0A0"
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View></>
                    )}

                    {showOtpInput && (
                        <View style={[styles.inputContainer]}>
                            <Text style={styles.inputLabel}>Enter OTP</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Enter your otp"
                                    placeholderTextColor="#A0A0A0"
                                    value={otp}

                                    keyboardType="number-pad"
                                    maxLength={4}
                                    onChangeText={text => {
                                        const numericText = text.replace(/[^0-9]/g, '');
                                        setOTP(numericText);
                                    }}
                                />

                            </View>
                        </View>)}
                    {showSendOtp && (
                        <TouchableOpacity
                            style={styles.sendOTPButton}
                            onPress={handleSendOtp}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.loginButtonText}>{sendOtpText}</Text>
                        </TouchableOpacity>)}
                    {showLoginbtn && (
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={Loginbtn}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.loginButtonText}>Login</Text>
                        </TouchableOpacity>)}


                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333333',
        marginTop: 12,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666666',
        marginTop: 8,
    },
    formContainer: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },

    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 8,
    },
    input: {
        height: 50,
        backgroundColor: '#F7F7F7',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333333',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        backgroundColor: '#F7F7F7',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333333',
    },
    eyeIcon: {
        padding: 12,
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#3C7BF4',
        fontSize: 14,
    },
    sendOTPButton: {
        backgroundColor: '#3C7BF4',
        borderRadius: 8,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        elevation: 2,

    },
    loginButton: {

        backgroundColor: '#3C7BF4',
        borderRadius: 8,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        elevation: 2,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#EEEEEE',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#666666',
        fontSize: 14,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    socialButton: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: '#DDDDDD',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 6,
    },
    socialButtonText: {
        color: '#333333',
        fontSize: 14,
        fontWeight: '500',
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    signUpText: {
        color: '#666666',
        fontSize: 14,
    },
    signUpButtonText: {
        color: '#3C7BF4',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#666666',
    },
});

export default LoginScreen;