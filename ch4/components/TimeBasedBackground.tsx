
import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { parkImages } from '../assets/images'; // 경로는 네 구조에 맞게 수정해줘

const getBackgroundImage = () => {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 6) return parkImages.night;
  if (hour >= 6 && hour < 12) return parkImages.morning;
  if (hour >= 12 && hour < 18) return parkImages.day;
  return parkImages.evening;
};

const TimeBasedBackground = ({ children }: { children: React.ReactNode }) => {
  const bgImage = getBackgroundImage();

  return (
    <ImageBackground source={bgImage} style={styles.background}>
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
});

export default TimeBasedBackground;
