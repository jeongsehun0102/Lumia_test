// components/AnimatedCharacter.tsx
import React from 'react';
import { Image, ImageRequireSource, ImageStyle, StyleProp, TouchableOpacity } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedCharacterProps {
  source: ImageRequireSource;
  style?: StyleProp<ImageStyle>;
  shakeIntensity?: number;
  shakeDuration?: number;
  onCharacterPress?: () => void; // <<< 부모로부터 받을 클릭 이벤트 핸들러
}

const AnimatedCharacter: React.FC<AnimatedCharacterProps> = ({
  source,
  style,
  shakeIntensity = 8, // 기본값은 팀원 코드 기준으로 조정 (예: 8)
  shakeDuration = 70, // 기본값은 팀원 코드 기준으로 조정 (예: 70)
  onCharacterPress,   // prop으로 받음
}) => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handlePress = () => {
    console.log("AnimatedCharacter: Character pressed internally!");
    // 흔들림 애니메이션 실행
    translateX.value = withSequence(
      withTiming(-shakeIntensity, { duration: shakeDuration, easing: Easing.out(Easing.quad) }),
      withTiming(shakeIntensity, { duration: shakeDuration, easing: Easing.out(Easing.quad) }),
      withTiming(-shakeIntensity / 2, { duration: shakeDuration, easing: Easing.out(Easing.quad) }),
      withTiming(shakeIntensity / 2, { duration: shakeDuration, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: shakeDuration, easing: Easing.out(Easing.quad) })
    );

    // 부모로부터 전달받은 onCharacterPress 함수가 있다면 호출
    if (onCharacterPress) {
      onCharacterPress();
    }
  };

  return (
    // === TouchableOpacity로 감싸서 onPress 연결 ===
    <TouchableOpacity onPress={handlePress} activeOpacity={0.95}>
      <Animated.View style={animatedStyle}>
        <Image source={source} style={style || {}} resizeMode="contain" />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedCharacter;