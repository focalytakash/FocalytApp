import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

const EmployeeProfile = ({ navigation }) => {
  const [employeeData, setEmployeeData] = useState({
    profileImage: require('../assets/images/portrait/small/avatar-s-1.jpg'),
    name: 'John Doe',
    mobile: '+91 98765 43210',
    employeeId: 'EMP001',
    email: 'john.doe@focalyt.com',
    department: 'Software Development',
    designation: 'Senior Developer',
    joiningDate: '15-03-2022',
    salary: '₹75,000',
    address: '123 Main Street, City, State - 123456',
    emergencyContact: '+91 98765 43211',
    bloodGroup: 'O+',
    dateOfBirth: '15-08-1990',
    gender: 'Male',
    maritalStatus: 'Married',
    qualification: 'B.Tech Computer Science',
    experience: '5 years',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const renderField = (label, value, iconName) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon name={iconName} size={16} color="#666" style={styles.fieldIcon} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={isEditing ? handleSave : handleEdit}
        >
          <Icon 
            name={isEditing ? "check" : "edit-3"} 
            size={20} 
            color={isEditing ? "#4CAF50" : "#666"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.imageContainer}>
            <Image source={employeeData.profileImage} style={styles.profileImage} />
            <TouchableOpacity style={styles.cameraButton}>
              <Icon name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.employeeName}>{employeeData.name}</Text>
          <Text style={styles.employeeMobile}>{employeeData.mobile}</Text>
        </View>

        {/* Employee Details Form */}
        <View style={styles.formContainer}>
          <View style={styles.legendContainer}>
            <Icon name="user" size={20} color="#4A90E2" />
            <Text style={styles.legendText}>Employee Full Details</Text>
          </View>

          <View style={styles.formSection}>
            {renderField('Employee ID', employeeData.employeeId, 'hash')}
            {renderField('Email Address', employeeData.email, 'mail')}
            {renderField('Department', employeeData.department, 'briefcase')}
            {renderField('Designation', employeeData.designation, 'award')}
            {renderField('Joining Date', employeeData.joiningDate, 'calendar')}
            {renderField('Salary', employeeData.salary, 'dollar-sign')}
          </View>

          <View style={styles.legendContainer}>
            <Icon name="map-pin" size={20} color="#4A90E2" />
            <Text style={styles.legendText}>Personal Information</Text>
          </View>

          <View style={styles.formSection}>
            {renderField('Address', employeeData.address, 'home')}
            {renderField('Emergency Contact', employeeData.emergencyContact, 'phone')}
            {renderField('Blood Group', employeeData.bloodGroup, 'droplet')}
            {renderField('Date of Birth', employeeData.dateOfBirth, 'gift')}
            {renderField('Gender', employeeData.gender, 'user')}
            {renderField('Marital Status', employeeData.maritalStatus, 'heart')}
          </View>

          <View style={styles.legendContainer}>
            <Icon name="book" size={20} color="#4A90E2" />
            <Text style={styles.legendText}>Educational & Experience</Text>
          </View>

          <View style={styles.formSection}>
            {renderField('Qualification', employeeData.qualification, 'graduation-cap')}
            {renderField('Experience', employeeData.experience, 'clock')}
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#4A90E2',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A90E2',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  employeeMobile: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  legendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    paddingLeft: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EmployeeProfile;
