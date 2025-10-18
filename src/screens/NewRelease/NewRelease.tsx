import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  View,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import AppBar from '../../AppBar/AppBar';
import HomeHeader from '../HomeHeader/HomeHeader';
import axios from 'axios';
import { api } from 'Spre_Mobile_App/src/helpers/api/api';
import { getDataJson } from '../../../src/helpers/api/Asyncstorage';

const NewRelease = () => {
  const [moviearray, setMovieArray] = useState([]);
  const [user, setUser] = useState({ token: '' });
  const [cats, setCats] = useState([]);
  const token = user?.token;
  const navigation = useNavigation();
  const config = {
    headers: {
      mobileAppByPassIVAndKey:
        'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
      username: 'SpredMediaAdmin',
      password: 'SpredMediaLoveSpreding@2023',
      Authorization: `Bearer ${token}`,
    },
  };
  useEffect(() => {
    getMovies();
  }, [token]);
  const getMovies = async () => {
    try {
      let response = await axios.get(api.getAllMovies, config);
      setMovieArray(response?.data?.data);
    } catch (error) {}
  };
  // Filter for new releases and recommendations
  const newReleases = moviearray
    .slice()
    .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
    .slice(0, 10);
  const recommended = moviearray.slice(0, 10);
  return (
    <View
      style={{
        flexDirection: 'column',
        backgroundColor: '#353535',
        flex: 1,
        paddingTop: 20,
      }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, paddingBottom: 10 }}
      >
        <View style={{ backgroundColor: '#353535', paddingHorizontal: 10 }}>
          <View style={{ height: 20 }} />
          {/* first slider starts here */}
          {newReleases[0] && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PlayVideos', { item: newReleases[0] })
              }
            >
              <View
                style={{
                  height: 212,
                  backgroundColor: '#ffffff',
                  borderRadius: 5,
                }}
              >
                <Image
                  style={{
                    resizeMode: 'cover',
                    justifyContent: 'center',
                    height: 212,
                  }}
                  source={{ uri: newReleases[0]?.thumbnailUrl }}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <View style={{ height: 20 }} />
      {/* New Releases */}
      <Text
        style={{
          fontWeight: '700',
          fontSize: 14,
          color: '#ffffff',
          paddingHorizontal: 12,
        }}
      >
        New Releases
      </Text>
      <ScrollView
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 10,
          justifyContent: 'center',
          alignItems: 'center',
          height: 171,
        }}
      >
        {newReleases.map(item => (
          <TouchableOpacity
            key={item.key}
            onPress={() => navigation.navigate('PlayVideos', { item })}
          >
            <Image
              source={{ uri: item?.thumbnailUrl }}
              style={{
                width: 100,
                height: 170,
                resizeMode: 'cover',
                marginHorizontal: 8,
                marginVertical: 12,
              }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Recommendations */}
      <Text
        style={{
          fontWeight: '700',
          fontSize: 14,
          color: '#ffffff',
          paddingHorizontal: 12,
        }}
      >
        Recommendations
      </Text>
      <ScrollView
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 10,
          justifyContent: 'center',
          alignItems: 'center',
          height: 171,
        }}
      >
        {recommended.map(item => (
          <TouchableOpacity
            key={item.key}
            onPress={() => navigation.navigate('PlayVideos', { item })}
          >
            <Image
              source={{ uri: item?.thumbnailUrl }}
              style={{
                width: 100,
                height: 170,
                resizeMode: 'cover',
                marginHorizontal: 8,
                marginVertical: 12,
              }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default NewRelease;

const styles = StyleSheet.create({});
