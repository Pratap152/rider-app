import { useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/ApiClient';

const PAGE_SIZE = 10;
const getCacheKey = filter => `ORDER_HISTORY_${filter}`;
const API_FILTER_MAP = {
  all: 'all',
  today: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
};

let memoryCache = {};

export const useOrderHistory = (filter) => {
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);
  const isFetching = useRef(false);

  const [orders, setOrders] = useState([]);
  
  // RESTORED TARGET FIELDS IN SUMMARY STATE
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalEarnings: 0,
    rating: 0,
    km: 0,
    riderType: null,
    targetOrders: null,
    completedOrders: 0,
    targetCompleted: false,
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const cancelRequest = () => abortRef.current?.abort();

  useEffect(() => {
    const loadCache = async () => {
      if (memoryCache[filter]) {
        setOrders(memoryCache[filter].orders);
        setSummary(memoryCache[filter].summary);
        return;
      }
      try {
        const cached = await AsyncStorage.getItem(getCacheKey(filter));
        if (cached) {
          const parsed = JSON.parse(cached);
          memoryCache[filter] = parsed;
          setOrders(parsed.orders || []);
          setSummary(parsed.summary);
        }
      } catch { }
    };
    loadCache();
  }, [filter]);

  const fetchOrders = useCallback(async (
    pageNo = 1,
    { refresh = false, activeFilter = filter } = {}
  ) => {
    if (isFetching.current) return;
    if (!hasMore && pageNo !== 1) return;

    cancelRequest();
    const controller = new AbortController();
    abortRef.current = controller;
    isFetching.current = true;
    const reqId = ++requestIdRef.current;

    try {
      if (refresh) setRefreshing(true);
      else if (pageNo === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await apiClient.get('/api/rider/profile/orders/history', {
        signal: controller.signal,
        params: {
          filter: API_FILTER_MAP[activeFilter],
          page: pageNo,
          limit: PAGE_SIZE,
        },
      });

      if (!mountedRef.current) return;
      if (reqId !== requestIdRef.current) return;
      if (!res?.data?.success) return;

      const list = res.data.data || [];
const riderType = res.data.riderType;

const mapped = list.map((item, i) => {
  const isZestbot = riderType === 'ZESTBOT_EMPLOYEE';

  // Individual uses deliveredAt
  // Zestbot uses time
  const dateStr = isZestbot
    ? item.time
    : item.deliveredAt;

  return {
    id: `${item.orderId}-${pageNo}-${i}`,

    orderId: item.orderId,

    // Individual: vendorShopName
    // Zestbot: store
    vendorShopName: isZestbot
      ? item.store ?? ''
      : item.vendorShopName ?? '',

    // Zestbot does not return userName
    userName: item.userName ?? '',

    // Individual: deliveredAddress
    // Zestbot: not available
    deliveredAddress: item.deliveredAddress ?? '',

    // Individual: pricing.riderEarning
    // Zestbot: totalEarnings
    earning: isZestbot
      ? Number(item.totalEarnings ?? 0)
      : Number(item.pricing?.riderEarning ?? 0),

    // Individual: earningBreakup.credited
    // Zestbot: transaction.status
    credited: isZestbot
      ? item.transaction?.status === 'CREDITED' ||
        item.transaction?.status === 'COMPLETED'
      : Boolean(item.pricing?.earningBreakup?.credited),

    // Individual: earningBreakup.tips
    // Zestbot: transaction.tips
    tip: isZestbot
      ? Number(item.transaction?.tips ?? 0)
      : Number(item.pricing?.earningBreakup?.tips ?? 0),

    // Individual currently has no incentive field
    // Zestbot: transaction.incentive
    incentive: isZestbot
      ? Number(item.transaction?.incentive ?? 0)
      : 0,

    // Same field for both
    distance: Number(item.distanceTravelled ?? 0),

    // Same field for both
    rating: Number(item.rating ?? 0),

    // Format date
    date: dateStr
      ? new Date(dateStr).toLocaleDateString('en-GB')
      : '',

    // Format time
    time: dateStr
      ? new Date(dateStr).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',

    // Preserve complete backend object
    rawData: item,

    // IMPORTANT: use top-level riderType
    riderType: riderType,
  };
});

      // ✅ RESTORED TARGET DATA MAPPING
      const summaryData = {
  totalOrders: Number(res.data.totalOrders ?? 0),

  // IMPORTANT: backend field is totalEarnings
  totalEarnings: Number(res.data.totalEarnings ?? 0),

  rating: Number(res.data.avgRating ?? 0),

  // Keep decimal value from backend
  km: Number(res.data.totalDistance ?? 0),

  riderType: res.data.riderType ?? null,

  targetOrders: res.data.targetOrders ?? null,

  completedOrders: Number(res.data.completedOrders ?? 0),

  targetCompleted: Boolean(res.data.targetCompleted),
};

      setOrders(prev => {
        const combined = pageNo === 1 ? mapped : [...prev, ...mapped];
        const unique = Array.from(new Map(combined.map(o => [o.orderId, o])).values());
        
        const payload = {
          orders: unique,
          summary: summaryData,
        };
        
        memoryCache[activeFilter] = payload;
        AsyncStorage.setItem(getCacheKey(activeFilter), JSON.stringify(payload));
        return unique;
      });

      setSummary(summaryData);
      setHasMore(mapped.length === PAGE_SIZE);
      setPage(pageNo);
    } catch (e) {
      if (e.name !== 'CanceledError') {
        console.warn('Order fetch failed:', e.message);
      }
    } finally {
      if (!mountedRef.current) return;
      isFetching.current = false;
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [filter, hasMore]);

  useEffect(() => {
    cancelRequest();
    setPage(1);
    setHasMore(true);
    fetchOrders(1, { activeFilter: filter });
  }, [filter]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchOrders(page + 1);
    }
  };

  const onRefresh = () => {
    cancelRequest();
    fetchOrders(1, { refresh: true });
  };

  return {
    orders,
    summary,
    loading,
    loadingMore,
    refreshing,
    loadMore,
    onRefresh,
  };
};