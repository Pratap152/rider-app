import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/Ionicons';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCities } from '../../services/onboardingApi';

const isTablet = DeviceInfo.isTablet();
const H_PADDING = isTablet ? 40 : 20;
const CONTENT_MAX_WIDTH = isTablet ? 700 : '100%';
const inputFont = isTablet ? 18 : 14;
const cityFont = isTablet ? 18 : 16;
const iconSize = isTablet ? 24 : 20;

export default function SelectCityScreen({ navigation, route }) {

  const fromPreview = route?.params?.fromPreview ?? false;

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit the app?",
          [
            {
              text: "No",
              style: "cancel",
            },
            {
              text: "Yes",
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );

        return true; // Prevent default behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  const [allCities, setAllCities] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCities() {
      setLoading(true);

      try {
        const response = await getCities();
        const cities = response?.data?.cities || [];

        setAllCities(cities);
        setCitiesList(cities);
      } catch (err) {
        console.log('Error fetching cities', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, []);

  function handleSearch(text) {
    setSearchText(text);

    if (!text || text.trim() === '') {
      setCitiesList(allCities);
      return;
    }

    const query = text.toLowerCase().trim();

    const filtered = allCities.filter(city =>
      (city || '').toLowerCase().includes(query),
    );

    setCitiesList(filtered);
  }

  return (
    <SafeAreaView style={styles.screenWrapper}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select city</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon
            name="search-outline"
            size={isTablet ? 22 : 18}
            color="#888"
            style={{ marginRight: 6 }}
          />
          <TextInput
            placeholder="Search your work city"
            style={styles.searchInput}
            placeholderTextColor="#999"
            onChangeText={handleSearch}
            value={searchText}
          />
        </View>

        {/* Divider */}
        <View style={styles.dividerBar}>
          <Text style={styles.dividerText}>Popular search</Text>
        </View>

        {/* Cities List */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#1F3365" />
            </View>
          ) : citiesList.length === 0 ? (
            <Text style={styles.emptyText}>No cities found</Text>
          ) : (
            citiesList.map(city => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.cityItem,
                  selectedCity === city && styles.citySelected,
                ]}
                onPress={() => {
                  setSelectedCity(city);
                  setSearchText(city);
                }}>
                <Icon
                  name="home-outline"
                  size={iconSize}
                  color={selectedCity === city ? '#fff' : '#1F3365'}
                />
                <Text
                  style={[
                    styles.cityText,
                    selectedCity === city && styles.cityTextSelected,
                  ]}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !selectedCity && { opacity: 0.5 },
          ]}
          disabled={!selectedCity}
          onPress={() =>
            navigation.navigate('AreaSelectionScreen', {
              city: selectedCity,
              fromPreview,
            })
          }
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  container: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    paddingHorizontal: H_PADDING,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerTitle: {
    flex: 1,
    fontSize: isTablet ? 34 : 26,
    fontWeight: '700',
    textAlign: 'center'
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: isTablet ? 12 : 8,
    marginBottom: 15,
  },

  searchInput: {
    flex: 1,
    fontSize: inputFont,
    color: '#000',
  },

  dividerBar: {
    backgroundColor: '#ccc',
    paddingVertical: isTablet ? 10 : 6,
    alignItems: 'center',
    borderRadius: 5,
  },

  dividerText: {
    fontSize: isTablet ? 16 : 14,
    color: '#555',
    fontWeight: '600',
  },

  listContent: {
    paddingVertical: 10,
  },

  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: isTablet ? 16 : 14,
  },

  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1F3365',
    borderRadius: 12,
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 20 : 15,
    marginVertical: isTablet ? 8 : 6,
  },

  citySelected: {
    backgroundColor: '#1F3365',
  },

  cityText: {
    marginLeft: 10,
    fontSize: cityFont,
    color: '#1F3365',
  },

  cityTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    width: isTablet ? 600 : '100%',
    alignSelf: 'center',
    backgroundColor: '#1F3365',
    paddingVertical: isTablet ? 18 : 15,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },

  submitButtonText: {
    color: '#fff',
    fontSize: isTablet ? 22 : 18,
    fontWeight: '700',
  },
});