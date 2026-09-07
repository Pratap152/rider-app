import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  responsiveWidth as rw,
  responsiveHeight as rh,
  responsiveFontSize as rf,
} from 'react-native-responsive-dimensions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../services/ApiClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSlotHistory } from '../../services/profile/profileApiService';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const PAGE_SIZE = 10;

/* STATUS CONFIG OUTSIDE COMPONENT  */
const STATUS_CONFIG = {
  COMPLETED: {
    label: 'Completed',
    bgColor: '#DCFCE7',
    textColor: '#008236',
    icon: 'checkmark-circle',
  },

  ACTIVE: {
    label: 'Active',
    bgColor: '#DBEAFE',
    textColor: '#1447E6',
    icon: 'time-outline',
  },

  CANCELLED: {
    label: 'Cancelled',
    bgColor: '#FFE2E2',
    textColor: '#C10007',
    icon: 'close-circle',
  },

  CANCELED: {
    label: 'Cancelled',
    bgColor: '#FFE2E2',
    textColor: '#C10007',
    icon: 'close-circle',
  },

  MISSED: {
    label: 'Missed',
    bgColor: '#FFEDD4',
    textColor: '#CA3500',
    icon: 'alert-circle',
  },

  UPCOMING: {
    label: 'Upcoming',
    bgColor: '#E0E7FF',
    textColor: '#3730A3',
    icon: 'time-outline',
  },
};
const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};


const SlotHistory = ({ navigation }) => {
  const [slots, setSlots] = useState([]);
  const [summary, setSummary] = useState({
    totalSlots: 0,
    completedSlotsCount: 0,
    totalEarnings: 0,
  });

  const [riderType, setRiderType] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [initialRendered, setInitialRendered] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* NEW STATES */
  const [filterLoading, setFilterLoading] = useState(false);
  const requestIdRef = useRef(0);

  const isFetchingRef = useRef(false);


  /*  FETCH */
  const fetchSlotHistory = useCallback(
    async (filterType, pageNo = 1, isRefresh = false) => {
      if (isFetchingRef.current) return;

      if (!hasMore && pageNo !== 1) return;

      const reqId = ++requestIdRef.current;

      isFetchingRef.current = true;

      try {
        if (pageNo === 1) {
          setFilterLoading(true);
        }

        if (pageNo === 1) {
          setListLoading(true);

          // Clear previous filter data immediately.
          setSlots([]);

          setSummary({
            totalSlots: 0,
            completedSlotsCount: 0,
            totalEarnings: 0,
          });
        }

        const now = new Date();

        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const date = [
          year,
          String(month).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('-');

              const params = {
          page: pageNo,
          limit: PAGE_SIZE,
        };

        if (filterType === 'daily') {
          params.filter = 'daily';
          params.date = date;
        } 

       else if (filterType === 'weekly') {
          params.filter = 'weekly';
        }

        else if (filterType === 'monthly') {
          params.filter = 'monthly';
          params.month = month;
          params.year = year;
        } 

        else if (filterType === 'all') {
          params.filter = 'all';
        }

        const res = await getSlotHistory(params);

        // Ignore old request response
        if (reqId !== requestIdRef.current) {
          return;
        }

        if (!res?.data?.success) {
          throw new Error(
            res?.data?.message ||
            'Unable to fetch slot history'
          );
        }

        const responseData = res.data;
      

        /*
         * RIDER TYPE
         *
         * API response:
         * riderType: "ZESTBOT_EMPLOYEE"
         */
        setRiderType(
          responseData?.riderType || null
        );

        const newData = Array.isArray(
          responseData?.data
        )
          ? responseData.data
          : [];

        /*
         * For page 1, use ONLY the current API response.
         * Do not merge old filter data.
         */
        setSlots(prev => {
          const merged =
            pageNo === 1
              ? newData
              : [...prev, ...newData];

          const unique = Object.values(
            merged.reduce((acc, item) => {
              if (item?.slotBookingId) {
                acc[item.slotBookingId] = item;
              }

              return acc;
            }, {})
          );

          return unique;
        });

        /*
         * SUMMARY FROM API
         */
        setSummary({
          totalSlots: Number(
            responseData?.totalSlots ?? 0
          ),

          completedSlotsCount: Number(
            responseData?.completedSlotsCount ?? 0
          ),

          totalEarnings: Number(
            responseData?.totalEarnings ?? 0
          ),
        });

        setHasMore(
          newData.length === PAGE_SIZE
        );

        setPage(pageNo);

        setInitialRendered(true);

      } catch (error) {
        if (reqId === requestIdRef.current) {
          console.log(
            '[SlotHistory] Error:',
            error?.response?.data ||
            error?.message
          );

          Alert.alert(
            'Error',
            error?.response?.data?.message ||
            error?.message ||
            'Unable to fetch slot history'
          );

          setSlots([]);
        }
      } finally {
        if (reqId === requestIdRef.current) {
          setFilterLoading(false);
          setListLoading(false);
          setRefreshing(false);
        }

        isFetchingRef.current = false;
      }
    },
    [hasMore]
  );
  useEffect(() => {
    setPage(1);
    setHasMore(true);

    fetchSlotHistory(
      activeFilter,
      1,
      false
    );
  }, [activeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchSlotHistory(activeFilter, 1, true);
  };

  /*  GROUPING */

  const groupedSlots = useMemo(() => {
    return slots.reduce((acc, slot) => {
      const dateKey = slot.date
        ? slot.date.split('T')[0]
        : slot.slotDate?.split('T')[0];

      if (!dateKey) return acc;

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    }, {});
  }, [slots]);

 const sortedDates = useMemo(() => {
  const dates = Object.keys(groupedSlots);

  if (activeFilter === 'weekly') {
    return dates.sort(
      (a, b) =>
        new Date(`${a}T00:00:00`) -
        new Date(`${b}T00:00:00`)
    );
  }

  const today = getLocalDate();

  return dates.sort((a, b) => {
    if (a === today) return -1;
    if (b === today) return 1;

    const dateA = new Date(`${a}T00:00:00`);
    const dateB = new Date(`${b}T00:00:00`);
    const todayDate = new Date(`${today}T00:00:00`);

    const aIsFuture = dateA > todayDate;
    const bIsFuture = dateB > todayDate;

    if (aIsFuture && bIsFuture) {
      return dateA - dateB;
    }

    if (aIsFuture && !bIsFuture) {
      return -1;
    }

    if (!aIsFuture && bIsFuture) {
      return 1;
    }

    return dateB - dateA;
  });
}, [groupedSlots, activeFilter]);

  const flatData = useMemo(() => {
    if (!sortedDates.length) return [];
    return sortedDates.flatMap(date => [
      { type: 'header', id: `h-${date}`, date },
      ...groupedSlots[date].map(slot => ({
        ...slot,
        id: String(slot.slotBookingId),
        type: 'slot',
      })),
    ]);
  }, [sortedDates, groupedSlots]);

  /*  HELPERS  */
  const formatDateMMDDYYYY = date => {
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const isToday = date => {
    const t = new Date();
    const d = new Date(date);
    return (
      t.getDate() === d.getDate() &&
      t.getMonth() === d.getMonth() &&
      t.getFullYear() === d.getFullYear()
    );
  };

  const isYesterday = date => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const d = new Date(date);
    return (
      y.getDate() === d.getDate() &&
      y.getMonth() === d.getMonth() &&
      y.getFullYear() === d.getFullYear()
    );
  };

 const getLeftLabel = date => {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
  });
};

  /*  RENDER  */
  const renderItem = useCallback(({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dateRow}>
          <Text style={styles.todayText}>{getLeftLabel(item.date)}</Text>
          <Text style={styles.dateHeaderRight}>
            {formatDateMMDDYYYY(item.date)}
          </Text>
        </View>
      );
    }

    const statusKey = String(
      item?.slotStatus || item?.bookingStatus || ''
    ).toUpperCase();

    const status =
      STATUS_CONFIG[statusKey] || {
        label: item?.slotStatus || 'Unknown',
        bgColor: '#E5E7EB',
        textColor: '#374151',
        icon: 'help-circle-outline',
      };

    return (
      <View style={styles.slotCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.timeText}>
            {item.startTime} - {item.endTime}
          </Text>

          <View
            style={[styles.statusBadge, { backgroundColor: status.bgColor }]}
          >
            <Ionicons
              name={status.icon}
              size={isTablet ? 24 : rf(1.6)}
              color={status.textColor}
              style={{ marginRight: rw(1) }}
            />
            <Text style={[styles.statusText, { color: status.textColor }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={[styles.rowBetween, { marginTop: rh(0.6) }]}>
          <Text style={styles.subText}>Orders: {item.totalOrders}</Text>
          <Text style={styles.earningText}>Earnings: ₹{item.slotEarnings}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rf(2.6)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Slot History</Text>
        <TouchableOpacity
          style={styles.rightIconWrapper}
          onPress={() => navigation.navigate('HelpCenterList')}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={isTablet ? 34 : 24}
            color="#192A51"
          />
        </TouchableOpacity>
      </View>

      {/* FILTER + SUMMARY */}
      <View style={{ padding: rw(4) }}>
        <View style={styles.filterRow}>
          {[
            { label: 'All', value: 'all' },
            { label: 'Today', value: 'daily' },
            { label: 'Week', value: 'weekly' },
            { label: 'Month', value: 'monthly' },
          ].map(item => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterTab,
                activeFilter === item.value && styles.activeFilterTab,
              ]}
              onPress={() => {
                if (activeFilter === item.value) {
                  return;
                }

                // Cancel/ignore previous request
                requestIdRef.current += 1;

                // Allow the new request
                isFetchingRef.current = false;

                // Clear previous filter data immediately
                setSlots([]);

                setPage(1);
                setHasMore(true);
                setInitialRendered(false);

                setSummary({
                  totalSlots: 0,
                  completedSlotsCount: 0,
                  totalEarnings: 0,
                });

                setActiveFilter(item.value);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item.value && styles.activeFilterText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, styles.green]}>
            <Ionicons
              name="calendar-outline"
              size={isTablet ? 34 : 28}
              color="#22C55E"
              style={styles.summaryIcon}
            />
            <Text style={styles.summaryValue}>
              {summary.completedSlotsCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Slots Completed
            </Text>
          </View>

          <View style={[styles.summaryBox, styles.orange]}>
            <Ionicons
              name="wallet-outline"
              size={isTablet ? 34 : 28}
              color="#F97316"
              style={styles.summaryIcon}
            />
            <Text style={styles.summaryValue}>₹{summary.totalEarnings}</Text>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={flatData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: rw(4) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          if (hasMore && !listLoading) {
            fetchSlotHistory(activeFilter, page + 1);
          }
        }}
        onEndReachedThreshold={0.3}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          initialRendered && (
            <Text
              style={{ textAlign: 'center', marginTop: rh(4), color: '#777' }}
            >
              No slots found
            </Text>
          )
        }
      />

      {/*  FILTER LOADER OVERLAY */}
      {filterLoading && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(255,255,255,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default SlotHistory;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },

  header: {
    height: rh(8),
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rw(4),
    elevation: 2,
  },

  headerTitle: { fontSize: rf(2.3), fontWeight: '600' },

  robotIcon: {
    width: rw(12),
    height: rw(11),
    resizeMode: 'contain',
  },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: 20,
    padding: 4,
    marginBottom: rh(2),
  },

  filterTab: {
    flex: 1,
    paddingVertical: rh(0.8),
    borderRadius: 16,
    alignItems: 'center',
  },

  activeFilterTab: { backgroundColor: '#3558AA' },

  filterText: {
    fontSize: rf(1.6),
    color: '#444',
    fontWeight: '500',
  },

  activeFilterText: { color: '#fff', fontWeight: '600' },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rh(2),
  },

  summaryBox: {
    width: '48%',
    borderRadius: 10,
    padding: rw(4),
  },

  green: { backgroundColor: '#DDF5E5', },
  orange: { backgroundColor: '#F7EAE5', },

  summaryIcon: { resizeMode: 'contain' },

  summaryValue: {
    color: '#090b09',
    fontSize: rf(2.6),
    fontWeight: 'bold',
    marginTop: rh(0.5),
  },

  summaryLabel: {
    color: '#090b09',
    marginTop: rh(0.5),
    fontSize: rf(1.6),
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: rh(1),
  },

  todayText: {
    fontSize: rf(1.8),
    fontWeight: '600',
    color: '#3558AA',
  },

  dateHeaderRight: {
    fontSize: rf(1.6),
    color: '#555',
    fontWeight: '500',
  },

  slotCard: {
    backgroundColor: '#fff',
    padding: rw(4),
    borderRadius: 8,
    marginBottom: rh(1),
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  timeText: { fontSize: rf(1.8), fontWeight: '600' },

  subText: { fontSize: rf(1.6), color: '#555' },

  earningText: {
    fontSize: rf(1.6),
    color: '#4A5565',
    fontWeight: '600',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? rw(3.2) : rw(2.5),
    paddingVertical: isTablet ? rh(0.7) : rh(0.4),
    borderRadius: 14,
  },

  statusText: { fontSize: rf(1.4), fontWeight: '600' },
});
