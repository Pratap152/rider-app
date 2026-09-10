import React, {
  useMemo,
  useState,
  useEffect,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  BackHandler,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import DateTimePickerModal from "react-native-modal-datetime-picker";

import DeviceInfo from "react-native-device-info";

import {
  responsiveFontSize,
  responsiveWidth,
} from "react-native-responsive-dimensions";

import { formatMoney } from "../../utils/formatMoney";

import useEarningsHistory from "../../hooks/useEarningsHistory";

import SalaryDetails from "./SalaryDetailsScreen";

const isTablet = DeviceInfo.isTablet();

const ZESTBOT = "ZESTBOT_EMPLOYEE";

export default function EarningsHistoryScreen({
  navigation,
  route,
  riderType,
}) {
  const mode =
    route?.params?.mode || "TODAY";

  const {
    view,
    loading,
    initialLoading,
    refreshing,
    error,
    offline,

    weekData,
    dayData,
    orderData,

    selectedYear,
    setSelectedYear,

    selectedWeek,
    setSelectedWeek,

    selectedDay,

    ledgerItems,

    currentRiderType,
    isZestbot,

    currentWeek,
    years,
    weeks,

    loadHistoryWeek,
    loadDay,
    loadTransaction,

    getZestbotAmount,
    getZestbotBreakdown,
    getWeeklyTotal,
    getWeeklyDayAmount,

    refresh,
    back,
    bootstrap,

    weeklyDailyData,

    loadSalary,
    salaryData,
  } = useEarningsHistory({
    navigation,
    mode,
    riderType,
  });

  const [modal, setModal] =
    useState(null);

  const [calendar, setCalendar] =
    useState(false);

  useEffect(() => {
    const onBackPress = () => {
      back();
      return true;
    };

    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

    return () =>
      subscription.remove();
  }, [back]);

  const title = useMemo(() => {
    if (view === "ORDER") {
      return "Order Details";
    }

    if (mode === "TODAY") {
      return "Today's Earnings";
    }

    if (view === "DAY") {
      return "Daily Earnings";
    }

    if (mode === "WEEK") {
      return "Weekly Earnings";
    }

    return "Earnings History";
  }, [mode, view]);

  if (initialLoading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <Header
        title={title}
        offline={offline}
        onBack={back}
      />

      {error ? (
        <ErrorBox
          text={error}
          retry={bootstrap}
        />
      ) : view === "ORDER" ? (
        <OrderDetails
          data={orderData}
          riderType={currentRiderType}
          loading={loading}
        />
      ) : view === "SALARY" ? (
        <SalaryDetails
          data={salaryData}
          onBack={back}
        />
      ) : view === "DAY" ? (
        <DailyScreen
          data={dayData}
          items={ledgerItems}
          isZestbot={isZestbot}
          loading={loading}
          refreshing={refreshing}
          getBreakdown={
            getZestbotBreakdown
          }
          onRefresh={refresh}
          onLoadMore={() =>
            selectedDay &&
            loadDay(
              selectedDay,
              false
            )
          }
          onOrder={loadTransaction}
          onSalary={loadSalary}
        />
      ) : (
        <WeeklyScreen
          data={weekData}
          isZestbot={isZestbot}
          weeklyTotal={getWeeklyTotal()}
          weeklyDailyData={
            weeklyDailyData
          }
          getZestbotAmount={
            getZestbotAmount
          }
          getWeeklyDayAmount={
            getWeeklyDayAmount
          }
          selectedYear={selectedYear}
          selectedWeek={selectedWeek}
          currentWeek={currentWeek}
          mode={mode}
          loading={loading}
          refreshing={refreshing}
          onRefresh={refresh}
          onDay={(date) =>
            loadDay(
              date,
              true,
              true
            )
          }
          onYear={() =>
            setModal("YEAR")
          }
          onWeek={() =>
            setModal("WEEK")
          }
          onDayPicker={() =>
            setCalendar(true)
          }
        />
      )}

      <SimpleModal
        visible={modal === "YEAR"}
        title="Select Year"
        data={years}
        label={(item) =>
          String(item)
        }
        onClose={() =>
          setModal(null)
        }
        onSelect={(year) => {
          setSelectedYear(year);
          setModal(null);

          if (selectedWeek) {
            loadHistoryWeek(
              selectedWeek,
              year,
              true
            );
          }
        }}
      />

      <SimpleModal
        visible={modal === "WEEK"}
        title="Select Week"
        data={weeks}
        label={(item) =>
          `Week ${item.week} (${item.startLabel} - ${item.endLabel})`
        }
        selected={(item) =>
          item.week === selectedWeek
        }
        highlight={(item) =>
          item.week === currentWeek
        }
        onClose={() =>
          setModal(null)
        }
        onSelect={(item) => {
          setSelectedWeek(
            item.week
          );

          setModal(null);

          loadHistoryWeek(
            item.week,
            selectedYear,
            true
          );
        }}
      />

      <DateTimePickerModal
        isVisible={calendar}
        mode="date"
        onConfirm={(date) => {
          setCalendar(false);

          loadDay(
            date
              .toISOString()
              .split("T")[0],
            true,
            true
          );
        }}
        onCancel={() =>
          setCalendar(false)
        }
      />
    </SafeAreaView>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  title,
  offline,
  onBack,
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.back}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color="#111"
        />
      </TouchableOpacity>

      <Text
        style={styles.headerTitle}
      >
        {title}
      </Text>

      {offline && (
        <Text style={styles.offline}>
          Offline
        </Text>
      )}
    </View>
  );
}

/* =========================================================
   WEEKLY SCREEN
========================================================= */

function WeeklyScreen({
  data,
  isZestbot,
  weeklyTotal,

  selectedYear,
  selectedWeek,
  currentWeek,
  mode,

  loading,
  refreshing,

  onRefresh,
  onDay,
  onYear,
  onWeek,
  onDayPicker,

  weeklyDailyData,
  getZestbotAmount,
  getWeeklyDayAmount,
}) {
  if (!data) {
    return <Empty />;
  }

  return (
    <FlatList
      data={data.days || []}
      keyExtractor={(item) =>
        item.date
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#9c50ff"]}
        />
      }
      ListHeaderComponent={
        <>
          {(mode === "HISTORY" ||
            mode === "WEEK") && (
            <View
              style={styles.filters}
            >
              <Filter
                text={`Year: ${selectedYear}`}
                onPress={onYear}
              />

              <Filter
                text={`Week: ${
                  selectedWeek || "-"
                }`}
                onPress={onWeek}
              />

              <Filter
                text="Pick Day"
                onPress={onDayPicker}
              />
            </View>
          )}

          <TotalCard
            title="Total Earnings"
            amount={weeklyTotal}
          />
        </>
      }
      renderItem={({ item }) => {
        const daily =
          weeklyDailyData?.[
            item.date
          ];

        /*
         * IMPORTANT:
         *
         * For BOTH Individual and ZestBot,
         * prefer the daily API totalEarnings.
         *
         * Example:
         *
         * Thursday weekly API:
         *     ₹360.56
         *
         * Thursday daily API:
         *     ₹1860.56
         *
         * The difference is the ₹1500 Joining Bonus.
         */
        const amount =
          getWeeklyDayAmount(
            daily,
            item
          );

        return (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              onDay(item.date)
            }
          >
            <View
              style={styles.rowText}
            >
              <Text
                style={styles.rowTitle}
              >
                {item.day} (
                {prettyDate(
                  item.date
                )}
                )
              </Text>

              <Text
                style={styles.rowSub}
              >
                {item.orders || 0}{" "}
                {Number(
                  item.orders || 0
                ) === 1
                  ? "order"
                  : "orders"}
              </Text>
            </View>

            <Text
              style={styles.amount}
            >
              ₹{formatMoney(amount)}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

/* =========================================================
   DAILY SCREEN
========================================================= */

function DailyScreen({
  data,
  items,
  isZestbot,
  loading,
  refreshing,
  onRefresh,
  onLoadMore,
  onOrder,
  onSalary,
}) {
  if (loading && !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#9c50ff"
        />

        <Text
          style={styles.loaderText}
        >
          Loading earnings...
        </Text>
      </View>
    );
  }

  const visibleItems =
    items.filter(
      (item) =>
        item.type !== "ATTENDANCE"
    );

  /*
   * totalEarnings is the canonical daily
   * total and includes Joining Bonus.
   */
  const total = Number(
    data?.totalEarnings ?? 0
  );

  return (
    <FlatList
      data={visibleItems}
      keyExtractor={(item, index) =>
        `${
          item.orderId ||
          item.transactionId ||
          item.type
        }-${index}`
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#9c50ff"]}
        />
      }
      ListHeaderComponent={
        <TotalCard
          title="Total Earnings"
          amount={total}
        />
      }
      renderItem={({ item }) => {
        if (
          item.type ===
          "INCENTIVE"
        ) {
          return (
            <Row
              title="INCENTIVE"
              subtitle={formatTime(
                item.time
              )}
              amount={Number(
                item.amount || 0
              )}
            />
          );
        }

        if (
          isZestbot &&
          item.type === "SALARY"
        ) {
          return (
            <Row
              title="Salary"
              subtitle={formatTime(
                item.time
              )}
              amount={Number(
                item.amount || 0
              )}
              onPress={() =>
                onSalary(item)
              }
            />
          );
        }

        if (
          isZestbot &&
          item.type ===
            "DELIVERY"
        ) {
          const incentive =
            Number(
              item.incentive || 0
            );

          const tips = Number(
            item.tips || 0
          );

          return (
            <Row
              title="Delivery"
              subtitle={formatTime(
                item.time
              )}
              amount={
                incentive + tips
              }
              onPress={() =>
                onOrder(
                  item.orderId
                )
              }
            />
          );
        }

        return (
          <Row
            title={item.type}
            subtitle={formatTime(
              item.time
            )}
            amount={Number(
              item.amount ??
                item.incentive ??
                0
            )}
            onPress={() => {
              if (
                item.type ===
                  "DELIVERY" &&
                item.orderId
              ) {
                onOrder(
                  item.orderId
                );
              }
            }}
          />
        );
      }}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        !loading ? (
          <Empty />
        ) : null
      }
      ListFooterComponent={
        loading ? (
          <LoaderSmall />
        ) : null
      }
    />
  );
}

/* =========================================================
   ORDER DETAILS
========================================================= */

function OrderDetails({
  data,
  riderType,
  loading,
}) {
  if (!data) {
    return <Empty />;
  }

  const transaction =
    data.transaction || data;

  const currentRiderType =
    data.riderType || riderType;

  const isZestbotEmployee =
    currentRiderType === ZESTBOT;

  if (isZestbotEmployee) {
    const incentive =
      Number(
        transaction.incentive ??
          data.incentive ??
          0
      );

    const tips =
      Number(
        transaction.tips ??
          data.tips ??
          0
      );

    const total =
      incentive + tips;

    const orderId =
      data.orderId ||
      transaction.orderId ||
      transaction.referenceId ||
      "-";

    const store =
      data.store || "-";

    const timestamp =
      transaction.time ||
      transaction.creditedAt ||
      data.time ||
      "-";

    const status =
      transaction.status ||
      data.status ||
      "-";

    return (
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View style={styles.details}>
            <TotalCard
              title="Total Earnings"
              amount={total}
            />

            <View style={styles.box}>
              <BreakRow
                label="Rider Type"
                value={
                  currentRiderType
                }
                text
              />

              <BreakRow
                label="Order ID"
                value={orderId}
                text
              />

              <BreakRow
                label="Store"
                value={store}
                text
              />

              <BreakRow
                label="Incentive"
                value={incentive}
              />

              <BreakRow
                label="Tips"
                value={tips}
              />

              <BreakRow
                label="Time"
                value={formatDateTime(
                  timestamp
                )}
                text
              />

              <BreakRow
                label="Status"
                value={status}
                text
              />
            </View>

            {loading && (
              <LoaderSmall />
            )}
          </View>
        }
      />
    );
  }

  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <View style={styles.details}>
          <TotalCard
            title="Total Earnings"
            amount={Number(
              data.totalEarnings || 0
            )}
          />

          <View style={styles.box}>
            <BreakRow
              label="Store"
              value={
                data.store || "-"
              }
              text
            />

            <BreakRow
              label="Order ID"
              value={
                data.orderId || "-"
              }
              text
            />

            <BreakRow
              label="Base Fare"
              value={Number(
                transaction.basePay ||
                  0
              )}
            />

            <BreakRow
              label="Distance Fare"
              value={Number(
                transaction.distancePay ||
                  0
              )}
            />

            <BreakRow
              label="Surge"
              value={Number(
                transaction.surgePay ||
                  0
              )}
            />

            <BreakRow
              label="Tips"
              value={Number(
                transaction.tips ||
                  0
              )}
            />

            <BreakRow
              label="Time"
              value={formatDateTime(
                transaction.time ||
                  transaction.creditedAt ||
                  data.time
              )}
              text
            />

            <BreakRow
              label="Status"
              value={
                transaction.status ||
                data.status ||
                "-"
              }
              text
            />
          </View>

          {loading && (
            <LoaderSmall />
          )}
        </View>
      }
    />
  );
}

/* =========================================================
   ROW
========================================================= */

function Row({
  title,
  subtitle,
  amount,
  onPress,
}) {
  const content = (
    <>
      <View style={styles.rowText}>
        <Text
          style={styles.rowTitle}
        >
          {title}
        </Text>

        {!!subtitle && (
          <Text
            style={styles.rowSub}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <Text style={styles.amount}>
        ₹{formatMoney(amount || 0)}
      </Text>
    </>
  );

  return onPress ? (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  ) : (
    <View style={styles.row}>
      {content}
    </View>
  );
}

/* =========================================================
   BREAKDOWN ROW
========================================================= */

function BreakRow({
  label,
  value,
  text = false,
}) {
  return (
    <View
      style={styles.breakRow}
    >
      <Text
        style={styles.breakLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.breakValue}
      >
        {text
          ? value || "-"
          : `₹${formatMoney(
              value || 0
            )}`}
      </Text>
    </View>
  );
}

/* =========================================================
   TOTAL CARD
========================================================= */

function TotalCard({
  title,
  amount,
}) {
  return (
    <View style={styles.card}>
      <Text
        style={styles.cardLabel}
      >
        {title}
      </Text>

      <Text
        style={styles.cardAmount}
      >
        ₹{formatMoney(
          amount || 0
        )}
      </Text>
    </View>
  );
}

/* =========================================================
   FILTER
========================================================= */

function Filter({
  text,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.filter}
      onPress={onPress}
    >
      <Text>{text}</Text>

      <Ionicons
        name="chevron-down"
        size={16}
      />
    </TouchableOpacity>
  );
}

/* =========================================================
   MODAL
========================================================= */

function SimpleModal({
  visible,
  title,
  data,
  label,
  selected,
  highlight,
  onClose,
  onSelect,
}) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={
          styles.modalOverlay
        }
      >
        <View style={styles.modal}>
          <View
            style={
              styles.modalHeader
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              {title}
            </Text>

            <TouchableOpacity
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={24}
              />
            </TouchableOpacity>
          </View>

          <FlatList
            data={data}
            keyExtractor={(
              item,
              index
            ) =>
              String(
                item?.week ??
                  item ??
                  index
              )
            }
            renderItem={({
              item,
            }) => {
              const active =
                selected?.(item);

              const current =
                highlight?.(item);

              return (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    active &&
                      styles.modalSelected,
                    current &&
                      styles.modalCurrent,
                  ]}
                  onPress={() =>
                    onSelect(item)
                  }
                >
                  <Text>
                    {label(item)}
                  </Text>

                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#9c50ff"
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================
   LOADERS
========================================================= */

function Loader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator
        size="large"
        color="#9c50ff"
      />

      <Text
        style={styles.loaderText}
      >
        Loading earnings...
      </Text>
    </View>
  );
}

function LoaderSmall() {
  return (
    <View
      style={styles.loaderSmall}
    >
      <ActivityIndicator
        size="small"
        color="#9c50ff"
      />
    </View>
  );
}

/* =========================================================
   EMPTY / ERROR
========================================================= */

function Empty() {
  return (
    <View style={styles.empty}>
      <Text
        style={styles.emptyText}
      >
        No data available
      </Text>
    </View>
  );
}

function ErrorBox({
  text,
  retry,
}) {
  return (
    <View style={styles.error}>
      <Text
        style={styles.errorText}
      >
        {text}
      </Text>

      <TouchableOpacity
        onPress={retry}
      >
        <Text
          style={styles.retry}
        >
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* =========================================================
   DATE HELPERS
========================================================= */

function formatTime(value) {
  if (!value) return "";

  return new Date(
    value
  ).toLocaleTimeString();
}

function formatDateTime(value) {
  if (!value || value === "-") {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}

function prettyDate(value) {
  const date = new Date(value);

  const day = date.getDate();

  const suffix =
    day > 3 && day < 21
      ? "th"
      : ["th", "st", "nd", "rd"][
          day % 10
        ] || "th";

  return `${date.toLocaleString(
    "en-US",
    { month: "short" }
  )} ${day}${suffix}`;
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
  },

  back: {
    padding: 8,
  },

  headerTitle: {
    fontSize: isTablet
      ? responsiveFontSize(1.9)
      : 23,
    fontWeight: "700",
    marginLeft: 5,
  },

  offline: {
    color: "red",
    marginLeft: 10,
  },

  card: {
    margin: 16,
    padding: isTablet
      ? responsiveWidth(2.2)
      : 18,
    borderRadius: 12,
    backgroundColor: "#9c50ff",
  },

  cardLabel: {
    color: "#FFF",
    fontSize: isTablet
      ? responsiveFontSize(1.2)
      : 15,
  },

  cardAmount: {
    marginTop: 3,
    color: "#FFF",
    fontSize: isTablet
      ? responsiveFontSize(2.2)
      : 27,
    fontWeight: "800",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: isTablet
      ? responsiveWidth(1.8)
      : 14,
    borderWidth: 1.5,
    borderColor: "#e5b6fd",
    borderRadius: 10,
    backgroundColor: "#FFF",
  },

  rowText: {
    flex: 1,
  },

  rowTitle: {
    fontSize: isTablet
      ? responsiveFontSize(1.25)
      : 15,
    fontWeight: "600",
  },

  rowSub: {
    marginTop: 3,
    color: "#777",
    fontSize: 12,
  },

  amount: {
    marginLeft: 12,
    color: "#24c77b",
    fontWeight: "700",
    fontSize: isTablet
      ? responsiveFontSize(1.25)
      : 15,
  },

  box: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5b6fd",
    borderRadius: 10,
    backgroundColor: "#FFF",
    overflow: "hidden",
  },

  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    minHeight: 48,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  breakLabel: {
    color: "#333",
    fontSize: 14,
  },

  breakValue: {
    maxWidth: "60%",
    textAlign: "right",
    color: "#0A9F5A",
    fontWeight: "700",
    fontSize: 14,
  },

  filters: {
    flexDirection: "row",
    justifyContent:
      "space-around",
    padding: 8,
  },

  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#FFF",
  },

  details: {
    paddingTop: 1,
  },

  loader: {
    flex: 1,
    justifyContent:
      "center",
    alignItems: "center",
  },

  loaderText: {
    marginTop: 10,
    color: "#777",
  },

  loaderSmall: {
    padding: 20,
    alignItems: "center",
  },

  empty: {
    padding: 40,
    alignItems: "center",
  },

  emptyText: {
    color: "#777",
  },

  error: {
    margin: 16,
    padding: 18,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#FFECEC",
  },

  errorText: {
    color: "#C00",
    textAlign: "center",
  },

  retry: {
    marginTop: 8,
    color: "#007AFF",
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor:
      "rgba(0,0,0,0.45)",
  },

  modal: {
    maxHeight: "75%",
    borderRadius: 14,
    backgroundColor: "#FFF",
    overflow: "hidden",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  modalSelected: {
    backgroundColor: "#F5ECFF",
  },

  modalCurrent: {
    borderLeftWidth: 3,
    borderLeftColor: "#9c50ff",
  },
});