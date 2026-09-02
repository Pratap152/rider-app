import React, { useState } from 'react';
import WEBSITE_URL from "../../utils/host";
import axios from "axios";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Alert,
  StatusBar,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';

const BUTTON_BLUE = '#192A51';
export const sendOTPApi = async (phone) => {
  console.log("📤 Sending OTP to:", phone);

  try {
    const response = await axios.post(
      `${WEBSITE_URL}/api/rider/auth/send-otp`,
      {
        phoneNumber: phone,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(response.data);
    return { status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
      };
    }
    // Network or unexpected error
    return {
      status: 500,
      data: { message: "Something went wrong" },
    };
  }
};


const LoginEntryScreen = ({ navigation }) => {

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit the app?",
          [
            {
              text: "No",
              style: "cancel",
            },
            {
              text: "Yes",
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );

        return true; // Prevent default behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  const [mobileNumber, setMobileNumber] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [error, setError] = useState('');
  // ---------------------------
  // MOBILE NUMBER VALIDATION
  // ---------------------------
  const validateMobileNumber = (num) => {
    if (num.length === 0) return "";

    if (!/^[0-9]+$/.test(num))
      return "Only numbers are allowed";

    if (num.length !== 10)
      return "Mobile number must be 10 digits";

    if (!/^[6-9]/.test(num))
      return "Mobile number must start with 6, 7, 8 or 9";

    if (/^(\d)\1{9}$/.test(num))
      return "Please enter a valid mobile number";

    if (num === "1234567890" || num === "9876543210")
      return "This number looks invalid";

    return "";
  };

  const handleMobileNumberChange = (text) => {
    const filteredText = text.replace(/[^0-9]/g, '');
    setMobileNumber(filteredText);

    const validationMessage = validateMobileNumber(filteredText);
    setError(validationMessage);
  };
  const handleSendOTP = async () => {
    if (error || mobileNumber.length !== 10 || isSending) return;
    setIsSending(true);
    setError(""); // reset any previous errors

    const result = await sendOTPApi(mobileNumber);
    setIsSending(false);
    if (result.status === 200) {
      navigation.navigate("LoginVerifyScreen", {
        phone: mobileNumber,
      });
    }
    else if (result.status === 400) {
      setError("Invalid phone number");   // From API
    }
    else {
      setError("Failed to send OTP. Try again later.");
    }
  };


  const isButtonDisabled = Boolean(error) || mobileNumber.length !== 10 || !isChecked || isSending;

  return (
    <>
      <StatusBar
        backgroundColor="#192A51"
        barStyle="light-content"
        translucent={false}
      />

      <View style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* HEADER */}
              <View style={styles.header}>
                <Image
                  source={require('../../assets/zestbot.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* WHITE CURVE CARD */}
              <View style={styles.curveContainer}>
                <Text style={styles.welcomeText}>
                  Welcome
                </Text>

                <Text style={styles.subText}>
                  Be a ZestBot Partner
                  {"\n"}
                  Earn a stable daily income
                </Text>

                <View style={styles.contentArea}>
                  <Text style={styles.inputLabel}>
                    Enter Mobile Number
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      error ? { borderWidth: 1, borderColor: 'red' } : {},
                    ]}
                    value={mobileNumber}
                    onChangeText={handleMobileNumberChange}
                    placeholder="e.g. 98765 43210"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={10}
                  />

                  {error ? (
                    <Text style={styles.errorText}>
                      {error}
                    </Text>
                  ) : null}

                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      onPress={() => setIsChecked(!isChecked)}
                      style={styles.customCheckbox}
                    >
                      {isChecked && (
                        <Text style={styles.checkMark}>✓</Text>
                      )}
                    </TouchableOpacity>

                    <Text style={styles.termsText}>
                      By signing up I agree to the{' '}
                      <Text style={styles.linkText}>Terms of use</Text> and{' '}
                      <Text style={styles.linkText}>Privacy Policy.</Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      isButtonDisabled && styles.buttonDisabled,
                    ]}
                    onPress={handleSendOTP}
                    disabled={isButtonDisabled}
                  >
                    <Text style={styles.buttonText}>
                      {isSending ? 'Sending...' : 'Send OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};
export default LoginEntryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: hp('48%'),
    backgroundColor: '#192A51',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: wp('90%'),
    height: hp('28%'),
  },

  curveContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: -100,
    borderTopRightRadius: 100,
    paddingTop: hp('4%'),
    paddingBottom: hp('8%'),
  },
  welcomeText: {
    fontSize: hp('4.2%'),
    fontWeight: '700',
    color: '#1B2238',
    marginHorizontal: wp('8%'),
  },

  subText: {
    fontSize: hp('2.2%'),
    color: '#26292d',
    marginHorizontal: wp('8%'),
    marginTop: hp('1.2%'),
    lineHeight: hp('3%'),
    marginBottom: hp('2%'),
  },
  contentArea: {
    paddingHorizontal: wp('8%'),
    marginTop: hp('2%'),
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2238',
    marginBottom: 8,
  },

  input: {
    height: 56,
    backgroundColor: '#F2F4FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    marginBottom: 25,
  },

  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: -18,
    marginBottom: 18,
  },

  // ================= CHECKBOX =================
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 35,
  },

  customCheckbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#192A51',
    borderRadius: 5,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },

  checkMark: {
    color: '#192A51',
    fontSize: 16,
    fontWeight: 'bold',
  },

  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },

  linkText: {
    color: '#192A51',
    fontWeight: '600',
  },

  // ================= BUTTON =================
  button: {
    backgroundColor: '#192A51',
    height: 58,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },

  buttonDisabled: {
    backgroundColor: '#A2A2A2',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});