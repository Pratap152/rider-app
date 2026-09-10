import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';

import Header from '../../components/attendance/Header';
import { getMonthlySummary } from '../../services/profile/attendanceApi';

const MonthlySummaryScreen = ({ route }) => {
  const { month, year } = route.params;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthName = monthNames[month - 1];

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);

      const response = await getMonthlySummary(month, year);

      if (response.data.success) {
        setSummary(response.data.data);
      }

    } catch (error) {
      console.log(error);

      Alert.alert(
        'Error',
        'Unable to fetch monthly summary.'
      );

    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#1F3365"
        />
      </SafeAreaView>
    );
  }

  const Item = ({ title, value, color = '#1F3365' }) => (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>{title}</Text>

      <Text
        style={[
          styles.itemValue,
          { color },
        ]}>
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      <Header title="Monthly Summary" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        <View style={styles.monthCard}>

          <Text style={styles.month}>
            {monthName} {year}
          </Text>

          <Text style={styles.subtitle}>
            Attendance Summary
          </Text>

        </View>

        <View style={styles.card}>

          <Item
            title="Present Days"
            value={summary.presentDays}
            color="#4CAF50"
          />

          <Item
            title="Full Days"
            value={summary.fullDays}
            color="#4CAF50"
          />

          <Item
            title="Half Days"
            value={summary.halfDays}
            color="#FFC107"
          />

          <Item
            title="1/3 Days"
            value={summary.oneThirdDays}
            color="#FF9800"
          />

          <Item
            title="Absent Days"
            value={summary.absentDays}
            color="#F44336"
          />
          <Item
            title="No Shift Assigned Days"
            value={summary.noShiftAssignedDays}
            color="#9CA3AF"
          />
          <Item
            title="Holidays"
            value={summary.holidays}
            color="#2196F3"
          />

          <Item
            title="Working Hours"
            value={`${summary.workingHours} hrs`}
          />

          <Item
            title="Estimated Salary"
            value={`₹${summary.estimatedSalary}`}
            color="#2E7D32"
          />

        </View>

      </ScrollView>

    </SafeAreaView>
  );
};

export default MonthlySummaryScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  monthCard: {
    backgroundColor: '#1F3365',
    borderRadius: 16,
    paddingVertical: responsiveHeight(3),
    alignItems: 'center',
    marginBottom: 20,
  },

  month: {
    fontSize: responsiveFontSize(2.6),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  subtitle: {
    marginTop: 6,
    color: '#D7E3FF',
    fontSize: responsiveFontSize(1.8),
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,

    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingVertical: 14,

    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  itemTitle: {
    fontSize: responsiveFontSize(1.9),
    color: '#666',
    fontWeight: '500',
  },

  itemValue: {
    fontSize: responsiveFontSize(2),
    fontWeight: '700',
  },

});