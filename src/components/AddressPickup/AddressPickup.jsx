import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { ENV } from '../../config/env'
// import GooglePlacesAutocomplete from 'react-native-google-places-autocomplete';

const AddressPickup = ({ placeholderText, onLocationSelect }) => {

    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const fetchLocationSuggestions = async (text) => {
        if (text.trim()) {
            try {
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${ENV.GOOGLE_MAPS_API_KEY}`
                );
                const data = await response.json();
                if (data.status === 'OK') {
                    setSuggestions(data.predictions);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error('Error fetching location suggestions:', error);
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleLocationSelect = async (placeId) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${ENV.GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            console.log("data" , data)
            const selectedLocation = {
                latitude: data.result.geometry.location.lat,
                longitude: data.result.geometry.location.lng,
                address: data.result.formatted_address,
            };

            console.log('Selected location:', selectedLocation);

            // Update the search text with the selected address
            setSearchText(selectedLocation.address);

            // Call the callback function passed from parent
            if (onLocationSelect) {
                onLocationSelect(selectedLocation);
            }

            // Clear suggestions only
            setSuggestions([]);
        } catch (error) {
            console.error('Error fetching location details:', error);
        }
    };

    const onPressAddress = (data, details) => {
        console.log(" details===>>>", details)
    }

    return (
        <View style={styles.container}>

            <TextInput
                style={styles.searchInput}
                placeholder={placeholderText}
                value={searchText}
                onChangeText={(text) => {
                    setSearchText(text);
                    fetchLocationSuggestions(text); // Fetch location suggestions as you type
                }}
            />

            {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.suggestionItem}
                                onPress={() => handleLocationSelect(item.place_id)}
                            >
                                <Text style={styles.suggestionText}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                        style={styles.suggestionsList}
                        nestedScrollEnabled={true}
                    />
                </View>
            )}


            {/* <GooglePlacesAutocomplete
                placeholder='Search'
                onPress={onPressAddress}
                fetchDetails={true}
                query={{
                    key: ENV.GOOGLE_MAPS_API_KEY,
                    language: 'en',
                }}
            /> */}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    searchInput: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        maxHeight: 200,
    },
    suggestionsList: {
        maxHeight: 200,
    },
    suggestionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionText: {
        fontSize: 16,
        color: '#333',
    },
})

export default AddressPickup    