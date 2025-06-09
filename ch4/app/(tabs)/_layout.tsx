// app/(tabs)/_layout.tsx

import { CustomTabBar } from '@/components/navigation/CustomTabBar';
import { Tabs, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import MusicController from '../../components/MusicController';
// eslint-disable-next-line import/namespace
import { MusicProvider, useMusic } from '../../context/MusicContext';
import { registerForPushNotificationsAsync } from '../notifications'; // 필요시 utils로 맞춰도 무방

// 음악 자동 제어 컴포넌트
function MusicRouteController() {
  const pathname = usePathname();
  const { isMusicOn, backgroundSoundRef } = useMusic();
  const mutedPages = ['/healing', '/settings'];
  useEffect(() => {
    const controlMusic = async () => {
      if (!backgroundSoundRef.current) return;

      if (mutedPages.includes(pathname)) {
        await backgroundSoundRef.current.pauseAsync();
      } else if (isMusicOn) {
        const status = await backgroundSoundRef.current.getStatusAsync();
        if ('isLoaded' in status && status.isLoaded && !status.isPlaying) {
          try {
            await backgroundSoundRef.current.playAsync();
          } catch (e) {
            console.warn('음악 재생 실패:', e);
          }
        }
      }
    };

    controlMusic();
  }, [pathname, isMusicOn, backgroundSoundRef]);

  return null; // UI 출력 없음
}

export default function TabLayout() {
  useEffect(() => {
    console.log('TabLayout Mount: Attempting to register for push notifications...');
    registerForPushNotificationsAsync()
      .then(success => console.log('TabLayout Mount: Push notification registration success:', success))
      .catch(error => console.error('TabLayout Mount: Push notification registration error:', error));
  }, []);

  return (
    <MusicProvider>
      <MusicController />
      <MusicRouteController /> {/* 음악 자동 제어 */}
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="records" />
        <Tabs.Screen name="index" />
        <Tabs.Screen name="board" />
        <Tabs.Screen name="profile" />
        {/* settings 탭도 쓸 거면 아래 주석 해제 */}
        {/* <Tabs.Screen name="settings" /> */}
      </Tabs>
    </MusicProvider>
  );
}
