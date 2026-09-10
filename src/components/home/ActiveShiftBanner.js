import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native'; // safer
import apiClient from '../../services/ApiClient';
import { getCurrentSlot } from '../../services/Home/homeApiService';
import SlotBookingScreen from "../../screens/dashboard/SlotBookingScreen";
/* ================= TIME FORMAT HELPERS ================= */
const formatTime = time => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 || 12;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
};

// Convert minutes to "X hrs Y mins" format
const formatDelay = minutes => {
  if (!minutes || minutes === 0) return '0 mins';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return mins > 0 ? `${hrs} hrs ${mins} mins` : `${hrs} hrs`;
  }
  return `${mins} mins`;
};

const ActiveShiftBanner = () => {
  const navigation = useNavigation();
  const [slot, setSlot] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const riderType = response?.riderType;
  const breakInMinutes =
    riderType === 'INDIVIDUAL_EMPLOYEE' ? 10 : 30;
  const shiftType = response?.data?.shiftType;
  const startTime = response?.data?.startTime;
  const endTime = response?.data?.endTime;
  const shiftState = response?.data?.shiftState;

  const fetchSlot = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getCurrentSlot();
      setResponse(data);
      if (data?.success && data?.data?.slot) {
        setSlot(data.data.slot);
        setDelayMinutes(data.data.delayMinutes || 0);
      } else {
        setSlot(null);
        setDelayMinutes(0);
      }
    } catch (error) {
      console.error('Failed to fetch slot:', error);
      setSlot(null);
      setDelayMinutes(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // console.log('ActiveShiftBanner response:', response);

  useEffect(() => {
    fetchSlot();
    const interval = setInterval(fetchSlot, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSlot]);

  const getDurationInHours = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    let start = startHour * 60 + startMinute;
    let end = endHour * 60 + endMinute;

    // Handle overnight duration (e.g., 22:00 -> 06:00)
    if (end < start) {
      end += 24 * 60;
    }

    return (end - start) / 60;
  };

  const slotState = !slot
    ? shiftState === 'RUNNING' ? 'ACTIVE' : 'UPCOMING'
    : slot.status === 'ACTIVE'
      ? 'ACTIVE'
      : 'UPCOMING';

  const uiConfig = {
    ACTIVE: {
      title: 'Active Shift',
      subtitleSuffix: ' (Ongoing)',
      info: slot?.incentiveText || 'Go online and earn more',
      background: styles.active,
      onPress: () => navigation.navigate('SlotBooking'),
    },
    UPCOMING: {
      title: 'Next Shift',
      subtitleSuffix: ' (Upcoming)',
      info: 'Upcoming shift — wait until it becomes active',
      background: styles.active,
      onPress: () => navigation.navigate('SlotBooking'),
    },
    NONE: {
      title: 'Shift',
      subtitleSuffix: '',
      info: 'Please check back later',
      background: styles.inactive,
      onPress: () => Alert.alert('No Slot', 'No shifts available today'),
    },
  };

  const config = uiConfig[slotState];

  const IndividualEmployee = (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={config.onPress}
      style={[styles.container, config.background]}
    >
      {delayMinutes > 0 && (
        <View style={styles.delayBadge}>
          <Text style={styles.delayText}>
            Delay {formatDelay(delayMinutes)}
          </Text>
        </View>
      )}

      <Text style={styles.title}>{config.title}</Text>

      {slot ? (
        <View>
          <Text style={styles.subtitle}>
            {slot.isPeakSlot ? 'Peak Hours • ' : ''}
            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            {config.subtitleSuffix}
          </Text>

          <Text style={styles.meta}>
            Duration: {slot.durationInHours} hrs | Break: {breakInMinutes} mins
          </Text>

          <Text style={styles.info}>{config.info}</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.subtitle}>No shift today</Text>
          <Text style={styles.info}>{config.info}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const OtherRiderType = (
    <TouchableOpacity style={[styles.container, config.background]} onPress={config.onPress}>
      <Text style={styles.title}>{config.title}</Text>

      {startTime && endTime ? (
        <View>
          <Text style={styles.subtitle}>
            {formatTime(startTime)} - {formatTime(endTime)}
            {config.subtitleSuffix}
          </Text>
          <Text style={styles.meta}>
            Duration: {getDurationInHours(startTime, endTime)} hrs | Break: {breakInMinutes} mins
          </Text>
          <Text style={styles.info}>{config.info}</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.subtitle}>No shift today</Text>
          <Text style={styles.info}>{config.info}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      {riderType === 'INDIVIDUAL_EMPLOYEE' && IndividualEmployee}
      {riderType !== 'INDIVIDUAL_EMPLOYEE' && OtherRiderType}

    </View>
  );
};

export default ActiveShiftBanner;

const styles = StyleSheet.create({
  container: {
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginTop: wp('4%'),
    position: 'relative',
  },

  active: {
    backgroundColor: '#6D5DF6',
  },
  inactive: {
    backgroundColor: '#9CA3AF',
  },
  title: {
    fontSize: wp('4.3%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: wp('3.5%'),
    color: '#E0E7FF',
    marginTop: 4,
  },
  meta: {
    fontSize: wp('3.2%'),
    color: '#E5E7FF',
    marginTop: 4,
  },
  info: {
    fontSize: wp('3.4%'),
    color: '#D1D5FF',
    marginTop: 6,
  },
  delayBadge: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    // backgroundColor: '#544e58',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: wp('1%'),
    borderRadius: wp('4%'),
    zIndex: 10,
  },

  delayText: {
    color: '#FFFFFF',
    fontSize: wp('3%'),
    fontWeight: '700',
  },
});
