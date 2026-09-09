import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

export default function SlotHistory() {
  const navigation = useNavigation();

  const riderType = useSelector(
    state => state.profile.data?.riderType,
  );

  const handleSlotHistoryPress = () => {
    console.log('Slot History Rider Type:', riderType);

    if (riderType === 'INDIVIDUAL_EMPLOYEE') {
      // Individual Employee
      // Go to Profile's Slot History screen
      navigation.navigate('SlotHistory');
    } else if (
      riderType === 'COMPANY_EMPLOYEE' ||
      riderType === 'ZESTBOT_EMPLOYEE'
    ) {
      // Company / Zestbot Employee
      // Go to SlotsNavigator's SlotHistoryScreen
      navigation.navigate('SlotHistoryScreen');
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleSlotHistoryPress}
      style={styles.slots_history}>
      
      <MaterialIcons
        name="history"
        size={isTablet ? 26 : 22}
        color="#4B5563"
        style={styles.icon}
      />

      <Text style={styles.historyText}>
        View Slots History
      </Text>

      <MaterialIcons
        name="keyboard-arrow-right"
        size={isTablet ? 30 : 24}
        color="#4B5563"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slots_history: {
    flexDirection: 'row',
    alignItems: 'center',

    width: isTablet ? '96%' : wp(94),
    height: isTablet ? 64 : 52,

    alignSelf: 'center',

    backgroundColor: '#FCFDFF',
    borderRadius: 14,

    marginTop: 16,
    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#EEF2F7',

    paddingHorizontal: 16,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  icon: {
    marginRight: 12,
  },

  historyText: {
    flex: 1,
    fontSize: isTablet ? 20 : 15,
    fontWeight: '600',
    color: '#374151',
  },
});