
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Ionicons from 'react-native-vector-icons/Ionicons';
import LocationBlocker from '../home/LocationBlocker';
import {
  checkLocationRequirements,
  requestLocationRequirements,
} from "../../utils/locationPermission";

const getButtonColor = (time) => {
    if (time > 15) return '#16a34a'; // Green
    if (time > 7) return '#f59e0b';  // Orange
    return '#ef4444';                // Red
};

const OrderCard = ({
    distance,
    price,
    items,
    pickup,
    drop,
    timeLeft,
    onAccept,
    onReject,
    isSubmitting,
    loadingAction,
}) => {

    const [locationReady, setLocationReady] = useState(true);
    const handleAccept = async () => {
        const isLocationAvailable =
            await checkLocationRequirements();

        setLocationReady(isLocationAvailable);

        if (!isLocationAvailable) {
            return;
        }

        onAccept();
    };

    const handleEnableLocation = async () => {
        const granted = await requestLocationRequirements();

        setLocationReady(granted);
    };

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View>
                    <Text style={styles.distance}>{distance}</Text>
                    <View style={styles.itemsBadge}>
                        <Text style={styles.itemsText}>{items} Items</Text>
                    </View>
                </View>

                <Text style={styles.price}>₹{Math.round(price)}</Text>
            </View>

            <View style={styles.routeContainer}>
                <View style={styles.markerColumn}>
                    <Ionicons name="radio-button-off" size={wp('4.5%')} color="#16a34a" />
                    <View style={styles.dashedLine}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <View key={i} style={styles.dash} />
                        ))}
                    </View>
                    <Ionicons name="radio-button-off" size={wp('4.5%')} color="#ef4444" />
                </View>

                <View style={styles.addressColumn}>
                    <Text style={styles.locationText} numberOfLines={1}>{pickup}</Text>
                    <View style={{ height: hp('3.5%') }} />
                    <Text style={styles.locationText} numberOfLines={1}>{drop}</Text>
                </View>
            </View>

            <View style={styles.buttonRow}>
    <TouchableOpacity
    style={[
        styles.rejectButton,
        isSubmitting && { opacity: 0.6 },
    ]}
    activeOpacity={0.85}
    onPress={onReject}
    disabled={isSubmitting}
>
       {
    isSubmitting && loadingAction === "reject" ? (
        <ActivityIndicator color="#fff" />
    ) : (
        <Ionicons
            name="close"
            size={25}
            color="#FFFFFF"
        />
    )
}
    </TouchableOpacity>

    <TouchableOpacity
    style={[
        styles.acceptButton,
        { backgroundColor: getButtonColor(timeLeft) },
        isSubmitting && { opacity: 0.6 },
    ]}
    disabled={timeLeft === 0 || isSubmitting}
    activeOpacity={0.85}
    onPress={handleAccept}
>
        {
    isSubmitting && loadingAction === "accept" ? (
        <ActivityIndicator color="#fff" />
    ) : (
        <Text style={styles.acceptText}>
            {timeLeft > 0 ? `Accept in ${timeLeft}` : "Expired"}
        </Text>
    )
}
    </TouchableOpacity>
</View>

<LocationBlocker
    visible={!locationReady}
    onEnable={handleEnableLocation}
/>
        </View>
    );
};

export default OrderCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: wp("5%"),
        padding: wp("5%"),
        marginBottom: hp("2%"),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        position: 'relative',
    },
    rejectButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
},
buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1%'),
},
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp('2%'),
    },
    distance: {
        fontSize: wp("6%"),
        fontWeight: '800',
        color: '#1a1a1a',
    },
    itemsBadge: {
        backgroundColor: '#dbeafe',
        borderRadius: wp("6%"),
        paddingHorizontal: wp("3%"),
        paddingVertical: hp("0.5%"),
        marginTop: hp("0.5%"),
        alignSelf: 'flex-start',
    },
    itemsText: {
        fontSize: wp("3.2%"),
        color: '#2563eb',
        fontWeight: '700',
    },
    price: {
        fontSize: wp("8%"),
        fontWeight: '800',
        color: '#16a34a',
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: hp('1.5%'),
    },
    markerColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: wp('3%'),
    },
    dashedLine: {
        height: hp('3.5%'),
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    dash: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#cbd5e1',
        marginVertical: 1,
    },
    addressColumn: {
        flex: 1,
        justifyContent: 'space-between',
    },
    locationText: {
        fontSize: wp("4%"),
        fontWeight: '600',
        color: '#333',
    },
   acceptButton: {
    flex: 1,
    borderRadius: wp("8%"),
    paddingVertical: hp("1.8%"),
    alignItems: 'center',
    justifyContent: 'center',
},
    acceptText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: wp("4.5%"),
    },
});
