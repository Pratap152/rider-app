import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  findNodeHandle,
} from 'react-native';
 
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
 
import {
  responsiveWidth as rw,
  responsiveHeight as rh,
  responsiveFontSize as rf,
} from 'react-native-responsive-dimensions';
 
import DeviceInfo from 'react-native-device-info';
 
import {
  getBankDetails,
  updateBankDetails,
} from '../../services/profile/profileApiService';
 
const isTablet = DeviceInfo.isTablet();
const containerMaxWidth = isTablet ? 900 : '100%';
 
/* =========================================================
   VALIDATION RULES
   ========================================================= */
 
/*
 * Name fields:
 * - Alphabets only
 * - Single spaces between words
 * - Minimum 3 characters
 * - Maximum 30 characters
 * - No leading space
 * - No trailing space
 * - No consecutive spaces
 */
const NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
 
/*
 * Account number:
 * - Exactly 15 digits
 * - Cannot contain letters
 * - Cannot contain spaces
 * - Cannot be all the same digit
 */
const ACCOUNT_NUMBER_REGEX = /^\d{15}$/;
 
/*
 * Indian IFSC:
 * - Exactly 11 characters
 * - First 4 must be alphabets
 * - 5th must be 0
 * - Last 6 can be alphabets/numbers
 */
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
 
const ACCOUNT_TYPES = ['SAVINGS', 'CURRENT'];
 
const FIELD_LABELS = {
  accountHolderName: 'Account holder name',
  bankName: 'Bank name',
  branch: 'Branch name',
};
 
/* =========================================================
   VALIDATION FUNCTIONS
   ========================================================= */
 
const validateName = value => {
  if (typeof value !== 'string') {
    return false;
  }
 
  if (!value) {
    return false;
  }
 
  if (value.length < 3 || value.length > 30) {
    return false;
  }
 
  return NAME_REGEX.test(value);
};
 
const getNameError = (value, fieldName) => {
  if (!value) {
    return `${fieldName} is required`;
  }
 
  if (value.length > 30) {
    return `${fieldName} must not exceed 30 characters`;
  }
 
  if (value[0] === ' ') {
    return `${fieldName} cannot start with a space`;
  }
 
  if (value[value.length - 1] === ' ') {
    return `${fieldName} cannot end with a space`;
  }
 
  if (/\s{2,}/.test(value)) {
    return `${fieldName} cannot contain consecutive spaces`;
  }
 
  if (value.trim().length < 3) {
    return `${fieldName} must contain at least 3 characters`;
  }
 
  if (!NAME_REGEX.test(value)) {
    return `${fieldName} can contain only alphabets and single spaces`;
  }
 
  return '';
};
 
const validateAccount = value => {
  if (!ACCOUNT_NUMBER_REGEX.test(value)) {
    return false;
  }
 
  // Reject 000000000000000, 111111111111111, etc.
  if (/^(\d)\1{14}$/.test(value)) {
    return false;
  }
 
  return true;
};
 
const getAccountError = value => {
  if (!value) {
    return 'Account number is required';
  }
 
  if (!/^\d+$/.test(value)) {
    return 'Account number can contain only digits';
  }
 
  if (value.length < 15) {
    return 'Account number must be exactly 15 digits';
  }
 
  if (value.length > 15) {
    return 'Account number must be exactly 15 digits';
  }
 
  if (/^(\d)\1{14}$/.test(value)) {
    return 'Account number cannot be all the same digit';
  }
 
  return '';
};
 
const validateIFSC = value => {
  if (!value) {
    return false;
  }
 
  return IFSC_REGEX.test(value);
};
 
const getIFSCError = value => {
  if (!value) {
    return 'IFSC code is required';
  }
 
  if (value.length < 11) {
    return 'IFSC code must be exactly 11 characters';
  }
 
  if (value.length > 11) {
    return 'IFSC code must be exactly 11 characters';
  }
 
  if (!/^[A-Z]{4}/.test(value)) {
    return 'First 4 characters of IFSC must be alphabets';
  }
 
  if (value.length >= 5 && value[4] !== '0') {
    return 'The 5th character of IFSC must be 0';
  }
 
  if (!IFSC_REGEX.test(value)) {
    return 'Invalid IFSC code format';
  }
 
  return '';
};
 
/* =========================================================
   COMPONENT
   ========================================================= */
 
const BankAC = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const inputRefs = useRef({});
 
  const [isEditing, setIsEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] =
    useState(false);
 
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountType: '',
    branch: '',
  });
 
  const [verification, setVerification] = useState({
    bank: '',
    ifsc: '',
  });
 
  /* =========================================================
     FETCH BANK DETAILS
     ========================================================= */
 
  const fetchBankDetails = async () => {
    try {
      const res = await getBankDetails();
 
      if (res?.data?.success) {
        const data = res.data.data;
 
        /*
         * Clean backend values before displaying them.
         * This does not change the UI.
         */
 
        const cleanName = value => {
          if (!value) {
            return '';
          }
 
          return String(value)
            .replace(/[^A-Za-z ]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 30);
        };
 
        const cleanAccountNumber = value => {
          if (!value) {
            return '';
          }
 
          return String(value)
            .replace(/\D/g, '')
            .slice(0, 15);
        };
 
        const cleanIFSC = value => {
          if (!value) {
            return '';
          }
 
          return String(value)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 11);
        };
 
        const accountType = String(data?.accountType || '').toUpperCase();
 
        setBankDetails({
          accountHolderName: cleanName(data?.accountHolderName),
          accountNumber: cleanAccountNumber(data?.accountNumber),
          ifscCode: cleanIFSC(data?.ifscCode),
          bankName: cleanName(data?.bankName),
          accountType: ACCOUNT_TYPES.includes(accountType)
            ? accountType
            : '',
          branch: cleanName(data?.branch),
        });
 
        setVerification({
          bank: data?.bankVerificationStatus || '',
          ifsc: data?.ifscVerificationStatus || '',
        });
      }
    } catch (error) {
      console.log('Fetch bank details error:', error);
      Alert.alert('Error', 'Failed to fetch bank details');
    }
  };
 
  useEffect(() => {
    fetchBankDetails();
  }, []);
 
  /* =========================================================
     VALIDATION
     ========================================================= */
 
  const holderValid = validateName(bankDetails.accountHolderName);
  const bankNameValid = validateName(bankDetails.bankName);
  const branchValid = validateName(bankDetails.branch);
  const accountValid = validateAccount(bankDetails.accountNumber);
  const ifscValid = validateIFSC(bankDetails.ifscCode);
 
  const accountTypeValid = ACCOUNT_TYPES.includes(
    bankDetails.accountType,
  );
 
  const allValid =
    holderValid &&
    bankNameValid &&
    branchValid &&
    accountValid &&
    ifscValid &&
    accountTypeValid;
 
  /* =========================================================
     LIVE ERRORS
     ========================================================= */
 
  const liveErrors = {
    accountHolderName:
      bankDetails.accountHolderName.length > 0 && !holderValid
        ? getNameError(
            bankDetails.accountHolderName,
            FIELD_LABELS.accountHolderName,
          )
        : '',
 
    bankName:
      bankDetails.bankName.length > 0 && !bankNameValid
        ? getNameError(bankDetails.bankName, FIELD_LABELS.bankName)
        : '',
 
    branch:
      bankDetails.branch.length > 0 && !branchValid
        ? getNameError(bankDetails.branch, FIELD_LABELS.branch)
        : '',
 
    accountNumber:
      bankDetails.accountNumber.length > 0 && !accountValid
        ? getAccountError(bankDetails.accountNumber)
        : '',
 
    ifscCode:
      bankDetails.ifscCode.length > 0 && !ifscValid
        ? getIFSCError(bankDetails.ifscCode)
        : '',
 
    accountType:
      isEditing && !accountTypeValid
        ? 'Please select an account type'
        : '',
  };
 
  /* =========================================================
     INPUT HANDLING
     ========================================================= */
 
  const handleInputChange = (key, text) => {
  /* ---------------------------------------------
     ACCOUNT NUMBER
     --------------------------------------------- */
  if (key === 'accountNumber') {
    // Allow digits only.
    // Invalid characters are rejected instead of
    // being removed from the controlled value.
    if (!/^\d*$/.test(text)) {
      return;
    }
 
    if (text.length > 15) {
      return;
    }
 
    setBankDetails(prev => ({
      ...prev,
      accountNumber: text,
    }));
 
    return;
  }
 
  /* ---------------------------------------------
     IFSC CODE
     --------------------------------------------- */
  if (key === 'ifscCode') {
    // Allow only A-Z and 0-9.
    // Invalid characters are rejected.
    const upperText = text.toUpperCase();
 
    if (!/^[A-Z0-9]*$/.test(upperText)) {
      return;
    }
 
    if (upperText.length > 11) {
      return;
    }
 
    setBankDetails(prev => ({
      ...prev,
      ifscCode: upperText,
    }));
 
    return;
  }
 
  /* ---------------------------------------------
     ACCOUNT HOLDER / BANK NAME / BRANCH
     --------------------------------------------- */
  if (
    ['accountHolderName', 'bankName', 'branch'].includes(key)
  ) {
    /*
     * IMPORTANT:
     * Do NOT use .replace() here.
     *
     * If the user types an invalid character such as
     * a number, simply reject that input change.
     *
     * This prevents the controlled TextInput from
     * changing its value underneath the native cursor.
     */
 
    // Alphabets and spaces only.
    if (!/^[A-Za-z ]*$/.test(text)) {
      return;
    }
 
    // Do not allow a leading space.
    if (text.startsWith(' ')) {
      return;
    }
 
    // Do not allow two consecutive spaces.
    if (text.includes('  ')) {
      return;
    }
 
    // Maximum 30 characters.
    if (text.length > 30) {
      return;
    }
 
    setBankDetails(prev => ({
      ...prev,
      [key]: text,
    }));
 
    return;
  }
 
  /* ---------------------------------------------
     OTHER FIELDS
     --------------------------------------------- */
  setBankDetails(prev => ({
    ...prev,
    [key]: text,
  }));
};
  /* =========================================================
     KEEP ACTIVE FIELD ABOVE KEYBOARD
     ========================================================= */
 
  const handleInputFocus = key => {
    /*
     * Give React Native a moment to open the keyboard,
     * then ask ScrollView to move the focused TextInput
     * above the keyboard.
     */
    setTimeout(() => {
      const input = inputRefs.current[key];
 
      if (!input || !scrollViewRef.current) {
        return;
      }
 
      const scrollResponder =
        scrollViewRef.current.getScrollResponder?.();
 
      if (
        scrollResponder &&
        scrollResponder.scrollResponderScrollNativeHandleToKeyboard
      ) {
        scrollResponder.scrollResponderScrollNativeHandleToKeyboard(
          findNodeHandle(input),
          120,
          true,
        );
      }
    }, Platform.OS === 'android' ? 250 : 150);
  };
 
  /* =========================================================
     UPDATE BANK DETAILS
     ========================================================= */
 
 const handleUpdateBankDetails = async () => {
  const finalHolder = bankDetails.accountHolderName.trim();
  const finalBankName = bankDetails.bankName.trim();
  const finalBranch = bankDetails.branch.trim();
  const finalAccountNumber = bankDetails.accountNumber;
  const finalIFSC = bankDetails.ifscCode.toUpperCase();
  const finalAccountType = bankDetails.accountType;
 
  const finalValid =
    validateName(finalHolder) &&
    validateName(finalBankName) &&
    validateName(finalBranch) &&
    validateAccount(finalAccountNumber) &&
    validateIFSC(finalIFSC) &&
    ACCOUNT_TYPES.includes(finalAccountType);
 
  if (!finalValid) {
    Alert.alert(
      'Invalid Bank Details',
      'Please check all bank details and fix the validation errors.',
    );
    return;
  }
 
  try {
    const payload = {
      bankDetails: {
        bankName: finalBankName,
        accountHolderName: finalHolder,
        accountType: finalAccountType,
        branch: finalBranch,
        accountNumber: finalAccountNumber,
        ifscCode: finalIFSC,
      },
    };
 
    const res = await updateBankDetails(payload);
 
    if (res?.data?.success) {
      // Close edit mode
      setIsEditing(false);
      setShowAccountTypeDropdown(false);
 
      // Refresh the latest details from backend
      await fetchBankDetails();
 
      // Show success message
      Alert.alert(
        'Success',
        'Bank details updated successfully.',
      );
    } else {
      Alert.alert(
        'Update Failed',
        res?.data?.message || 'Failed to update bank details.',
      );
    }
  } catch (error) {
    console.log(
      'Update bank error:',
      error?.response?.data || error,
    );
 
    Alert.alert(
      'Update Failed',
      error?.response?.data?.message ||
        'Something went wrong while updating bank details. Please try again.',
    );
  }
};
  /* =========================================================
     UI HELPERS
     ========================================================= */
 
  const toggleTooltip = () => {
    setShowInfo(prev => !prev);
  };
 
  const statusColor = status =>
    status === 'VERIFIED'
      ? '#00A63E'
      : status === 'PENDING'
      ? '#FFA500'
      : '#FF3B30';
 
  const accountTypeOptions = ['', 'SAVINGS', 'CURRENT'];
 
  /* =========================================================
     RENDER
     ========================================================= */
 
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? rh(6) : 0
        }
      >
        <View style={styles.screenWrapper}>
          <View style={styles.container}>
            {/* HEADER */}
           {/* HEADER */}
<View style={styles.header}>
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    style={styles.headerIcon}
  >
    <Ionicons
      name="arrow-back"
      size={rf(3)}
      color="#000"
    />
  </TouchableOpacity>
 
  <Text style={styles.headerTitle}>
    Bank Details
  </Text>
 
  {/* EDIT BUTTON - ALWAYS VISIBLE */}
  <TouchableOpacity
    onPress={() => {
      if (isEditing) {
        // Cancel editing
        setShowAccountTypeDropdown(false);
        fetchBankDetails();
      }
 
      setIsEditing(prev => !prev);
    }}
    style={styles.editButton}
  >
    <Text style={styles.editText}>
      {isEditing ? 'Cancel' : 'Edit'}
    </Text>
  </TouchableOpacity>
</View>
 
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              nestedScrollEnabled
              automaticallyAdjustKeyboardInsets={
                Platform.OS === 'ios'
              }
            >
              {/* INFO */}
              <View style={styles.infoContainer}>
                <TouchableOpacity
                  onPress={toggleTooltip}
                  style={styles.infoRow}
                >
                  <Icon
                    name="info-outline"
                    size={22}
                    color="#192A51"
                  />
 
                  <Text style={styles.infoText}>
                    Secure Information
                  </Text>
                </TouchableOpacity>
 
                {showInfo && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>
                      Your bank details are securely stored and
                      used only for payouts.
                    </Text>
                  </View>
                )}
              </View>
 
              {/* BANK DETAILS */}
              <View style={styles.detailsContainer}>
                <View style={styles.accountHeader}>
                  <Text style={styles.accountHeaderText}>
                    Bank Account Information
                  </Text>
                </View>
 
                {[
                  {
                    label: 'Account Holder Name',
                    key: 'accountHolderName',
                    autoCapitalize: 'words',
                    returnKeyType: 'next',
                  },
                  {
                    label: 'Account Number',
                    key: 'accountNumber',
                    keyboardType: 'numeric',
                    returnKeyType: 'next',
                  },
                  {
                    label: 'IFSC Code',
                    key: 'ifscCode',
                    autoCapitalize: 'characters',
                    autoCorrect: false,
                    returnKeyType: 'next',
                  },
                  {
                    label: 'Bank Name',
                    key: 'bankName',
                    autoCapitalize: 'words',
                    returnKeyType: 'next',
                  },
                  {
                    label: 'Branch',
                    key: 'branch',
                    autoCapitalize: 'words',
                    returnKeyType: 'done',
                  },
                ].map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.inputBox,
                      isTablet && styles.inputBoxTablet,
                    ]}
                  >
                    <Text
                      style={[
                        styles.label,
                        isTablet && styles.labelTablet,
                      ]}
                    >
                      {item.label}
                    </Text>
 
                    <TextInput
                      ref={ref => {
                        inputRefs.current[item.key] = ref;
                      }}
                      style={[
                        styles.input,
                        !isEditing && styles.disabledInput,
                        isTablet && styles.inputTablet,
                        isEditing &&
                          liveErrors[item.key] &&
                          styles.inputError,
                      ]}
                      editable={isEditing}
                      value={bankDetails[item.key]}
                      keyboardType={
                        item.keyboardType || 'default'
                      }
                      maxLength={
                        item.key === 'accountNumber'
                          ? 15
                          : [
                              'accountHolderName',
                              'bankName',
                              'branch',
                            ].includes(item.key)
                          ? 30
                          : item.key === 'ifscCode'
                          ? 11
                          : undefined
                      }
                      autoCapitalize={
                        item.autoCapitalize || 'none'
                      }
                      autoCorrect={
                        item.autoCorrect !== undefined
                          ? item.autoCorrect
                          : false
                      }
                      returnKeyType={item.returnKeyType}
                      blurOnSubmit={false}
                      onFocus={() =>
                        handleInputFocus(item.key)
                      }
                      onChangeText={text =>
                        handleInputChange(item.key, text)
                      }
                    />
 
                    {/* LIVE ERROR MESSAGE */}
                    {isEditing && liveErrors[item.key] ? (
                      <Text style={styles.errorText}>
                        {liveErrors[item.key]}
                      </Text>
                    ) : null}
                  </View>
                ))}
 
                {/* ACCOUNT TYPE */}
                <View
                  style={[
                    styles.inputBox,
                    isTablet && styles.inputBoxTablet,
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      isTablet && styles.labelTablet,
                    ]}
                  >
                    Account Type
                  </Text>
 
                  <TouchableOpacity
                    style={[
                      styles.input,
                      !isEditing && styles.disabledInput,
                      isTablet && styles.inputTablet,
                      isEditing &&
                        liveErrors.accountType &&
                        styles.inputError,
                    ]}
                    onPress={() => {
                      if (isEditing) {
                        setShowAccountTypeDropdown(true);
                      }
                    }}
                    disabled={!isEditing}
                  >
                    <Text
                      style={[
                        styles.inputText,
                        !bankDetails.accountType &&
                          styles.placeholderText,
                      ]}
                    >
                      {bankDetails.accountType ||
                        'Select Account Type'}
                    </Text>
 
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color="#666"
                      style={styles.dropdownIcon}
                    />
                  </TouchableOpacity>
 
                  {isEditing && liveErrors.accountType ? (
                    <Text style={styles.errorText}>
                      {liveErrors.accountType}
                    </Text>
                  ) : null}
                </View>
 
                {/* SAVE */}
                {isEditing && (
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      !allValid && styles.saveBtnDisabled,
                    ]}
                    disabled={!allValid}
                    onPress={handleUpdateBankDetails}
                  >
                    <Text style={styles.saveText}>
                      Save Changes
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
 
              {/* VERIFICATION STATUS */}
              {!isEditing && (
                <View style={styles.detailsContainer1}>
                  <View style={styles.verifyContainer}>
                    <Text style={styles.verifyTitle}>
                      Verification Status
                    </Text>
 
                    {[
                      {
                        label: 'Bank Account',
                        value: verification.bank,
                      },
                      {
                        label: 'IFSC Code',
                        value: verification.ifsc,
                      },
                    ].map((item, index) => (
                      <View
                        key={index}
                        style={[
                          styles.verifyCard,
                          isTablet &&
                            styles.verifyCardTablet,
                        ]}
                      >
                        <View style={styles.leftRow}>
                          <View
                            style={[
                              styles.greenDot,
                              {
                                backgroundColor: statusColor(
                                  item.value,
                                ),
                              },
                            ]}
                          />
 
                          <Text
                            style={[
                              styles.verifyLabel,
                              isTablet &&
                                styles.verifyLabelTablet,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </View>
 
                        <Text
                          style={[
                            styles.verifyText,
                            {
                              color: statusColor(
                                item.value,
                              ),
                            },
                            isTablet &&
                              styles.verifyTextTablet,
                          ]}
                        >
                          {item.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
 
              {/* EXTRA BOTTOM SPACE FOR KEYBOARD */}
              <View
                style={{
                  height: rh(isEditing ? 18 : 2),
                }}
              />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
 
      {/* ACCOUNT TYPE DROPDOWN MODAL */}
      <Modal
        transparent
        visible={showAccountTypeDropdown}
        animationType="fade"
        onRequestClose={() =>
          setShowAccountTypeDropdown(false)
        }
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() =>
            setShowAccountTypeDropdown(false)
          }
        >
          <View style={styles.dropdownContainer}>
            {accountTypeOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownOption}
                onPress={() => {
                  setBankDetails(prev => ({
                    ...prev,
                    accountType: option,
                  }));
 
                  setShowAccountTypeDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>
                  {option || 'Select Account Type'}
                </Text>
              </TouchableOpacity>
            ))}
 
            {/* CLEAR SELECTION */}
            <TouchableOpacity
              style={[
                styles.dropdownOption,
                styles.clearOption,
              ]}
              onPress={() => {
                setBankDetails(prev => ({
                  ...prev,
                  accountType: '',
                }));
 
                setShowAccountTypeDropdown(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownOptionText,
                  styles.clearText,
                ]}
              >
                Clear Selection
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};
 
export default BankAC;
 
/* =========================================================
   STYLES
   ========================================================= */
 
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
 
  screenWrapper: {
    flex: 1,
    backgroundColor: '#fff',
 
    ...(isTablet && {
      alignItems: 'center',
    }),
  },
 
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
 
    ...(isTablet && {
      maxWidth: containerMaxWidth,
    }),
  },
 
  scrollContent: {
    paddingBottom: rh(4),
    flexGrow: 1,
  },
 
 header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: rw(4),
  paddingVertical: rh(2),
},
 
headerIcon: {
  width: rw(15),
  justifyContent: 'center',
},
 
headerTitle: {
  flex: 1,
  textAlign: 'center',
  fontSize: 20,
  fontWeight: '700',
  color: '#000',
},
 
editButton: {
  width: rw(15),
  alignItems: 'flex-end',
  justifyContent: 'center',
},
 
editText: {
  color: '#192A51',
  fontSize: 15,
  fontWeight: '600',
},
 
  infoContainer: {
    marginHorizontal: 16,
    marginTop: 10,
  },
 
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
 
  infoText: {
    marginLeft: 6,
    color: '#192A51',
    fontWeight: '500',
  },
 
  tooltip: {
    marginTop: 8,
    backgroundColor: '#E8F1FF',
    padding: 12,
    borderRadius: 8,
  },
 
  tooltipText: {
    fontSize: 14,
    color: '#333',
  },
 
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    margin: 12,
    borderRadius: 10,
    padding: 16,
 
    ...(isTablet && {
      width: '95%',
      alignSelf: 'center',
      padding: 24,
    }),
  },
 
  detailsContainer1: {
    backgroundColor: '#F9FAFB',
    margin: 12,
    borderRadius: 10,
 
    ...(isTablet && {
      width: '95%',
      alignSelf: 'center',
    }),
  },
 
  inputBox: {
    marginBottom: 14,
  },
 
  inputBoxTablet: {
    width: '100%',
    alignSelf: 'center',
  },
 
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },
 
  labelTablet: {
    ...(isTablet && {
      fontSize: rf(1.9),
      marginBottom: 10,
    }),
  },
 
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFF',
  },
 
  inputError: {
    borderColor: '#FF3B30',
  },
 
  inputTablet: {
    ...(isTablet && {
      height: rh(7),
      fontSize: rf(1.9),
      paddingHorizontal: rw(2.5),
    }),
  },
 
  disabledInput: {
    backgroundColor: '#F1F1F1',
  },
 
  inputText: {
    fontSize: 14,
    color: '#000',
  },
 
  placeholderText: {
    color: '#999',
  },
 
  dropdownIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
 
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
 
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
 
  accountIcon: {
    width: 26,
    height: 26,
    marginRight: 10,
 
    ...(isTablet && {
      width: 34,
      height: 34,
    }),
  },
 
  accountHeaderText: {
    fontSize: 18,
    fontWeight: '600',
 
    ...(isTablet && {
      fontSize: rf(2.4),
    }),
  },
 
  verifyContainer: {
    margin: 16,
  },
 
  verifyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
 
    ...(isTablet && {
      fontSize: rf(2.2),
    }),
  },
 
  verifyCard: {
    backgroundColor: '#EFFFF4',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
 
  verifyCardTablet: {
    ...(isTablet && {
      paddingVertical: rh(2),
      paddingHorizontal: rw(3),
    }),
  },
 
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
 
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
 
    ...(isTablet && {
      width: 14,
      height: 14,
      borderRadius: 10,
    }),
  },
 
  verifyLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
 
  verifyLabelTablet: {
    ...(isTablet && {
      fontSize: rf(2),
    }),
  },
 
  verifyText: {
    fontSize: 14,
    fontWeight: '600',
  },
 
  verifyTextTablet: {
    ...(isTablet && {
      fontSize: rf(1.9),
    }),
  },
 
  saveBtn: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
 
    ...(isTablet && {
      width: '50%',
      alignSelf: 'center',
    }),
  },
 
  saveBtnDisabled: {
    backgroundColor: '#9BB4FF',
  },
 
  saveText: {
    color: '#fff',
    fontWeight: '600',
  },
 
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
 
  dropdownContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
 
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
 
  dropdownOptionText: {
    fontSize: 16,
    color: '#000',
  },
 
  clearOption: {
    backgroundColor: '#FFF5F5',
  },
 
  clearText: {
    color: '#FF3B30',
  },
});
 