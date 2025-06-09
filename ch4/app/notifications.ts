// app/notifications.ts

import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

// 알림 권한을 요청하고, 안드로이드용 채널을 설정하는 함수입니다.
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('알림 권한 필요', '알림을 받으려면 알림 권한을 허용해야 합니다.');
    return false;
  }
  return true;
}

// '매일 반복' 알림을 예약하는 함수입니다.
export async function schedulePushNotification(date: Date, vibrate: boolean) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const trigger: Notifications.CalendarTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    hour: date.getHours(),
    minute: date.getMinutes(),
    repeats: true,
  };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌞 루미아의 인사',
      body: '오늘 하루도 수고했어요! 마음은 잘 돌보고 있나요?',
      sound: true,
      vibrate: vibrate ? [0, 250, 250, 250] : undefined,
    },
    trigger,
  });

  console.log(`✅ [예약 완료] ID: ${id}, 매일 ${date.getHours()}시 ${date.getMinutes()}분에 반복됩니다.`);
}

// 앱이 실행 중일 때 알림이 오면 어떻게 처리할지 설정합니다.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});