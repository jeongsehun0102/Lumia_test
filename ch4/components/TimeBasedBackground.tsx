// components/TimeBasedBackground.tsx
import React from 'react';
import { ImageBackground, ImageRequireSource, StyleSheet } from 'react-native';
// parkImages 객체가 정의된 파일을 정확히 import 해야 합니다.
// 예를 들어 assets/images/index.ts 에 정의되어 있다면:
import { parkImages } from '../assets/images';

const getBackgroundImage = (): ImageRequireSource => {
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
    // justifyContent: 'center', // <<< 이 줄을 주석 처리하거나 삭제합니다.
  },
});

export default TimeBasedBackground;