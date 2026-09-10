import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MONTHS = [
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

const CalendarCard = ({
  month,
  year,
  calendar = [],
  loading,
  onPreviousMonth,
  onNextMonth,
  navigation,
}) => {
  const statusMap = {};

  calendar.forEach(item => {
    statusMap[item.date] = item.status;
  });

  const totalDays = new Date(year, month, 0).getDate();

  let firstDay = new Date(year, month - 1, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    calendarDays.push(day);
  }

  // Updated attendance colors
  const getStatusColor = status => {
    switch (status) {
      case 'FULL_DAY':
        return '#22C55E';

      case 'HALF_DAY':
        return '#FACC15';

      case 'ONE_THIRD_DAY':
        return '#EC4899';

      case 'ABSENT':
        return '#EF4444';

      case 'HOLIDAY':
        return '#3B82F6';

      case 'LEAVE':
        return '#701680';

      case 'IN_PROGRESS':
        return '#13ACBE';

      case 'NO_SHIFT_ASSIGNED':
        return '#9CA3AF';

      default:
        return '#FFFFFF';
    }
  };
  const handleDatePress = day => {
    if (!day) return;

    const formattedDate = `${year}-${String(month).padStart(
      2,
      '0',
    )}-${String(day).padStart(2, '0')}`;

    navigation.navigate('AttendanceDetailsScreen', {
      date: formattedDate,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={onPreviousMonth}
          style={styles.arrowButton}>
          <Ionicons
            name="chevron-back"
            size={22}
            color="#1F3365"
          />
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {MONTHS[month - 1]} {year}
        </Text>

        <TouchableOpacity
          onPress={onNextMonth}
          style={styles.arrowButton}>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="#1F3365"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="small"
            color="#13ACBE"
          />
        </View>
      ) : (
        <>
          {/* Week Days */}

          <View style={styles.weekRow}>
            {WEEK_DAYS.map(day => (
              <Text
                key={day}
                style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar */}

          <View style={styles.grid}>
            {calendarDays.map((day, index) => {
              if (!day) {
                return (
                  <View
                    key={index}
                    style={styles.dayCell}
                  />
                );
              }

              const dateString = `${year}-${String(month).padStart(
                2,
                '0',
              )}-${String(day).padStart(2, '0')}`;

              const status = statusMap[dateString];

              const today = new Date();

              const isToday =
                today.getFullYear() === year &&
                today.getMonth() + 1 === month &&
                today.getDate() === day;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dayCell}
                  activeOpacity={0.8}
                  onPress={() => handleDatePress(day)}>
                  <View
                    style={[
                      styles.circle,
                      {
                        backgroundColor: getStatusColor(status),
                        borderColor: status
                          ? getStatusColor(status)
                          : '#D1D5DB',
                        borderWidth: 1,
                      },
                      isToday && styles.todayCircle,
                    ]}>
                    <Text
                      style={[
                        styles.dayNumber,
                        {
                          color: status ? '#FFFFFF' : '#1F2937',
                        },
                      ]}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#22C55E' }
                ]}
              />
              <Text style={styles.legendText}>Full Day</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#FACC15' },
                ]}
              />
              <Text style={styles.legendText}>Half Day</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#EF4444' },
                ]}
              />
              <Text style={styles.legendText}>Absent</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#3B82F6' },
                ]}
              />
              <Text style={styles.legendText}>Holiday</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#EC4899' }
                ]}
              />
              <Text style={styles.legendText}>One Third Day</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#9C27B0' },
                ]}
              />
              <Text style={styles.legendText}>Leave</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#13ACBE' },
                ]}
              />
              <Text style={styles.legendText}>In Progress</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#9CA3AF' },
                ]}
              />
              <Text style={styles.legendText}>No Shift Assigned</Text>
            </View>
          </View>

        </>
      )}
    </View>
  );
};

export default CalendarCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,

    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4F6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  monthText: {
    fontSize: responsiveFontSize(2.2),
    fontWeight: '700',
    color: '#1F3365',
  },

  loaderContainer: {
    height: responsiveHeight(28),
    justifyContent: 'center',
    alignItems: 'center',
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: responsiveFontSize(1.7),
    fontWeight: '700',
    color: '#666',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Updated circle
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Highlight today's date
  todayCircle: {
    borderWidth: 3,
    borderColor: '#13ACBE',

    shadowColor: '#13ACBE',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 6,
  },

  dayNumber: {
    fontWeight: '700',
    fontSize: responsiveFontSize(1.8),
  },

  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },

  legendText: {
    fontSize: responsiveFontSize(1.6),
    color: '#555',
    fontWeight: '500',
  },
});