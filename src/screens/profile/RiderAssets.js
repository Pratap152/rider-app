import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  responsiveWidth as rw,
  responsiveHeight as rh,
  responsiveFontSize as rf,
} from 'react-native-responsive-dimensions';
import {getRiderAssets} from '../../services/profile/profileApiService';

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

const RiderAssets = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [assetsData, setAssetsData] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [emptyMessage, setEmptyMessage] = useState('');
  const [showPendingMessage, setShowPendingMessage] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await getRiderAssets();
      const body = res?.data || {};
      const items = body?.data || [];

      const isStillPending =
        Boolean(body?.hasRequestedKit) &&
        items.length > 0 &&
        items.every(item => item?.status !== 'COMPLETED');

      setAssetsData(items);
      setTotalAssets(
        body?.totalItems ?? body?.totalAssets ?? items.length,
      );
      setShowPendingMessage(isStillPending);
      setEmptyMessage(
        isStillPending
          ? 'Kit Requested Successfully'
          : body?.message || '',
      );
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 404 && message === 'No assets issued to this rider') {
        setAssetsData([]);
        setTotalAssets(0);
        setShowPendingMessage(false);
        setEmptyMessage(message);
      } else {
        console.log('Assets error', err?.response || err);
        setAssetsData([]);
        setTotalAssets(0);
        setShowPendingMessage(false);
        setEmptyMessage(message || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromRiderAssets = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('ProfileScreen');
  };

  const getStatusInfo = status => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return {
          label: 'Pending',
          badgeStyle: styles.pendingBadge,
          textStyle: styles.pendingText,
        };

      case 'APPROVED':
        return {
          label: 'Approved',
          badgeStyle: styles.approvedBadge,
          textStyle: styles.approvedText,
        };

      case 'PROCESSING':
        return {
          label: 'Processing',
          badgeStyle: styles.processingBadge,
          textStyle: styles.processingText,
        };

      case 'OUT_FOR_DELIVERY':
        return {
          label: 'Delivering Soon',
          badgeStyle: styles.deliveringBadge,
          textStyle: styles.deliveringText,
        };
       case 'DISPATCHED':
        return {
          label: 'Shipped',
          badgeStyle: styles.dispatchedBadge,
          textStyle: styles.dispatchedText,
        };

        case 'COMPLETED':
          return {
            label: 'Delivered',
            badgeStyle: styles.completedBadge,
            textStyle: styles.completedText,
          };

      case 'DELIVERED':
        return {
          label: 'Delivered',
          badgeStyle: styles.deliveredBadge,
          textStyle: styles.deliveredText,
        };

      case 'REJECTED':
        return {
          label: 'Rejected',
          badgeStyle: styles.rejectedBadge,
          textStyle: styles.rejectedText,
        };

      case 'CANCELLED':
        return {
          label: 'Cancelled',
          badgeStyle: styles.cancelledBadge,
          textStyle: styles.cancelledText,
        };

      default:
        return {
          label: status || 'Pending',
          badgeStyle: styles.pendingBadge,
          textStyle: styles.pendingText,
        };
    }
  };

  const formatAssetName = type => {
    if (!type) {
      return '';
    }

    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, letter => letter.toUpperCase());
  };

  const formatDateTime = dateTime => {
  if (!dateTime) {
    return '';
  }

  try {
    const [datePart, timePart] = dateTime.split(', ');

    if (!datePart || !timePart) {
      return dateTime;
    }

    const [day, month, year] = datePart.split('/');
    const [hours, minutes, secondsWithMs] = timePart.split(':');

    let hour = Number(hours);

    if (Number.isNaN(hour)) {
      return dateTime;
    }

    const period = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12 || 12;

    const seconds = secondsWithMs?.split('.')[0] || '00';

    return `${day}/${month}/${year}, ${String(hour).padStart(
      2,
      '0',
    )}:${minutes}:${seconds} ${period}`;
  } catch (error) {
    return dateTime;
  }
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#192A51" />
      </View>
    );
  }

  const isEmpty =
    showPendingMessage || !assetsData || assetsData.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackFromRiderAssets}>
          <Ionicons
            name="arrow-back"
            size={rf(2.6)}
            color="#101828"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Rider Assets</Text>

        <TouchableOpacity
          style={styles.rightIconWrapper}
          onPress={() => navigation.navigate('HelpCenterList')}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={isTablet ? 34 : 24}
            color="#192A51"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          isEmpty
            ? {flexGrow: 1}
            : {paddingBottom: rh(4)}
        }>
        {isEmpty ? (
          <View style={styles.emptyWrapper}>
            <View style={styles.illustrationBox}>
              <Ionicons
                name="cube-outline"
                size={rf(9)}
                color="#192A51"
              />
            </View>

            <Text style={styles.emptyTitle}>
              {emptyMessage}
            </Text>

            {showPendingMessage ? (
              <>
                <Text style={styles.kitIncludesTitle}>
                  Kit Includes
                </Text>

                <View style={styles.kitItemsBox}>
                  {assetsData.map((item, index) => {
                  const statusInfo = getStatusInfo(item?.status);

                  return (
                    <View
                      key={item?.id ?? `kit-${index}`}
                      style={styles.kitItem}>
                      <View style={styles.kitItemLeft}>
                        <Ionicons
                          name="checkmark-circle"
                          size={rf(2)}
                          color="#12B76A"
                        />

                        <Text style={styles.kitItemText}>
                          {formatAssetName(item?.assetType)}
                          {item?.quantity > 1 ? ` × ${item.quantity}` : ''}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          statusInfo.badgeStyle,
                        ]}>
                        <Text
                          style={[
                            styles.statusText,
                            statusInfo.textStyle,
                          ]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                </View>

                <Text style={styles.deliveringText}>
                  Delivering soon...
                </Text>
              </>
            ) : (
              <TouchableOpacity
                style={styles.requestKitButton}
                onPress={() =>
                  navigation.navigate('KitSelectionScreen', {
                    source: 'riderAssets',
                  })
                }>
                <Text style={styles.requestKitButtonText}>
                  Request Kit
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                Assets Summary
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryValue}>
                    {totalAssets}
                  </Text>

                  <Text style={styles.summaryLabel}>
                    Total Assets
                  </Text>
                </View>
              </View>
            </View>

            {assetsData.map((item, index) => {
              const statusInfo = getStatusInfo(item?.status);

              return (
                <View
                  key={item?.id ?? `asset-${index}`}
                  style={styles.assetCard}>
                  <View style={styles.assetIcon}>
                    <Ionicons
                      name="cube-outline"
                      size={rf(2.6)}
                      color="#12B76A"
                    />
                  </View>

                  <View style={styles.assetContent}>
                    <View style={styles.topRow}>
                      <Text style={styles.assetName}>
                        {formatAssetName(item?.assetType)}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          statusInfo.badgeStyle,
                        ]}>
                        <Text
                          style={[
                            styles.statusText,
                            statusInfo.textStyle,
                          ]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Quantity:</Text>
                      <Text style={styles.value}>
                        {item?.quantity}
                      </Text>
                    </View>

                    {/* STATUS */}
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Status:</Text>
                    <Text
                      style={[
                        styles.value,
                        statusInfo.textStyle,
                      ]}>
                      {statusInfo.label}
                    </Text>
                  </View>

                  {/* REQUESTED DATE & TIME */}
                  {item?.createdAt ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Requested:</Text>
                      <Text style={styles.value}>
                        {formatDateTime(item.createdAt)}
                      </Text>
                    </View>
                  ) : null}
                  </View>
                </View>
              );
            })}

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>
                Request Replacement
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RiderAssets;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: rf(2.3),
    fontWeight: '700',
    color: '#101828',
  },

  rightIconWrapper: {
    width: rw(7),
    alignItems: 'center',
  },

  /* REQUESTED KIT */

  emptyWrapper: {
    flex: 1,
    paddingHorizontal: rw(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rh(-6),
  },

  illustrationBox: {
    width: rw(32),
    height: rw(32),
    borderRadius: rw(16),
    backgroundColor: '#E8F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rh(3),
  },

  emptyTitle: {
    fontSize: rf(2.2),
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
    lineHeight: rh(3.4),
  },

  kitIncludesTitle: {
    fontSize: rf(1.9),
    fontWeight: '700',
    color: '#101828',
    marginTop: rh(2.5),
    marginBottom: rh(1),
  },

  kitItemsBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: rw(3),
    paddingHorizontal: rw(4),
    paddingVertical: rh(0.8),
    elevation: 1,
  },

  kitItem: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: rh(1.2),
  borderBottomWidth: 1,
  borderBottomColor: '#F2F4F7',
},

kitItemLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},

kitItemText: {
  marginLeft: rw(2),
  fontSize: rf(1.7),
  color: '#101828',
  fontWeight: '500',
},

statusBadge: {
  paddingHorizontal: rw(2.5),
  paddingVertical: rh(0.5),
  borderRadius: rw(5),
  marginLeft: rw(2),
},

  statusLabel: {
    fontSize: rf(1.7),
    color: '#667085',
    fontWeight: '500',
    marginRight: rw(2),
  },



  statusText: {
    fontSize: rf(1.3),
    fontWeight: '600',
  },

  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },

  pendingText: {
    color: '#B45309',
  },

  approvedBadge: {
    backgroundColor: '#E0F2FE',
  },

  approvedText: {
    color: '#0369A1',
  },

  processingBadge: {
    backgroundColor: '#EDE9FE',
  },

  processingText: {
    color: '#6D28D9',
  },

  deliveringBadge: {
    backgroundColor: '#DBEAFE',
  },

  deliveringText: {
    color: '#2563EB',
  },

  deliveredBadge: {
    backgroundColor: '#ECFDF3',
  },

  deliveredText: {
    color: '#027A48',
  },

  completedBadge: {
    backgroundColor: '#ECFDF3',
  },

  completedText: {
    color: '#12B76A',
  },

  rejectedBadge: {
    backgroundColor: '#FEF3F2',
  },

  rejectedText: {
    color: '#D92D20',
  },

  cancelledBadge: {
    backgroundColor: '#F2F4F7',
  },

  cancelledText: {
    color: '#667085',
  },

  deliveringText: {
    marginTop: rh(1.5),
    fontSize: rf(1.6),
    color: '#2563EB',
    fontWeight: '600',
  },

  requestKitButton: {
    backgroundColor: '#192A51',
    marginTop: rh(3),
    paddingHorizontal: rw(8),
    paddingVertical: rh(1.8),
    borderRadius: rw(3),
    alignItems: 'center',
  },

  requestKitButtonText: {
    color: '#FFFFFF',
    fontSize: rf(1.8),
    fontWeight: '600',
  },

  /* SUMMARY */

  summaryCard: {
    backgroundColor: '#192A51',
    marginHorizontal: rw(4),
    marginTop: rh(2),
    borderRadius: rw(4),
    padding: rw(4),
  },

  summaryTitle: {
    color: '#FFFFFF',
    fontSize: rf(1.8),
    fontWeight: '600',
    marginBottom: rh(1.5),
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  summaryBox: {
    backgroundColor: '#FFFFFF',
    width: '55%',
    borderRadius: rw(3),
    paddingVertical: rh(1.8),
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: rf(2.6),
    fontWeight: '700',
    color: '#101828',
  },

  summaryLabel: {
    fontSize: rf(1.5),
    color: '#667085',
    marginTop: rh(0.4),
  },

  /* ASSET CARD */

  assetCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: rw(4),
    marginTop: rh(1.8),
    borderRadius: rw(4),
    padding: rw(4),
    flexDirection: 'row',
    elevation: 2,
  },

  assetIcon: {
    width: rw(13),
    height: rw(13),
    borderRadius: rw(3),
    backgroundColor: '#ECFDF3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rw(3),
  },

  assetContent: {
    flex: 1,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rh(1),
  },

  assetName: {
    flex: 1,
    fontSize: rf(1.9),
    fontWeight: '700',
    color: '#101828',
    marginRight: rw(2),
  },

  detailRow: {
    flexDirection: 'row',
    marginTop: rh(0.5),
  },

  label: {
    fontSize: rf(1.6),
    color: '#667085',
    fontWeight: '500',
    marginRight: rw(1),
  },

  value: {
    flex: 1,
    fontSize: rf(1.6),
    color: '#101828',
    fontWeight: '500',
  },

  /* BUTTON */

  button: {
    backgroundColor: '#192A51',
    marginHorizontal: rw(6),
    marginTop: rh(3),
    paddingVertical: rh(1.8),
    borderRadius: rw(3),
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: rf(1.8),
    fontWeight: '600',
  },
  dispatchedBadge: {
  backgroundColor: '#DBEAFE',
},

dispatchedText: {
  color: '#2563EB',
},
});