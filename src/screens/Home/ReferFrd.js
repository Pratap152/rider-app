import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';
import ReferralBanner from './ReferralBanner';

import { referRider } from '../../services/referralService';
import apiClient from "../../services/ApiClient";

function ReferFrd({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);

  /* PHONE VALIDATION  */
  const validatePhone = (value) => {
    if (!/^\d*$/.test(value)) {
      return 'Only numbers are allowed';
    }

    if (value.length !== 10) {
      return 'Phone number must be 10 digits';
    }

    if (!/^[6-9]/.test(value)) {
      return 'Phone number must start with 6, 7, 8, or 9';
    }

    if (/^(\d)\1{9}$/.test(value)) {
      return 'Invalid phone number sequence';
    }

    return '';
  };

  /*  HANDLE SUBMIT */
  const handleConfirm = useCallback(async () => {
    if (loading) return;

    if (!name || !phone || !city) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    const error = validatePhone(phone);
    if (error) {
      setPhoneError(error);
      return;
    }

    try {
      setLoading(true);
      setPhoneError('');

      const payload = {
        name,
        phoneNumber: phone,
        area: city,
      };

      const response = await referRider(payload);

      const resData = response?.data;

      if (resData?.success) {
        //  POPUP ALERT (VISIBLE CONFIRMATION)
        Alert.alert(
          'Success ',
          resData.message || 'Rider referred successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                setName('');
                setPhone('');
                setCity('');
              },
            },
          ]
        );

      } else {
        Alert.alert('Failed', resData?.message || 'Something went wrong');
      }

    } catch (err) {
      console.log('API ERROR:', err?.response?.data || err);

      Alert.alert(
        'Error',
        err?.response?.data?.message ||
        'Failed to refer rider. Try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [name, phone, city, loading]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={{ flex: 1 }}>

        <View style={styles.fixedTopBanner}>
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#0F172A"
              />
            </TouchableOpacity>
          </View>
          <ReferralBanner />
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: hp("25%") }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Title */}
          <View style={styles.titleRow}>
            <View style={styles.line} />
            <Text style={styles.title}>Refer & Earn</Text>
            <View style={styles.line} />
          </View>

          <Text style={styles.sectionSubtitle}>
            Enter the details below so we can get to know about your Refer
          </Text>

          <View style={styles.formContainer}>
            {/* Name */}
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="Please enter first name"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            {/* Phone */}
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              placeholder="Please enter Phone Number"
              keyboardType="number-pad"
              maxLength={10}
              style={[
                styles.input,
                phoneError ? styles.inputError : null,
              ]}
              value={phone}
              onChangeText={(text) => {
                const clean = text.replace(/[^0-9]/g, '');
                setPhone(clean);
                setPhoneError(clean.length ? validatePhone(clean) : '');
              }}
            />

            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}

            {/* City */}
            <Text style={styles.label}>Friend's City Name</Text>
            <TextInput
              placeholder="Please enter City"
              style={styles.input}
              value={city}
              onChangeText={setCity}
            />

            {/* Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                loading ? { opacity: 0.6 } : null,
              ]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Submitting...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export default ReferFrd;



const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: hp("6%"),
  },
  fixedTopBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },

  backButtonContainer: {
    position: "absolute",
    top: hp("3%"),
    left: wp("6%"),
    zIndex: 20,
  },

  backButton: {
    width: 30,
    height: 30,
    borderRadius: 21,

    backgroundColor: "rgba(255,255,255,0.95)",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 5,
  },
  sectionSubtitle: {
    fontSize: wp("3.2%"),
    color: '#6F6F6F',
    marginTop: hp("0.8%"),
    marginHorizontal: wp("4%"),
    marginBottom: hp("2.5%"),
    lineHeight: hp("2.3%"),
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp("2%"),
    marginBottom: hp("3%"),
    paddingHorizontal: wp("5%"),
  },

  title: {
    marginHorizontal: wp("2.5%"),
    fontWeight: "700",
    fontSize: wp("4%"),
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },

  formContainer: {
    marginHorizontal: wp("4%"),
    padding: wp("3%"),
  },

  label: {
    fontSize: wp("3.2%"),
    color: '#6F6F6F',
    marginBottom: hp("0.8%"),
  },

  input: {
    height: hp("6%"),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: wp("2%"),
    paddingHorizontal: wp("3%"),
    fontSize: wp("3.6%"),
    color: '#000',
    marginBottom: hp("2%"),
    backgroundColor: '#FFF',
  },

  inputError: {
    borderColor: 'red',
  },

  errorText: {
    color: 'red',
    fontSize: wp("3%"),
    marginTop: hp("-1%"),
    marginBottom: hp("1%"),
  },

  confirmButton: {
    backgroundColor: '#19A7CE',
    height: hp("6%"),
    borderRadius: hp("3%"),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp("5.5%"),
  },

  confirmButtonText: {
    color: '#FFF',
    fontSize: wp("4%"),
    fontWeight: '600',
  },
});