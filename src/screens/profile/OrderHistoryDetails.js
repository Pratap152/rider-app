import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  responsiveWidth as rw,
  responsiveHeight as rh,
  responsiveFontSize as rf,
} from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const OrderHistoryDetails = ({ navigation, route }) => {
  const { order } = route.params;
  
  // Determine Rider Type
  const isZestbot = order?.riderType === 'ZESTBOT_EMPLOYEE';
  
  // Map fields based on Rider Type
  const vendorName = isZestbot ? order?.store : order?.vendorShopName;
  const userName = order?.userName;
  const deliveredAddress = order?.deliveredAddress;
  const dateStr = isZestbot ? order?.time : order?.deliveredAt;
  
  const deliveredDate = new Date(dateStr);
  const date = deliveredDate.toLocaleDateString();
  const time = deliveredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Earnings Logic
  // Earnings Logic
const tip = isZestbot
  ? Number(order?.transaction?.tips ?? 0)
  : Number(order?.pricing?.earningBreakup?.tips ?? 0);

const incentive = isZestbot
  ? Number(order?.transaction?.incentive ?? 0)
  : 0;

// Individual: pricing.riderEarning
// Zestbot: totalEarnings
const totalEarning = isZestbot
  ? Number(order?.totalEarnings ?? 0)
  : Number(order?.pricing?.riderEarning ?? 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rf(2.6)} color="#111827" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Order History</Text>
          <Text style={styles.orderIdText}>Order ID : #{order?.orderId}</Text>
        </View>
        <TouchableOpacity
          style={styles.rightIconWrapper}
          onPress={() => navigation.navigate('HelpCenterList')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={isTablet ? 34 : 24} color="#294484" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: rw(4), paddingBottom: rh(3) }}
      >
        {/* Order Summary Card */}
        <View style={styles.orderCard}>
          <View style={styles.topRow}>
            <View style={styles.avatar} />
            <View style={styles.detailsContainer}>
              <Text style={styles.restaurantName}>{vendorName}</Text>
              {!isZestbot && userName ? <Text style={styles.customerName}>{userName}</Text> : null}
              {!isZestbot && deliveredAddress ? <Text style={styles.addressText}>{deliveredAddress}</Text> : null}
            </View>
            <View style={styles.amountContainer}>
              {/* Total earning shows as 0 for Zestbot */}
              <Text style={styles.amountText}>₹{totalEarning}</Text>
              {!isZestbot && <Text style={styles.earnedText}>EARNED</Text>}
            </View>
          </View>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={isTablet ? 22 : 15} color="#F59E0B" />
            <Text style={styles.ratingText}>{order?.rating || '0'}</Text>
          </View>
          
          <View style={styles.dateTimeRow}>
            <View style={styles.chip}>
              <Ionicons name="calendar-outline" size={isTablet ? 22 : 14} color="#22C55E" />
              <Text style={styles.chipText}>{date}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={isTablet ? 22 : 14} color='#16A34A' />
              <Text style={styles.chipText}>{time}</Text>
            </View>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <Text style={styles.sectionHeading}>Earnings Breakdown :</Text>
        <View style={styles.card}>
          {isZestbot ? (
  <>
    <InfoRow
      label="Incentive"
      value={`₹${incentive}`}
      valueStyle={{ color: '#8B5CF6' }}
    />

    <InfoRow
      label="Customer Tip"
      value={`₹${tip}`}
      valueStyle={{ color: '#16A34A' }}
    />

    <View style={styles.divider} />

    <InfoRow
      label="Total Earning"
      value={`₹${totalEarning}`}
      valueStyle={{
        color: '#16A34A',
        fontWeight: '700',
        fontSize: rf(2.1),
      }}
    />
  </>
) : (
            <>
              {/* INDIVIDUAL BREAKDOWN */}
              <InfoRow label="Base Fare" value={`₹${order?.pricing?.earningBreakup?.basePay || 0}`} />
              <InfoRow label="Distance Fare" value={`₹${order?.pricing?.earningBreakup?.distancePay || 0}`} />
              <InfoRow label="Surge" value={`₹${order?.pricing?.earningBreakup?.surgePay || 0}`} valueStyle={{ color: '#EF4444' }} />
              <InfoRow label="Customer Tip" value={`₹${tip}`} valueStyle={{ color: '#16A34A' }} />
              <View style={styles.divider} />
              <InfoRow 
                label="Total Earning"
                value={`₹${totalEarning}`} 
                valueStyle={{ color: '#16A34A', fontWeight: '700', fontSize: rf(2.1) }} 
              />
            </>
          )}
        </View>

        {/* Order Information */}
        <Text style={styles.sectionHeading}>Order Information :</Text>
        <View style={styles.card}>
          <InfoRow label="Order ID" value={`#${order?.orderId || 0}`} />
          <InfoRow label="Distance Travelled" value={`${order?.distanceTravelled || 0} km`} />
          <InfoRow
            label="Payment Status"
            value={
  isZestbot
    ? order?.transaction?.status || 'N/A'
    : order?.pricing?.earningBreakup?.credited
      ? 'Credited'
      : 'Not Credited'
}
            valueStyle={{ color: '#16A34A' }}
          />
          <InfoRow label="Order Status" value="Delivered" />
          <InfoRow label="Completed on" value={`${date} ${time}`} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value, valueStyle }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
};

export default OrderHistoryDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rw(4),
    paddingVertical: rh(2),
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },

  headerTitle: {
    fontSize: rf(2.4),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  orderIdText: {
    fontSize: rf(1.55),
    color: '#475569',
    marginTop: 2,
    textAlign: 'center',
  },

  robotIcon: {
    width: rw(6),
    height: rw(6),
    resizeMode: 'contain',
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: rw(4),
    marginTop: rh(1),
    marginBottom: rh(2),
  },

  topRow: {
    flexDirection: 'row',
  },

  avatar: {
  width: isTablet ? 56 : 42,
  height: isTablet ? 56 : 42,
  borderRadius: isTablet ? 28 : 21,
  backgroundColor: '#F4E4DD',
  marginRight: isTablet ? 16 : 12,
},

  detailsContainer: {
    flex: 1,
  },

  restaurantName: {
    fontSize: rf(2.2),
    fontWeight: '600',
    color: '#111827',
  },

  customerName: {
    fontSize: rf(1.7),
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },

  addressText: {
    fontSize: rf(1.7),
    color: '#6B7280',
    marginTop: 2,
  },

  amountContainer: {
    alignItems: 'flex-end',
  },

  amountText: {
    color: '#16A34A',
    fontSize: rf(2.1),
    fontWeight: '700',
  },

  earnedText: {
    color: '#16A34A',
    fontSize: rf(1.25),
    fontWeight: '700',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: rh(0.8),
  },

  ratingText: {
    marginLeft: 4,
    color: '#111827',
    fontWeight: '600',
    fontSize: rf(2.1),
  },

  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rh(1.5),
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '48%',
  },

  chipText: {
    marginLeft: 6,
    fontSize: rf(1.6),
    color: '#111827',
  },

  sectionHeading: {
    fontSize: rf(1.8),
    color: '#374151',
    marginBottom: rh(1),
    marginLeft: 2,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: rw(4),
    marginBottom: rh(2),
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: rh(0.7),
  },

  infoLabel: {
    color: '#6B7280',
    fontSize: rf(1.7),
  },

  infoValue: {
    color: '#111827',
    fontSize: rf(1.7),
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: rh(1),
  },
});