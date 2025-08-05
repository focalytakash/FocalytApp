import { Alert, Linking, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import Geocoder from 'react-native-geocoding';
import Config from 'react-native-config';
import RNLocation from 'react-native-location';

console.log('📍 Using react-native-permissions with react-native-location + geocoding');

// Initialize Google Geocoding with API key from config
const GOOGLE_MAPS_API_KEY = Config.GOOGLE_MAPS_API_KEY;
Geocoder.init(GOOGLE_MAPS_API_KEY);
console.log('🗺️ Google Places API initialized with key from config');

// Configure react-native-location with high accuracy
RNLocation.configure({
  distanceFilter: 0, // Get all location updates (no distance filtering)
  desiredAccuracy: {
    ios: 'best', // Use best accuracy on iOS (GPS + Network)
    android: 'highAccuracy' // Use high accuracy on Android (GPS)
  },
  // Enable high accuracy mode
  enableBackgroundLocationUpdates: false,
  interval: 1000, // Request updates every second
  fastestInterval: 500, // Accept updates as fast as 500ms
  maxWaitTime: 5000 // Maximum wait time for location
});

// Get the appropriate location permission for the platform
const getLocationPermission = () => {
  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
  } else {
    return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  }
};

// Get address from coordinates using multiple services with Indian focus
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await Geocoder.from(latitude, longitude);
    if (response && response.results && response.results.length > 0) {
      const result = response.results[0];
      const addressComponents = result.address_components;
      const address = {
        formattedAddress: result.formatted_address,
        streetNumber: '',
        route: '',
        locality: '',
        administrativeArea: '',
        postalCode: '',
        country: '',
        placeId: result.place_id,
        types: result.types,
      };
      addressComponents.forEach(component => {
        const types = component.types;
        if (types.includes('street_number')) address.streetNumber = component.long_name;
        else if (types.includes('route')) address.route = component.long_name;
        else if (types.includes('locality')) address.locality = component.long_name;
        else if (types.includes('administrative_area_level_1')) address.administrativeArea = component.long_name;
        else if (types.includes('postal_code')) address.postalCode = component.long_name;
        else if (types.includes('country')) address.country = component.long_name;
      });
      const cleanAddress = [
        address.streetNumber && address.route ? `${address.streetNumber} ${address.route}` : address.route,
        address.locality,
        address.administrativeArea,
        address.postalCode,
        address.country
      ].filter(Boolean).join(', ');
      address.cleanAddress = cleanAddress;
      return address;
    }
    throw new Error('No address found');
  } catch (error) {
    return {
      formattedAddress: 'Address not available',
      cleanAddress: 'Address not available',
      error: error.message
    };
  }
};

// Calculate address score with Indian context and building bonus
const calculateIndianAddressScore = (address, lat, lng) => {
  let score = 0;
  
  // Building name bonus (high value for businesses/landmarks)
  if (address.buildingName && address.buildingName !== 'Unnamed') {
    score += 4; // High bonus for building names
    console.log('🏢 Building name bonus: +4 for', address.buildingName);
  }
  
  // Basic completeness scores
  if (address.street && address.street !== 'Street not available') {
    score += 3;
    if (address.houseNumber) score += 2;
  }
  
  // Indian-specific area validation (very important)
  if (address.area && address.area !== address.city) {
    score += 5;
    
    // Bonus for known Indian locality patterns
    const areaLower = address.area.toLowerCase();
    if (areaLower.includes('sector') || areaLower.includes('phase') || 
        areaLower.includes('block') || areaLower.includes('colony') ||
        areaLower.includes('nagar') || areaLower.includes('vihar') ||
        areaLower.includes('enclave') || areaLower.includes('extension')) {
      score += 3;
    }
    
    // Specific bonus for Punjab/Haryana areas
    if (areaLower.includes('zirakpur') || areaLower.includes('mohali') ||
        areaLower.includes('chandigarh') || areaLower.includes('panchkula') ||
        areaLower.includes('kharar') || areaLower.includes('kurali')) {
      score += 4;
    }
  }
  
  // City accuracy with Indian validation
  if (address.city && address.city !== 'City not available') {
    score += 3;
    
    // Validate city-district relationship for Indian addresses
    const cityLower = address.city.toLowerCase();
    const districtLower = address.district?.toLowerCase() || '';
    
    // Punjab/Haryana specific validation
    if ((cityLower.includes('zirakpur') && districtLower.includes('mohali')) ||
        (cityLower.includes('mohali') && districtLower.includes('mohali')) ||
        (cityLower.includes('chandigarh') && !districtLower.includes('mohali'))) {
      score += 2; // Correct administrative relationship
    }
  }
  
  // Postal code validation (Indian format)
  if (address.postalCode && address.postalCode !== 'Postal code not available') {
    score += 2;
    
    // Validate Indian postal code format (6 digits)
    if (/^\d{6}$/.test(address.postalCode)) {
      score += 1;
      
      // Regional validation based on coordinates
      const pinFirst = parseInt(address.postalCode.substring(0, 2));
      if (lat > 30 && lat < 32 && lng > 76 && lng < 77) {
        // Punjab/Chandigarh region should have pins starting with 14, 16
        if (pinFirst === 14 || pinFirst === 16) score += 2;
      }
    }
  }
  
  // Address completeness
  const addressLength = address.formattedAddress ? address.formattedAddress.length : 0;
  if (addressLength > 30) score += 2;
  if (addressLength > 60) score += 1;
  
  // Additional metadata
  if (address.sublocality) score += 2;
  if (address.district) score += 1;
  
  // Source reliability for Indian addresses
  if (address.source === 'Nominatim (OpenStreetMap)') score += 2;
  if (address.source === 'MapBox') score += 2;
  if (address.source === 'Indian Postal') score += 3;
  if (address.source === 'LocationIQ') score += 1;
  if (address.source === 'Google Places') score += 5; // Google Places has highest priority
  if (address.source === 'Google Direct API') score += 4; // Google Direct API high priority
  
  return score;
};

// Apply consensus with Indian address knowledge
const applyIndianAddressConsensus = (addresses, lat, lng) => {
  console.log('🇮🇳 Applying Indian address consensus from', addresses.length, 'addresses');
  
  // Find most common values with Indian validation
  const areas = addresses.map(a => a.area).filter(Boolean);
  const cities = addresses.map(a => a.city).filter(Boolean);
  const districts = addresses.map(a => a.district).filter(Boolean);
  const postalCodes = addresses.map(a => a.postalCode).filter(Boolean);
  
  const mostCommonArea = getMostFrequentIndian(areas, 'area');
  const mostCommonCity = getMostFrequentIndian(cities, 'city');
  const mostCommonDistrict = getMostFrequentIndian(districts, 'district');
  const mostCommonPostal = getMostFrequentIndian(postalCodes, 'postal');
  
  // Use the most detailed address as base
  const baseAddress = addresses.reduce((prev, current) => {
    const prevScore = calculateIndianAddressScore(prev, lat, lng);
    const currentScore = calculateIndianAddressScore(current, lat, lng);
    return currentScore > prevScore ? current : prev;
  });
  
  // Apply consensus with validation
  return {
    ...baseAddress,
    area: mostCommonArea || baseAddress.area,
    city: mostCommonCity || baseAddress.city,
    district: mostCommonDistrict || baseAddress.district,
    postalCode: mostCommonPostal || baseAddress.postalCode,
    source: `${baseAddress.source} + Indian Consensus`,
    confidence: addresses.length >= 3 ? 'high' : 'medium'
  };
};


const handleGetAddress = async () => {
  if (!lastLocation?.latitude || !lastLocation?.longitude) {
    Alert.alert('No location', 'Location not available');
    return;
  }
  setLoading(true);
  const address = await getAddressFromCoordinates(lastLocation.latitude, lastLocation.longitude);
  setLoading(false);
  setLastLocation({
    ...lastLocation,
    address, // attach the full/clean address
  });
  Alert.alert('Address', address.cleanAddress || address.formattedAddress);
};

// Find most frequent value with Indian locality knowledge
const getMostFrequentIndian = (arr, type) => {
  if (!arr.length) return null;
  
  const frequency = {};
  arr.forEach(item => {
    // Normalize for Indian addresses
    const normalized = normalizeIndianAddress(item, type);
    frequency[normalized] = (frequency[normalized] || 0) + 1;
  });
  
  let maxCount = 0;
  let mostFrequent = null;
  
  Object.entries(frequency).forEach(([item, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = item;
    }
  });
  
  return mostFrequent;
};

// Normalize Indian address components
const normalizeIndianAddress = (value, type) => {
  if (!value) return value;
  
  let normalized = value.trim();
  
  if (type === 'area') {
    // Standardize area names
    normalized = normalized
      .replace(/sec-/gi, 'Sector ')
      .replace(/ph-/gi, 'Phase ')
      .replace(/\s+/g, ' ');
  } else if (type === 'city') {
    // Handle city variations
    if (normalized.toLowerCase().includes('mohali')) {
      normalized = 'Mohali';
    } else if (normalized.toLowerCase().includes('zirakpur')) {
      normalized = 'Zirakpur';
    }
  }
  
  return normalized;
};

// Validate and enhance Indian address
const validateIndianAddress = (address, lat, lng) => {
  console.log('🔍 Validating Indian address context...');
  
  let validated = { ...address };
  
  // Punjab/Haryana region validation (lat: 30-32, lng: 76-77)
  if (lat > 30 && lat < 32 && lng > 76 && lng < 77) {
    
    // Fix common Zirakpur/Mohali confusion
    if (address.area && address.area.toLowerCase().includes('zirakpur')) {
      validated.city = 'Zirakpur';
      validated.district = 'Mohali'; // Administrative district
      
      // Fix postal code if wrong
      if (!address.postalCode || !address.postalCode.startsWith('140')) {
        validated.postalCode = '140603'; // Common Zirakpur PIN
        validated.postalCodeNote = 'Corrected for Zirakpur area';
      }
    }
    
    // Mohali city validation
    if (address.city && address.city.toLowerCase().includes('mohali') && 
        address.area && !address.area.toLowerCase().includes('zirakpur')) {
      validated.district = 'Mohali';
    }
    
    // Add state if missing
    if (!validated.state || validated.state === 'State not available') {
      validated.state = 'Punjab';
    }
    
    // Add country if missing
    if (!validated.country || validated.country === 'Country not available') {
      validated.country = 'India';
    }
  }
  
  // Rebuild formatted address with validated components
  const parts = [];
  if (validated.houseNumber) parts.push(validated.houseNumber);
  if (validated.street && validated.street !== 'Street not available') parts.push(validated.street);
  if (validated.area && validated.area !== 'Area not available') parts.push(validated.area);
  if (validated.city && validated.city !== 'City not available') parts.push(validated.city);
  if (validated.district && validated.district !== validated.city) parts.push(validated.district);
  if (validated.state && validated.state !== 'State not available') parts.push(validated.state);
  if (validated.postalCode && validated.postalCode !== 'Postal code not available') parts.push(validated.postalCode);
  if (validated.country && validated.country !== 'Country not available') parts.push(validated.country);
  
  validated.formattedAddress = parts.join(', ');
  validated.confidence = 'high';
  
  console.log('✅ Address validated with Indian context');
  
  return validated;
};

// BigDataCloud geocoding service (Free, good for Indian addresses)
const getBigDataCloudAddress = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    
    const data = await response.json();
    
    if (data && (data.locality || data.city)) {
      // Building name detection from BigDataCloud
      let buildingName = null;
      if (data.informative && data.informative.length > 0) {
        // Check informative array for building names
        const building = data.informative.find(item => 
          item.type && (item.type.includes('building') || item.type.includes('establishment'))
        );
        if (building && building.name) {
          buildingName = building.name;
        }
      }
      
      // Build comprehensive address with focus on Indian localities
      let addressParts = [];
      
      // Add building name first if available
      if (buildingName) addressParts.push(buildingName);
      
      // Add house number and street
      if (data.streetNumber) addressParts.push(data.streetNumber);
      if (data.streetName) addressParts.push(data.streetName);
      if (data.road) addressParts.push(data.road);
      
      // Add precise locality (important for Zirakpur vs Mohali)
      if (data.locality) addressParts.push(data.locality);
      
      // Add more specific area information
      const adminLevels = data.localityInfo?.administrative || [];
      
      // Level 4 is usually the most specific (like sector, colony)
      if (adminLevels[4]?.name && adminLevels[4].name !== data.locality) {
        addressParts.push(adminLevels[4].name);
      }
      
      // Level 3 is area/sublocality
      if (adminLevels[3]?.name && 
          adminLevels[3].name !== data.locality && 
          adminLevels[3].name !== adminLevels[4]?.name) {
        addressParts.push(adminLevels[3].name);
      }
      
      // Level 2 is usually city/town (this should be more accurate)
      if (adminLevels[2]?.name && 
          adminLevels[2].name !== data.locality) {
        addressParts.push(adminLevels[2].name);
      }
      
      // Add city if different from locality
      if (data.city && data.city !== data.locality && !addressParts.includes(data.city)) {
        addressParts.push(data.city);
      }
      
      // Add state and postal code
      if (data.principalSubdivision) addressParts.push(data.principalSubdivision);
      if (data.postcode) addressParts.push(data.postcode);
      if (data.countryName) addressParts.push(data.countryName);
      
      const fullAddress = addressParts.filter(Boolean).join(', ');
      
      return {
        formattedAddress: fullAddress || 'Complete address not available',
        buildingName: buildingName,
        street: data.road || data.streetName || 'Street not available',
        houseNumber: data.streetNumber || null,
        area: data.locality || adminLevels[3]?.name || 'Area not available',
        sublocality: adminLevels[4]?.name || null,
        city: adminLevels[2]?.name || data.city || data.locality || 'City not available',
        district: adminLevels[1]?.name || null,
        state: data.principalSubdivision || 'State not available',
        country: data.countryName || 'Country not available',
        postalCode: data.postcode || 'Postal code not available',
        landmark: data.plus_code?.compound_code || null,
        source: 'BigDataCloud'
      };
    }
    
    return createFallbackAddress('BigDataCloud: No address data');
  } catch (error) {
    console.error('❌ BigDataCloud error:', error);
    return createFallbackAddress('BigDataCloud service failed');
  }
};

// Nominatim geocoding service (OpenStreetMap - very good for precise locations)
const getNominatimAddress = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&extratags=1`,
      {
        headers: {
          'User-Agent': 'FocalytApp/1.0' // Required by Nominatim
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      let addressParts = [];
      
      // Building name detection from Nominatim
      let buildingName = null;
      
      // Check display name for building/POI information
      const displayParts = data.display_name ? data.display_name.split(',') : [];
      const firstPart = displayParts[0]?.trim();
      
      // Check if first part is a building/establishment name (not a house number or street)
      if (firstPart && !firstPart.match(/^\d/) && !firstPart.includes('Unnamed') && 
          firstPart !== addr.road && firstPart !== addr.house_number) {
        buildingName = firstPart;
      }
      
      // Also check extratags for additional building information
      if (!buildingName && data.extratags) {
        buildingName = data.extratags.name || data.extratags.building || data.extratags.amenity;
      }
      
      // Check if it's categorized as a building/POI
      const isBuilding = data.category && (
        data.category.includes('amenity') ||
        data.category.includes('building') ||
        data.category.includes('shop') ||
        data.category.includes('office') ||
        data.category.includes('leisure') ||
        data.category.includes('tourism')
      );
      
      console.log('🏢 Nominatim building detection:', {
        buildingName,
        isBuilding,
        category: data.category,
        type: data.type,
        firstPart
      });
      
      // Build precise address
      if (buildingName) addressParts.push(buildingName);
      if (addr.house_number) addressParts.push(addr.house_number);
      if (addr.road) addressParts.push(addr.road);
      if (addr.neighbourhood) addressParts.push(addr.neighbourhood);
      if (addr.suburb) addressParts.push(addr.suburb);
      if (addr.village) addressParts.push(addr.village);
      if (addr.town) addressParts.push(addr.town);
      if (addr.city) addressParts.push(addr.city);
      if (addr.state_district && addr.state_district !== addr.city) addressParts.push(addr.state_district);
      if (addr.state) addressParts.push(addr.state);
      if (addr.postcode) addressParts.push(addr.postcode);
      if (addr.country) addressParts.push(addr.country);
      
      const fullAddress = addressParts.filter(Boolean).join(', ');
      
      return {
        formattedAddress: fullAddress || data.display_name || 'Complete address not available',
        buildingName: buildingName,
        street: addr.road || 'Street not available',
        houseNumber: addr.house_number || null,
        area: addr.neighbourhood || addr.suburb || addr.village || 'Area not available',
        sublocality: addr.neighbourhood || null,
        city: addr.town || addr.city || addr.village || 'City not available',
        district: addr.state_district || null,
        state: addr.state || 'State not available',
        country: addr.country || 'Country not available',
        postalCode: addr.postcode || 'Postal code not available',
        landmark: null,
        source: 'Nominatim (OpenStreetMap)',
        isBuilding: isBuilding || !!buildingName
      };
    }
    
    return createFallbackAddress('Nominatim: No address data');
  } catch (error) {
    console.error('❌ Nominatim error:', error);
    return createFallbackAddress('Nominatim service failed');
  }
};

// Google Places API (Most accurate, now enabled with API key)
const getGoogleAddress = async (latitude, longitude) => {
  try {
    console.log('🌟 Using Google Places API for premium accuracy...');
    
    const json = await Geocoder.from(latitude, longitude);
    const result = json.results[0];
    
    if (result) {
      const components = result.address_components;
      
      // Enhanced component extraction for Indian addresses
      const getComponent = (types, preferLong = true) => {
        const component = components.find(c => types.some(type => c.types.includes(type)));
        return component ? (preferLong ? component.long_name : component.short_name) : null;
      };
      
      const getMultipleComponents = (typeArrays) => {
        for (const types of typeArrays) {
          const component = getComponent(types);
          if (component) return component;
        }
        return null;
      };
      
      // Extract comprehensive address components
      const houseNumber = getComponent(['street_number']);
      const street = getComponent(['route']);
      const premise = getComponent(['premise', 'subpremise']);
      const establishment = getComponent(['establishment']);
      const pointOfInterest = getComponent(['point_of_interest']);
      const sublocality1 = getComponent(['sublocality_level_1', 'sublocality']);
      const sublocality2 = getComponent(['sublocality_level_2']);
      const locality = getComponent(['locality']);
      const adminArea2 = getComponent(['administrative_area_level_2']);
      const adminArea1 = getComponent(['administrative_area_level_1']);
      const country = getComponent(['country']);
      const postalCode = getComponent(['postal_code']);
      
      // Detect building name from various sources
      let buildingName = null;
      
      // Priority order for building name detection
      if (establishment && !establishment.includes('Unnamed')) {
        buildingName = establishment;
      } else if (pointOfInterest && !pointOfInterest.includes('Unnamed')) {
        buildingName = pointOfInterest;
      } else if (premise && premise !== houseNumber) {
        buildingName = premise;
      }
      
      // Check if the result represents a building/establishment
      const isBuilding = result.types?.some(type => 
        ['establishment', 'point_of_interest', 'premise', 'building'].includes(type)
      );
      
      console.log('🏢 Building detection:', {
        isBuilding,
        establishment,
        pointOfInterest,
        premise,
        types: result.types,
        detectedBuilding: buildingName
      });
      
      // Smart area/city assignment for Indian addresses
      let area, city, district;
      
      // For Indian addresses, sublocality_level_1 is usually the specific area (like Sector, Phase)
      if (sublocality1) {
        area = sublocality1;
        // Locality is usually the broader city/town
        city = locality || adminArea2 || sublocality1;
        // Admin area 2 is usually the district
        district = adminArea2 !== city ? adminArea2 : null;
      } else if (locality) {
        // If no sublocality, use locality as both area and city
        area = locality;
        city = locality;
        district = adminArea2;
        } else {
        // Fallback
        area = adminArea2 || 'Area not available';
        city = adminArea2 || 'City not available';
        district = adminArea1;
      }
      
      // Build comprehensive address with building name
      const addressParts = [];
      if (buildingName) addressParts.push(buildingName);
      if (houseNumber) addressParts.push(houseNumber);
      if (street) addressParts.push(street);
      if (area && area !== city) addressParts.push(area);
      if (city) addressParts.push(city);
      if (district && district !== city) addressParts.push(district);
      if (adminArea1) addressParts.push(adminArea1);
      if (postalCode) addressParts.push(postalCode);
      if (country) addressParts.push(country);
      
      const enhancedAddress = {
        formattedAddress: result.formatted_address,
        customFormattedAddress: addressParts.filter(Boolean).join(', '),
        buildingName: buildingName,
        street: street || 'Street not available',
        houseNumber: houseNumber,
        premise: premise,
        area: area || 'Area not available',
        sublocality: sublocality2 || sublocality1,
        city: city || 'City not available',
        district: district,
        state: adminArea1 || 'State not available',
        country: country || 'Country not available',
        postalCode: postalCode || 'Postal code not available',
        landmark: null,
        source: 'Google Places',
        confidence: 'high', // Google is always high confidence
        placeId: result.place_id, // Useful for additional queries
        types: result.types, // Place types from Google
        isBuilding: isBuilding
      };
      
      console.log('🌟 Google Places result:', {
        original: result.formatted_address,
        enhanced: enhancedAddress.customFormattedAddress,
        buildingName: enhancedAddress.buildingName,
        area: enhancedAddress.area,
        city: enhancedAddress.city,
        district: enhancedAddress.district
      });
      
      // If we detected a building, try to get nearby address for context
      if (buildingName && isBuilding) {
        try {
          const nearbyAddress = await getNearbyAddressForBuilding(latitude, longitude, buildingName);
          if (nearbyAddress) {
            enhancedAddress.nearbyContext = nearbyAddress;
          }
        } catch (error) {
          console.log('⚠️ Could not get nearby address context:', error.message);
        }
      }
      
      return enhancedAddress;
    }
    
    return createFallbackAddress('Google: No address data');
  } catch (error) {
    console.error('❌ Google Places API error:', error);
    if (error.message?.includes('API key')) {
      console.error('🔑 Check if Google Places API is enabled for this key');
    }
    return createFallbackAddress('Google Places API failed: ' + (error.message || 'Unknown error'));
  }
};

// Get nearby address context for buildings
const getNearbyAddressForBuilding = async (latitude, longitude, buildingName) => {
  try {
    console.log('🔍 Getting nearby context for building:', buildingName);
    
    // Search slightly offset coordinates to get street address
    const offset = 0.0001; // Small offset to get street address
    const nearbyJson = await Geocoder.from(latitude + offset, longitude + offset);
    
    if (nearbyJson.results && nearbyJson.results[0]) {
      const nearbyResult = nearbyJson.results[0];
      // Return simplified address without building details
      const components = nearbyResult.address_components;
      
      const getComponent = (types) => {
        const component = components.find(c => types.some(type => c.types.includes(type)));
        return component?.long_name || null;
      };
      
      return {
        street: getComponent(['route']),
        area: getComponent(['sublocality_level_1', 'sublocality', 'locality']),
        city: getComponent(['locality', 'administrative_area_level_2']),
        district: getComponent(['administrative_area_level_2'])
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Nearby address search failed:', error);
    return null;
  }
};

// Enhanced Google Geocoding fallback (using direct HTTP API)
const getGoogleAddressDirect = async (latitude, longitude) => {
  try {
    
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=en`,
      {
        headers: {
          'User-Agent': 'FocalytApp/1.0'
        }
      }
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results[0]) {
      const result = data.results[0];
      const components = result.address_components;
      
      // Same enhanced parsing as above
      const getComponent = (types) => {
        const component = components.find(c => types.some(type => c.types.includes(type)));
        return component?.long_name || null;
      };
      
      const houseNumber = getComponent(['street_number']);
      const street = getComponent(['route']);
      const premise = getComponent(['premise', 'subpremise']);
      const establishment = getComponent(['establishment']);
      const pointOfInterest = getComponent(['point_of_interest']);
      const area = getComponent(['sublocality_level_1', 'sublocality', 'locality']);
      const city = getComponent(['locality', 'administrative_area_level_2']);
      const district = getComponent(['administrative_area_level_2']);
      const state = getComponent(['administrative_area_level_1']);
      const country = getComponent(['country']);
      const postalCode = getComponent(['postal_code']);
      
      // Building name detection
      let buildingName = null;
      if (establishment && !establishment.includes('Unnamed')) {
        buildingName = establishment;
      } else if (pointOfInterest && !pointOfInterest.includes('Unnamed')) {
        buildingName = pointOfInterest;
      } else if (premise && premise !== houseNumber) {
        buildingName = premise;
      }
      
      return {
        formattedAddress: result.formatted_address,
        buildingName: buildingName,
        street: street || 'Street not available',
        houseNumber: houseNumber,
        premise: premise,
        area: area || 'Area not available',
        sublocality: getComponent(['sublocality_level_2']),
        city: city || area || 'City not available',
        district: district !== city ? district : null,
        state: state || 'State not available',
        country: country || 'Country not available',
        postalCode: postalCode || 'Postal code not available',
        landmark: null,
        source: 'Google Direct API',
        confidence: 'high',
        isBuilding: result.types?.some(type => 
          ['establishment', 'point_of_interest', 'premise', 'building'].includes(type)
        )
      };
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('🔥 Google API quota exceeded');
      return createFallbackAddress('Google API quota exceeded');
    } else {
      console.error('❌ Google Direct API error:', data.status, data.error_message);
      return createFallbackAddress(`Google API error: ${data.status}`);
    }
    
  } catch (error) {
    console.error('❌ Google Direct API network error:', error);
    return createFallbackAddress('Google Direct API failed');
  }
};

// LocationIQ service (OpenStreetMap based, very good accuracy)
const getLocationIQAddress = async (latitude, longitude) => {
  try {
    // Using free tier (100 requests/day)
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse.php?key=pk.0123456789abcdef&lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'FocalytApp/1.0'
        }
      }
    ).catch(() => {
      // Fallback to another endpoint if API key is not working
      return fetch(
        `https://locationiq.org/v1/reverse.php?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FocalytApp/1.0'
          }
        }
    );
  });
    
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      let addressParts = [];
      
      // Build precise address with Indian locality focus
      if (addr.house_number) addressParts.push(addr.house_number);
      if (addr.road) addressParts.push(addr.road);
      if (addr.neighbourhood) addressParts.push(addr.neighbourhood);
      if (addr.quarter) addressParts.push(addr.quarter);
      if (addr.suburb) addressParts.push(addr.suburb);
      if (addr.village) addressParts.push(addr.village);
      if (addr.town) addressParts.push(addr.town);
      if (addr.city) addressParts.push(addr.city);
      if (addr.county && addr.county !== addr.city) addressParts.push(addr.county);
      if (addr.state) addressParts.push(addr.state);
      if (addr.postcode) addressParts.push(addr.postcode);
      if (addr.country) addressParts.push(addr.country);
      
      const fullAddress = addressParts.filter(Boolean).join(', ');
      
      return {
        formattedAddress: fullAddress || data.display_name || 'Complete address not available',
        street: addr.road || 'Street not available',
        houseNumber: addr.house_number || null,
        area: addr.neighbourhood || addr.quarter || addr.suburb || addr.village || 'Area not available',
        sublocality: addr.neighbourhood || addr.quarter || null,
        city: addr.town || addr.city || addr.village || 'City not available',
        district: addr.county || addr.state_district || null,
        state: addr.state || 'State not available',
        country: addr.country || 'Country not available',
        postalCode: addr.postcode || 'Postal code not available',
        landmark: null,
        source: 'LocationIQ'
      };
    }
    
    return createFallbackAddress('LocationIQ: No address data');
  } catch (error) {
    console.error('❌ LocationIQ error:', error);
    return createFallbackAddress('LocationIQ service failed');
  }
};

// PositionStack service (Good for accuracy)
const getPositionStackAddress = async (latitude, longitude) => {
  try {
    // Using free tier
    const response = await fetch(
      `http://api.positionstack.com/v1/reverse?access_key=demo&query=${latitude},${longitude}&limit=1`,
      {
        headers: {
          'User-Agent': 'FocalytApp/1.0'
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data.data && data.data[0]) {
      const result = data.data[0];
      let addressParts = [];
      
      if (result.number) addressParts.push(result.number);
      if (result.street) addressParts.push(result.street);
      if (result.neighbourhood) addressParts.push(result.neighbourhood);
      if (result.locality) addressParts.push(result.locality);
      if (result.administrative_area) addressParts.push(result.administrative_area);
      if (result.region) addressParts.push(result.region);
      if (result.postal_code) addressParts.push(result.postal_code);
      if (result.country) addressParts.push(result.country);
      
      const fullAddress = addressParts.filter(Boolean).join(', ');
      
      return {
        formattedAddress: fullAddress || result.label || 'Complete address not available',
        street: result.street || 'Street not available',
        houseNumber: result.number || null,
        area: result.neighbourhood || result.locality || 'Area not available',
        sublocality: result.neighbourhood || null,
        city: result.locality || result.administrative_area || 'City not available',
        district: result.administrative_area || null,
        state: result.region || 'State not available',
        country: result.country || 'Country not available',
        postalCode: result.postal_code || 'Postal code not available',
        landmark: null,
        source: 'PositionStack'
      };
    }
    
    return createFallbackAddress('PositionStack: No address data');
  } catch (error) {
    console.error('❌ PositionStack error:', error);
    return createFallbackAddress('PositionStack service failed');
  }
};

// MapBox geocoding service (excellent for Indian addresses)
const getMapBoxAddress = async (latitude, longitude) => {
  try {
    // Using MapBox free tier (good coverage for India)
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.demo&language=en&country=IN&types=address,poi`,
      {
        headers: {
          'User-Agent': 'FocalytApp/1.0'
        }
      }
    ).catch(() => {
      // Fallback to alternative MapBox endpoint
      return fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=demo&language=en&types=address,poi`,
        {
          headers: {
            'User-Agent': 'FocalytApp/1.0'
          }
        }
      );
    });
    
    const data = await response.json();
    
    if (data && data.features && data.features[0]) {
      const feature = data.features[0];
      const context = feature.context || [];
      
      // Extract components from MapBox context
      const getContext = (type) => {
        const item = context.find(c => c.id.startsWith(type));
        return item?.text || null;
      };
      
      // Building name detection from MapBox
      let buildingName = null;
      
      // Check if it's a POI (Point of Interest)
      if (feature.properties && feature.properties.category && 
          !feature.properties.category.includes('address')) {
        buildingName = feature.text;
      } else if (feature.place_type && feature.place_type.includes('poi')) {
        buildingName = feature.text;
      }
      
      const place = feature.place_name;
      const address = feature.address || null;
      const locality = getContext('locality') || getContext('place');
      const district = getContext('district');
      const region = getContext('region');
      const postcode = getContext('postcode');
      
      return {
        formattedAddress: place || 'Complete address not available',
        buildingName: buildingName,
        street: feature.text !== buildingName ? feature.text : 'Street not available',
        houseNumber: address,
        area: locality || 'Area not available',
        sublocality: getContext('neighborhood'),
        city: locality || 'City not available',
        district: district || null,
        state: region || 'State not available',
        country: getContext('country') || 'Country not available',
        postalCode: postcode || 'Postal code not available',
        landmark: null,
        source: 'MapBox',
        isBuilding: !!buildingName
      };
    }
    
    return createFallbackAddress('MapBox: No address data');
  } catch (error) {
    console.error('❌ MapBox error:', error);
    return createFallbackAddress('MapBox service failed');
  }
};

// Indian Postal Service geocoding (India-specific)
const getIndianPostalAddress = async (latitude, longitude) => {
  try {
    // Using Indian postal code API
    const response = await fetch(
      `https://api.postalpincode.in/pincode?lat=${latitude}&lng=${longitude}`,
      {
        headers: {
          'User-Agent': 'FocalytApp/1.0'
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
      const postOffice = data[0].PostOffice[0];
      
      const parts = [
        postOffice.Name,
        postOffice.Block,
        postOffice.District,
        postOffice.State,
        postOffice.Pincode,
        'India'
      ].filter(Boolean);
      
      return {
        formattedAddress: parts.join(', '),
        street: 'Street not available',
        houseNumber: null,
        area: postOffice.Block || postOffice.Name || 'Area not available',
        sublocality: null,
        city: postOffice.Block || postOffice.Name || 'City not available',
        district: postOffice.District || null,
        state: postOffice.State || 'State not available',
        country: 'India',
        postalCode: postOffice.Pincode || 'Postal code not available',
        landmark: null,
        source: 'Indian Postal'
      };
    }
    
    return createFallbackAddress('Indian Postal: No data found');
  } catch (error) {
    console.error('❌ Indian Postal error:', error);
    return createFallbackAddress('Indian Postal service failed');
  }
};

// Create fallback address
const createFallbackAddress = (errorMsg) => {
  return {
    formattedAddress: 'Address service unavailable',
    street: 'Street not available',
    city: 'City not available',
    state: 'State not available',
    country: 'Country not available',
    postalCode: 'Postal code not available',
    area: 'Area not available',
    error: errorMsg
  };
};

// Alternative: Get address using Google Geocoding (requires API key)
export const getAddressFromCoordinatesGoogle = async (latitude, longitude) => {
  try {
    console.log('🗺️ Getting address using Google Geocoding...');
    
    const json = await Geocoder.from(latitude, longitude);
    const addressComponent = json.results[0];
    
    if (addressComponent) {
      const address = {
        formattedAddress: addressComponent.formatted_address,
        city: addressComponent.address_components.find(c => c.types.includes('locality'))?.long_name,
        state: addressComponent.address_components.find(c => c.types.includes('administrative_area_level_1'))?.long_name,
        country: addressComponent.address_components.find(c => c.types.includes('country'))?.long_name,
        postalCode: addressComponent.address_components.find(c => c.types.includes('postal_code'))?.long_name,
      };
      
      console.log('✅ Google address obtained:', address.formattedAddress);
      return address;
    }
    
    return {
      formattedAddress: 'Address not available',
      error: 'No address found'
    };
    
  } catch (error) {
    console.error('❌ Google geocoding error:', error);
    return {
      formattedAddress: 'Address not available',
      error: error.message || 'Google geocoding failed'
    };
  }
};

// Request location permission using react-native-permissions
export const requestLocationPermission = async () => {
  try {
    const permission = getLocationPermission();
    console.log('📍 Requesting location permission:', permission);
    
    // First check current status
    const currentStatus = await check(permission);
    console.log('📍 Current permission status:', currentStatus);
    
    if (currentStatus === RESULTS.GRANTED) {
      console.log('✅ Location permission already granted');
      return true;
    }
    
    if (currentStatus === RESULTS.BLOCKED) {
      console.log('❌ Location permission is blocked');
      showLocationEnablePrompt();
      return false;
    }
    
    // Request permission using react-native-permissions first
    const result = await request(permission, {
      title: 'Location Permission',
      message: 'This app needs access to your location for attendance tracking.',
      buttonPositive: 'Grant',
      buttonNegative: 'Deny',
    });
    
    console.log('📍 Permission request result:', result);
    
    switch (result) {
      case RESULTS.GRANTED:
        console.log('✅ Location permission granted');
        
        // Also request permission from react-native-location
        try {
          const locationPermission = await RNLocation.requestPermission({
            ios: 'whenInUse',
            android: {
              detail: 'fine',
              rationale: {
                title: "Location Permission",
                message: "This app needs access to your location for attendance tracking.",
                buttonPositive: "OK",
                buttonNegative: "Cancel"
              }
            }
          });
          console.log('📍 RNLocation permission result:', locationPermission);
          return locationPermission;
        } catch (error) {
          console.error('❌ RNLocation permission error:', error);
          return true; // Fall back to react-native-permissions result
        }
        
      case RESULTS.DENIED:
        console.log('❌ Location permission denied');
        return false;
      case RESULTS.BLOCKED:
        console.log('❌ Location permission blocked');
        showLocationEnablePrompt();
        return false;
      case RESULTS.UNAVAILABLE:
        console.log('❌ Location permission unavailable');
        return false;
      default:
        console.log('❌ Unknown permission result:', result);
        return false;
    }
  } catch (error) {
    console.error('❌ Error requesting location permission:', error);
    return false;
  }
};

// Check if location permission is granted
export const checkLocationPermission = async () => {
  try {
    const permission = getLocationPermission();
    const result = await check(permission);
    console.log('📍 Location permission check result:', result);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('❌ Error checking location permission:', error);
    return false;
  }
};

// Get current location using react-native-location with address (backward compatible)
export const getCurrentLocation = async (includeAddress = true) => {
  // Use high accuracy method for better precision
  return getCurrentLocationHighAccuracy(includeAddress, 2); // 2 attempts for faster response
};

// Get high-accuracy current location with multiple attempts
export const getCurrentLocationHighAccuracy = async (includeAddress = true, maxAttempts = 3) => {
  const locations = [];
  
  try {
    console.log('🎯 Getting high-accuracy location with', maxAttempts, 'attempts...');
    
    // Configure for maximum accuracy
    await RNLocation.configure({
      distanceFilter: 0,
      desiredAccuracy: {
        ios: 'bestForNavigation', // Highest accuracy for iOS
        android: 'highAccuracy'
      }
    });
    
    // Get multiple readings for better accuracy
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`📍 Location attempt ${attempt}/${maxAttempts}...`);
      
      try {
        const location = await RNLocation.getLatestLocation({ 
          timeout: 10000,
          enableHighAccuracy: true, // Force high accuracy
          maximumAge: 0 // Don't use cached location
        });
        
        if (location && location.accuracy) {
          console.log(`✅ Attempt ${attempt} - Accuracy: ${location.accuracy.toFixed(1)}m`);
          
          locations.push({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp || Date.now()
          });
          
          // If we get very good accuracy (< 10m), use it immediately
          if (location.accuracy < 10) {
            console.log('🎯 Excellent accuracy achieved, using this location');
            break;
          }
          } else {
          console.log(`❌ Attempt ${attempt} failed - no location data`);
        }
        
        // Wait between attempts (except last one)
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.log(`❌ Attempt ${attempt} error:`, error.message);
      }
    }
    
    if (locations.length === 0) {
      console.log('❌ All location attempts failed, using fallback');
      return getFallbackLocation(includeAddress);
    }
    
    // Find the most accurate location
    const bestLocation = locations.reduce((best, current) => 
      current.accuracy < best.accuracy ? current : best
    );
    
    console.log('🎯 Best accuracy achieved:', bestLocation.accuracy.toFixed(1), 'meters');
    
    // If we have multiple good readings, average them for even better accuracy
    let finalLocation = bestLocation;
    
    const goodLocations = locations.filter(loc => loc.accuracy < 50); // Less than 50m accuracy
    if (goodLocations.length > 1) {
      console.log('📊 Averaging', goodLocations.length, 'good locations...');
      finalLocation = averageLocations(goodLocations);
      console.log('🎯 Averaged location accuracy estimated:', finalLocation.accuracy.toFixed(1), 'meters');
    }
    
    const result = {
      latitude: finalLocation.latitude,
      longitude: finalLocation.longitude,
      accuracy: finalLocation.accuracy,
      timestamp: finalLocation.timestamp || Date.now(),
    };
    
    // Get address if requested
    if (includeAddress) {
      console.log('🗺️ Fetching precise address for high-accuracy location...');
      const address = await getAddressFromCoordinates(result.latitude, result.longitude);
      result.address = address;
      console.log('📍 High-accuracy location with address:', address.formattedAddress);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ High-accuracy location error:', error);
    return getFallbackLocation(includeAddress);
  }
};

// Average multiple location readings for better accuracy
const averageLocations = (locations) => {
  const totalLat = locations.reduce((sum, loc) => sum + loc.latitude, 0);
  const totalLng = locations.reduce((sum, loc) => sum + loc.longitude, 0);
  const totalAccuracy = locations.reduce((sum, loc) => sum + loc.accuracy, 0);
  
  return {
    latitude: totalLat / locations.length,
    longitude: totalLng / locations.length,
    accuracy: totalAccuracy / locations.length, // Average accuracy
    timestamp: Date.now()
  };
};

// Get location with permission check and device settings validation (HIGH ACCURACY)
export const getLocationWithPermission = async (includeAddress = true, highAccuracy = false) => {
  try {
    console.log('📍 Starting', highAccuracy ? 'HIGH-ACCURACY' : 'standard', 'location service...');
    
    // Step 1: Check if location services are enabled FIRST
    const locationEnabled = await isLocationEnabled();
    console.log('📍 Location services status:', locationEnabled);
    
    if (!locationEnabled) {
      console.log('❌ Location services are disabled');
      
      // Show prompt to enable location services
      setTimeout(() => {
        showLocationEnablePrompt();
      }, 100);
      
      // Return fallback with clear error message
      return getFallbackLocation(includeAddress, 'Location services are disabled');
    }
    
    // Step 2: Request permission using react-native-permissions
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('❌ Location permission denied');
      return getFallbackLocation(includeAddress, 'Location permission denied');
    }
    
    console.log('✅ Location services enabled and permission granted, getting position...');
    
    // Step 3: Get current position with appropriate accuracy method
    let location;
    try {
      if (highAccuracy) {
        console.log('🎯 Using SUPER HIGH ACCURACY mode (3 attempts)...');
        location = await getCurrentLocationHighAccuracy(includeAddress, 3);
      } else {
        console.log('📍 Using standard high accuracy mode...');
        location = await getCurrentLocationHighAccuracy(includeAddress, 2);
      }
    } catch (error) {
      console.log('❌ Location attempt failed, retrying...');
      // Retry once with standard method
      try {
        location = await getCurrentLocationHighAccuracy(includeAddress, 1);
      } catch (retryError) {
        console.log('❌ Second location attempt also failed');
        return getFallbackLocation(includeAddress, 'Could not get location after retries');
      }
    }
    
    console.log('✅ Location service completed:', {
      lat: location.latitude.toFixed(6),
      lng: location.longitude.toFixed(6),
      accuracy: location.accuracy.toFixed(1) + 'm',
      isHighlyAccurate: location.accuracy < 20,
      address: location.address?.formattedAddress?.substring(0, 30) + '...' || 'No address'
    });
    
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: new Date().toISOString(),
      address: location.address,
      error: location.error || null
    };
    
  } catch (error) {
    console.error('❌ Location service fatal error:', error);
    return getFallbackLocation(includeAddress, 'Location service unavailable');
  }
};

// SUPER HIGH ACCURACY - For testing precise location (3+ attempts)
export const getSuperAccurateLocation = async (includeAddress = true) => {
  console.log('🚀 SUPER HIGH ACCURACY MODE - This might take 15-30 seconds...');
  
  try {
    // Configure for absolute maximum accuracy
    await RNLocation.configure({
      distanceFilter: 0,
      desiredAccuracy: {
        ios: 'bestForNavigation', // Highest possible accuracy
        android: 'highAccuracy'
      },
      interval: 500, // Very frequent updates
      fastestInterval: 250
    });
    
    // Get high accuracy location with 5 attempts
    const location = await getCurrentLocationHighAccuracy(includeAddress, 5);
    
    console.log('🎯 SUPER ACCURACY RESULT:', {
      accuracy: location.accuracy?.toFixed(1) + 'm',
      coordinates: `${location.latitude.toFixed(7)}, ${location.longitude.toFixed(7)}`,
      isVeryAccurate: location.accuracy < 10
    });
    
    return location;
    
  } catch (error) {
    console.error('❌ Super accuracy failed:', error);
    return getFallbackLocation(includeAddress, 'Super accuracy failed');
  }
};

// Enhanced fallback location with error message
const getFallbackLocation = (includeAddress = true, errorMessage = 'No location available') => {
  const fallback = {
    latitude: 28.7041, 
      longitude: 77.1025,
    accuracy: 5000,
    timestamp: Date.now(),
    error: errorMessage
  };
  
  if (includeAddress) {
    fallback.address = {
      formattedAddress: `New Delhi, Delhi, India (${errorMessage})`,
      street: errorMessage,
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: 'Fallback',
      error: errorMessage
    };
  }
  
  return fallback;
};

// Check if device location services are enabled (Enhanced with accuracy check)
export const isLocationEnabled = async () => {
  try {
    const testLocation = await RNLocation.getLatestLocation({ 
      timeout: 3000,
      enableHighAccuracy: true,
      maximumAge: 30000
    });
    console.log('DEBUG: testLocation result:', testLocation);
    if (testLocation && testLocation.latitude && testLocation.longitude) {
      return true;
    } else {
      // Fallback: check permission
      const hasPermission = await RNLocation.checkPermission({
        ios: 'whenInUse',
        android: { detail: 'fine' }
      });
      if (hasPermission) {
        Alert.alert(
          'Location Not Available',
          'Location services are enabled but cannot get current position. Please check GPS settings.'
        );
      }
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Enhanced location enable prompt with specific instructions
export const showLocationEnablePrompt = () => {
  Alert.alert(
    'Location Services Required',
    'Location services are currently disabled. Please enable them to get your current location.\n\nSteps to enable:\n• Go to Settings\n• Find Location/GPS settings\n• Turn ON Location Services\n• Set accuracy to High/GPS',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Open Settings', 
        onPress: () => {
          openSettings().catch(() => {
            console.warn('Cannot open settings with react-native-permissions, trying alternative');
            if (Platform.OS === 'android') {
              Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {
                Linking.openSettings();
              });
            } else {
              Linking.openURL('app-settings:').catch(() => {
                Linking.openURL('prefs:root=Privacy&path=LOCATION');
              });
            }
          });
        }
      },
      { 
        text: 'Retry', 
        onPress: async () => {
          // Retry location check
          const enabled = await isLocationEnabled();
          if (!enabled) {
            setTimeout(() => showLocationEnablePrompt(), 1000);
          }
        }
      }
    ]
  );
};

// Format location for display (now includes address)
export const formatLocation = (location) => {
  if (!location) return 'Location not available';
  
  const coords = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  const address = location.address?.formattedAddress || 'Address not available';
  
  return `${coords}\n${address}`;
};

// Check if location is within office radius (example)
export const isWithinOfficeRadius = (userLocation, officeLocation, radiusInMeters = 100) => {
  if (!userLocation || !officeLocation) return false;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = userLocation.latitude * Math.PI / 180;
  const φ2 = officeLocation.latitude * Math.PI / 180;
  const Δφ = (officeLocation.latitude - userLocation.latitude) * Math.PI / 180;
  const Δλ = (officeLocation.longitude - userLocation.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c;
  return distance <= radiusInMeters;
}; 