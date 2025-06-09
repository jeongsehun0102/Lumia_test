import { useIsFocused } from '@react-navigation/native';
import { Audio, ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const data = [
  {
    key: 'fire',
    label: '불멍',
    type: 'video',
    video: require('../../assets/videos/fire.mp4'),
    sound: require('../../assets/sounds/fire_sound.mp3'),
  },
  {
    key: 'rain',
    label: '빗멍',
    type: 'video',
    video: require('../../assets/videos/rain.mp4'),
    sound: require('../../assets/sounds/rain_sound.mp3'),
  },
];

export default function HealingScreen() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const viewIndex = useRef(0);
  const isFocused = useIsFocused();

  const playSound = async (index: number) => {
    const item = data[index];
    stopSound();
    const { sound } = await Audio.Sound.createAsync(item.sound, {
      isLooping: true,
    });
    soundRef.current = sound;
    await sound.playAsync();
  };

  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== viewIndex.current) {
        viewIndex.current = newIndex;
        playSound(newIndex);
      }
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  useEffect(() => {
    if (isFocused) {
      playSound(viewIndex.current);
    } else {
      stopSound();
    }
    return () => {
      stopSound();
    };
  }, [isFocused]);

  const renderItem = ({ item }: any) => (
    <View style={styles.page}>
      {item.type === 'video' ? (
        <Video
          source={item.video}
          style={item.key === 'fire' ? styles.mediaFire : styles.mediaRain}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
          isMuted
        />
      ) : (
        <Image source={item.image} style={styles.mediaFire} resizeMode="cover" />
      )}
      <Text style={styles.label}>{item.label}</Text>
    </View>
  );

  return (
    <FlatList
      data={data}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      renderItem={renderItem}
      keyExtractor={(item) => item.key}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewConfigRef.current}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    width: SCREEN_WIDTH,
    height: '117%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mediaFire: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '90%',
  },
  mediaRain: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '80%',
    marginTop: 30, // 필요 시 추가 조정 가능
  },
  label: {
    marginBottom: 50,
    fontSize: 20,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
