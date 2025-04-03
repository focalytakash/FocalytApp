// src/components/layouts/login/login.js

import React, { useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const[showUserDetail, setShowUserDetail] = useState(false);
    const[newUser, setNewUser] = useState('false');
    const[user, setUser] = useState(null);

    console.log('showOtpInput', showOtpInput);

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
            const res = await axios.post('http://10.0.2.2:8080/androidapp/sendOTPCandidate', { mobile });
            if (res.data.status==true && res.data.newUser==false) {
                console.log("✅ OTP sent:", res.data);
                setShowOtpInput(true); // OTP field show kar do
                setSendOtpText('Resend OTP');
                setshowLoginbtn(true);
                setUser(res.data.user);
                setNewUser(false)
                
            }else if(res.data.status==true && res.data.newUser==true){
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

            if(newUser==false)
            {
          const res = await axios.post('http://10.0.2.2:8080/androidapp/verifyOTPCandidate', {
            mobile,
            otp
          });
      
          if (res.data.status) {
            await AsyncStorage.setItem('user', JSON.stringify(user));
            Alert.alert("Success", res.data.message);
            // navigation.navigate('Dashboard'); 
          } else {
            Alert.alert("Failed", res.data.message);
          }}
          else if(newUser==true){
            //register API





          }
      
        } catch (error) {
          console.log("OTP Verify Error:", error);
          Alert.alert("Server Error", "Something went wrong");
        }
      };
      

    const handleSignUp = () => {
        navigation.navigate('SignUp');
    };



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
                        source={require('../../../assets/images/logo/focalyt_new_logo.png')}
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
});

export default LoginScreen;