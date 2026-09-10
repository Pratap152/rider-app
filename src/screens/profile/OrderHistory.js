import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  responsiveWidth as rw,
  responsiveHeight as rh,
  responsiveFontSize as rf,
} from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderHistory } from '../../hooks/useOrderHistory';
import EmptyState from '../../components/order/EmptyState';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'weekly' },
  { label: 'Month', value: 'monthly' },
];

const OrderHistory = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('today');
  const [filterLoading, setFilterLoading] = useState(false);

  const {
    orders,
    summary,
    loading,
    loadingMore,
    refreshing,
    loadMore,
    onRefresh,
  } = useOrderHistory(selectedFilter);

  const changeFilter = useCallback(
    value => {
      if (value === selectedFilter) return;
      setFilterLoading(true);
      setSelectedFilter(value);
    },
    [selectedFilter],
  );

  useEffect(() => {
    if (!loading) {
      setFilterLoading(false);
    }
  }, [loading]);

  const renderOrder = ({ item }) => {
    const isZestbot = item.riderType === 'ZESTBOT_EMPLOYEE';
    const hasExtras = item.tip > 0 || item.incentive > 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderHistoryDetails', { order: item.rawData })}
      >
        {/* TOP SECTION */}
        <View style={styles.topRow}>
          <View style={styles.restaurantSection}>
            <View style={styles.restaurantDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.restaurantName}>{item.vendorShopName}</Text>
              <Text style={styles.orderId}>Order ID: {item.orderId}</Text>
            </View>
          </View>
          <View style={styles.earningSection}>
            {/* Removed "Salary" text, just showing the amount (0.00 for Zestbot) */}
            <Text style={styles.earning}>₹{Number(item.earning).toFixed(2)}</Text>
            {!isZestbot && item.credited && <Text style={styles.earnedText}>EARNED</Text>}
          </View>
        </View>

        {/* USER (Hide for Zestbot) */}
        {!isZestbot && item.userName ? (
          <View style={styles.userRow}>
            <Ionicons name="person-outline" size={isTablet ? 24 : 18} color="#00A63E" />
            <Text style={styles.userText}>{item.userName}</Text>
          </View>
        ) : null}

        {/* LOCATION & RATING */}
        <View style={styles.locationRatingRow}>
          {!isZestbot && item.deliveredAddress ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={isTablet ? 24 : 18} color="#00A63E" />
              <Text numberOfLines={1} style={styles.locationText}>{item.deliveredAddress}</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={isTablet ? 22 : 16} color="#F59E0B" />
            <Text style={styles.ratingText}>{Number(item.rating || 0).toFixed(1)}</Text>
          </View>
        </View>

        {/* DATE TIME DISTANCE */}
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={isTablet ? 22 : 16} color="#00A63E" />
            <Text style={styles.infoText}>{item.date}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.dateItem}>
            <Ionicons name="time-outline" size={isTablet ? 22 : 16} color="#00A63E" />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.dateItem}>
            <Ionicons name="navigate-outline" size={isTablet ? 22 : 16} color="#00A63E" />
            <Text style={styles.infoText}>{item.distance}km</Text>
          </View>
        </View>

        {/* INCENTIVE & TIP (Show if > 0) */}
        {hasExtras && (
          <View style={styles.tipContainer}>
            <View style={{ flex: 1 }}>
              {item.incentive > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: item.tip > 0 ? 10 : 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="trophy-outline" size={isTablet ? 24 : 18} color="#8B5CF6" />
                    <Text style={styles.tipLabel}>Incentive</Text>
                  </View>
                  <Text style={[styles.tipValue, { color: '#8B5CF6' }]}>₹{item.incentive}</Text>
                </View>
              )}
              {item.tip > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="gift-outline" size={isTablet ? 24 : 18} color="#3A8D4D" />
                    <Text style={styles.tipLabel}>Customer TIP</Text>
                  </View>
                  <Text style={styles.tipValue}>₹{item.tip}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const EmptyComponent = () => (
    <EmptyState
      icon="receipt-outline"
      title="No Orders Yet"
      message="Your delivery history will appear here once you complete your first order."
      onRetry={onRefresh}
      buttonText="Refresh"
    />
  );

  // ... (Keep all your imports and existing code exactly the same) ...

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rf(2.6)} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <TouchableOpacity
          style={styles.rightIconWrapper}
          onPress={() => navigation.navigate('HelpCenterList')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={isTablet ? 34 : 24} color="#294484" />
        </TouchableOpacity>
      </View>

      {/* FILTERS */}
      <View style={styles.contentContainer}>
        <View style={styles.filterRow}>
          {FILTERS.map(item => (
            <TouchableOpacity
              key={item.value}
              style={[styles.filterChip, selectedFilter === item.value && styles.filterChipActive]}
              onPress={() => changeFilter(item.value)}
            >
              <Text style={[styles.filterText, selectedFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryGrid}>
          <SummaryCard icon="bag-handle-outline" label="Total Orders" value={summary.totalOrders} bgColor="#FF690014" iconColor="#FF6900" />

          {/* TARGET STATUS - ZESTBOT / COMPANY ONLY */}
          {(summary.riderType === 'ZESTBOT_EMPLOYEE' ||
            summary.riderType === 'COMPANY_EMPLOYEE') && (
              <SummaryCard
                icon="trophy-outline"
                label="Target"
                value={summary.targetCompleted ? 'Completed' : 'Not Completed'}
                bgColor="#8B5CF614"
                iconColor="#8B5CF6"
              />
            )}

          {/* TOTAL EARNINGS - INDIVIDUAL ONLY */}
          {summary.riderType !== 'ZESTBOT_EMPLOYEE' &&
            summary.riderType !== 'COMPANY_EMPLOYEE' && (
              <SummaryCard
                icon="wallet-outline"
                label="Total Earnings"
                value={`₹${summary.totalEarnings}`}
                bgColor="#00C95014"
                iconColor="#00C950"
              />
            )}
          <SummaryCard icon="star" label="Average Rating" value={summary.rating} bgColor="#F0B10014" iconColor="#F0B100" />
          <SummaryCard icon="navigate-circle-outline" label="KM Travelled" value={summary.km} bgColor="#2B7FFF14" iconColor="#2B7FFF" />
        </View>

        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={!loading ? EmptyComponent : null}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
        />

        {filterLoading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};


const SummaryCard = ({ icon, label, value, bgColor, iconColor }) => (
  <View style={[styles.summaryCard, { backgroundColor: bgColor }]}>
    <Ionicons name={icon} size={isTablet ? 28 : 18} color={iconColor} />
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

export default OrderHistory;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: rw(4),
    paddingVertical: rh(2),

    backgroundColor: '#FFFFFF',

    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',

    elevation: 2,
  },
  headerTitle: {
    fontSize: rf(2.4),
    fontWeight: '700',
    color: '#111827',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: rw(4),
    paddingTop: rh(1.5),
  },

  filterRow: {
    flexDirection: 'row',
    marginBottom: rh(2),
  },

  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: rw(4),
    paddingVertical: rh(0.8),
    borderRadius: 8,
    marginRight: rw(2),
  },

  filterChipActive: {
    backgroundColor: '#1E3A8A',
  },

  filterText: {
    color: '#6B7280',
    fontSize: rf(1.7),
  },

  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: rh(1.5),
  },

  summaryCard: {
    width: '48%',
    padding: rw(3.5),
    borderRadius: 12,
    marginBottom: rh(1.2),
  },

  summaryValue: {
    fontSize: rf(2.5),
    fontWeight: '700',
    color: '#111827',
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: rf(1.6),
    color: '#6B7280',
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: rw(4),
    marginBottom: rh(1.8),
    shadowColor: '#474141',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eaeef2',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  restaurantSection: {
    flexDirection: 'row',
    flex: 1,
  },

  restaurantDot: {
    width: isTablet ? 56 : 42,
    height: isTablet ? 56 : 42,
    borderRadius: isTablet ? 28 : 21,
    backgroundColor: '#F7EAE5',
    marginRight: isTablet ? 16 : 12,
  },

  restaurantName: {
    fontSize: rf(2.2),
    fontWeight: '700',
    color: '#1F2937',
  },

  orderId: {
    marginTop: 2,
    fontSize: rf(1.55),
    color: '#475569',
  },

  earningSection: {
    alignItems: 'flex-end',
  },

  earning: {
    fontSize: rf(2.1),
    fontWeight: '700',
    color: '#16A34A',
  },

  earnedText: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#DDF5E5',
    color: '#2E8B57',
    fontSize: rf(1.25),
    fontWeight: '700',
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rh(0.8),
  },

  userText: {
    marginLeft: 6,
    color: '#475569',
    fontSize: rf(1.7),
  },

  locationText: {
    marginLeft: 6,
    color: '#475569',
    fontSize: rf(1.7),
    flexShrink: 1,
  },

  bottomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rh(1.3),
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoText: {
    marginLeft: 4,
    color: '#64748B',
    fontSize: rf(1.60),
  },
  tipContainer: {
    marginTop: rh(1),
    paddingTop: rh(1),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  tipLabel: {
    color: '#64748B',
    fontSize: rf(1.7),
  },

  tipValue: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: rf(1.9),
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  robotIcon: {
    width: rw(6),
    height: rw(6),
    resizeMode: 'contain',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 50,
  },

  ratingText: {
    marginLeft: 4,
    fontSize: rf(2.1),
    fontWeight: '600',
    color: '#111827',
  },

  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 16,

    paddingVertical: rh(1),
    paddingHorizontal: rw(2),

    marginTop: rh(1.4),

    backgroundColor: '#FFFFFF',
  },

  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E6E6E6',
  },
  locationRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rh(0.4),
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: rw(2),
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: rw(2),
  },

  ratingText: {
    marginLeft: 4,
    fontSize: rf(1.9),
    fontWeight: '600',
    color: '#111827',
  },
});