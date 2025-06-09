// components/MusicController.tsx
import { Audio } from 'expo-av';
import { useEffect } from 'react';
// eslint-disable-next-line import/namespace
import { useMusic } from '../context/MusicContext';

const MusicController = () => {
  const { isMusicOn, selectedMusic, isReady, backgroundSoundRef } = useMusic();

  useEffect(() => {
    if (!isReady) return;

    const manageMusic = async () => {
      // 기존 사운드 언로드
      if (backgroundSoundRef.current) {
        await backgroundSoundRef.current.stopAsync();
        await backgroundSoundRef.current.unloadAsync();
        backgroundSoundRef.current = null;
      }

      if (!isMusicOn) return;

      const musicFile =
        selectedMusic === 1
          ? require('../assets/sounds/music1.mp3')
          : require('../assets/sounds/music2.mp3');

      try {
        const { sound } = await Audio.Sound.createAsync(musicFile, {
          isLooping: true,
          volume: 1.0,
        });

        backgroundSoundRef.current = sound;

        await sound.playAsync();
      } catch (e) {
        console.warn('배경음악 로드/재생 실패:', e);
      }
    };

    manageMusic();

    return () => {
      // 언마운트 시 정리
      if (backgroundSoundRef.current) {
        backgroundSoundRef.current.stopAsync();
        backgroundSoundRef.current.unloadAsync();
        backgroundSoundRef.current = null;
      }
    };
  }, [isMusicOn, selectedMusic, isReady]);

  return null;
};

export default MusicController;

