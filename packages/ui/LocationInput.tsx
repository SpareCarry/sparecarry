/**
 * Location Input Component with Autocomplete
 * Provides location input with GPS, autocomplete, and recent locations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { autocomplete, type Place } from '../../lib/services/location';
import { useLocationInput, type RecentLocation } from '@sparecarry/hooks/useLocationInput';

interface LocationInputProps {
  value: string;
  onChange: (address: string, lat: number | null, lon: number | null) => void;
  placeholder?: string;
  label?: string;
  onLocationSelect?: (location: Place | RecentLocation) => void;
  showCommonLocations?: boolean;
}

const COMMON_LOCATIONS = [
  { name: 'Miami, FL', lat: 25.7617, lon: -80.1918 },
  { name: 'Nassau, Bahamas', lat: 25.0479, lon: -77.3554 },
  { name: 'Fort Lauderdale, FL', lat: 26.1224, lon: -80.1373 },
  { name: 'Key West, FL', lat: 24.5551, lon: -81.7821 },
  { name: 'Bimini, Bahamas', lat: 25.7000, lon: -79.2667 },
];

export function LocationInput({
  value,
  onChange,
  placeholder = 'Enter location',
  label,
  onLocationSelect,
  showCommonLocations = true,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);

  const { gettingLocation, handleGetCurrentLocation, getRecentLocations } = useLocationInput();

  // Load recent locations on mount
  useEffect(() => {
    loadRecentLocations();
  }, []);

  // Update search query when value changes externally
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const loadRecentLocations = async () => {
    const recent = await getRecentLocations();
    setRecentLocations(recent);
  };

  // Debounced autocomplete search
  const searchAutocomplete = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const results = await autocomplete(query, { limit: 5 });
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error in autocomplete:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery !== value) {
        searchAutocomplete(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, value, searchAutocomplete]);

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    onChange(text, null, null);
    if (text.length >= 2) {
      searchAutocomplete(text);
    } else {
      setSuggestions([]);
      setShowSuggestions(text.length > 0);
    }
  };

  const handleSelectSuggestion = (place: Place) => {
    setSearchQuery(place.name);
    onChange(place.name, place.lat, place.lon);
    setShowSuggestions(false);
    setSuggestions([]);
    onLocationSelect?.(place);
  };

  const handleSelectRecent = (location: RecentLocation) => {
    setSearchQuery(location.address);
    onChange(location.address, location.lat, location.lon);
    setShowSuggestions(false);
    onLocationSelect?.(location);
  };

  const handleGetGPS = async () => {
    const location = await handleGetCurrentLocation();
    if (location) {
      setSearchQuery(location.address);
      onChange(location.address, location.lat, location.lon);
      setShowSuggestions(false);
      await loadRecentLocations(); // Reload to show new recent location
    }
  };

  const renderSuggestion = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
    >
      <MaterialIcons name="location-on" size={20} color="#14b8a6" />
      <View style={styles.suggestionText}>
        <Text style={styles.suggestionName}>{item.name}</Text>
        {item.category && (
          <Text style={styles.suggestionCategory}>{item.category}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRecentLocation = ({ item }: { item: RecentLocation }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectRecent(item)}
    >
      <MaterialIcons name="history" size={20} color="#999" />
      <View style={styles.suggestionText}>
        <Text style={styles.suggestionName}>{item.address}</Text>
        <Text style={styles.suggestionCategory}>Recent</Text>
      </View>
    </TouchableOpacity>
  );

  const allSuggestions = showSuggestions && searchQuery.length === 0
    ? recentLocations
    : suggestions;

  const handleSelectCommon = (location: typeof COMMON_LOCATIONS[0]) => {
    setSearchQuery(location.name);
    onChange(location.name, location.lat, location.lon);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Common Location Shortcuts */}
      {showCommonLocations && value.length === 0 && (
        <View style={styles.commonLocationsContainer}>
          {COMMON_LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc.name}
              style={styles.commonLocationButton}
              onPress={() => handleSelectCommon(loc)}
            >
              <Text style={styles.commonLocationText}>{loc.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          onFocus={() => {
            if (searchQuery.length === 0) {
              loadRecentLocations();
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow selection
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={handleGetGPS}
          disabled={gettingLocation}
        >
          {gettingLocation ? (
            <ActivityIndicator size="small" color="#14b8a6" />
          ) : (
            <MaterialIcons name="my-location" size={20} color="#14b8a6" />
          )}
        </TouchableOpacity>
      </View>

      {showSuggestions && allSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {searchQuery.length === 0 && recentLocations.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Recent Locations</Text>
            </View>
          )}
          {searchQuery.length === 0 ? (
            <FlatList
              data={recentLocations}
              renderItem={renderRecentLocation}
              keyExtractor={(item, index) => `recent-${index}`}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item, index) => item.id || `suggestion-${index}`}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#14b8a6" />
                    <Text style={styles.loadingText}>Searching...</Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  gpsButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    padding: 8,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  suggestionCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  commonLocationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  commonLocationButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#14b8a6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commonLocationText: {
    fontSize: 12,
    color: '#14b8a6',
    fontWeight: '600',
  },
});

