import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMusic } from '../../context/MusicContext';
import { schedulePushNotification } from '../notifications';

// 이 파일은 서버 통신 없이, 기기 내 상태만으로 동작하도록 단순화되었습니다.
const SettingsScreen = () => {
  const [isAlarmOn, setIsAlarmOn] = useState(false);
  const [isVibrationOn, setIsVibrationOn] = useState(true);
  const [alarmTime, setAlarmTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const { isMusicOn, setIsMusicOn, selectedMusic, setSelectedMusic } = useMusic();

  // 진동 스위치 토글 로직
  const handleVibrationToggle = (value: boolean) => {
    setIsVibrationOn(value);
    if (value) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // 만약 알림이 켜져있다면, 변경된 진동 설정으로 재예약합니다.
    if (isAlarmOn) {
      schedulePushNotification(alarmTime, value);
    }
  };

  // 시간 변경 로직
  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setAlarmTime(selectedDate);
      // 만약 알림이 켜져있다면, 변경된 시간으로 재예약합니다.
      if (isAlarmOn) {
        schedulePushNotification(selectedDate, isVibrationOn);
      }
    }
  };

  // 알림 스위치가 예약/취소의 유일한 창구입니다.
  const handleAlarmToggle = async (value: boolean) => {
    setIsAlarmOn(value);
    if (value) {
      // 스위치를 켤 때, 현재 설정된 시간으로 예약을 겁니다.
      await schedulePushNotification(alarmTime, isVibrationOn);
    } else {
      // 스위치를 끌 때, 모든 예약을 취소합니다.
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔕 모든 알림이 취소되었습니다.');
    }
  };

  // UI 렌더링 코드
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleRowSticky}>
        <Image source={require('../../assets/images/settings.png')} style={styles.icon} />
        <Text style={styles.title}>설정</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 60, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>배경 음악</Text>
            <Switch value={isMusicOn} onValueChange={setIsMusicOn} />
          </View>
          <View style={styles.musicButtons}>
            <TouchableOpacity onPress={() => setSelectedMusic(1)}>
              <Image source={require('../../assets/images/music1.png')} style={[styles.musicImage, selectedMusic === 1 && styles.selected]} />
              <Text style={styles.musicLabel}>Track I</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMusic(2)}>
              <Image source={require('../../assets/images/music2.png')} style={[styles.musicImage, selectedMusic === 2 && styles.selected]} />
              <Text style={styles.musicLabel}>Track II</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>루미아의 인사</Text>
          <View style={styles.sectionHeader}>
            <Text style={styles.subText}>정기 알림</Text>
            <Switch value={isAlarmOn} onValueChange={handleAlarmToggle} />
          </View>
          <Text style={styles.subText}>지정한 시간에 쪽지 알림을 보내 드려요.</Text>
          <TouchableOpacity 
            style={[styles.timePicker, !isAlarmOn && styles.disabled]} 
            onPress={() => isAlarmOn && setShowPicker(true)} 
            disabled={!isAlarmOn}>
            <Text style={!isAlarmOn && styles.disabledText}>
              {alarmTime.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker value={alarmTime} mode="time" display="spinner" onChange={onTimeChange} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>환경 설정</Text>
          <View style={styles.sectionHeader}>
            <Text style={styles.extraText}>알림 진동</Text>
            <Switch value={isVibrationOn} onValueChange={handleVibrationToggle} />
          </View>
          <Text style={styles.subText}>알림 시 진동을 사용할지 설정할 수 있어요.</Text>
          <View style={styles.divider} />
          <View style={styles.sectionHeader}>
            <Text style={styles.extraText}>앱 버전</Text>
            <Text style={styles.extraText}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>
          <Text style={[styles.subText, { textAlign: 'right' }]}>최신버전 사용 중</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 스타일시트
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F9FB' },
    titleRowSticky: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F9F9FB', zIndex: 10 },
    icon: { width: 40, height: 40, marginRight: 10 },
    title: { fontSize: 26, fontWeight: '600', color: '#222' },
    section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginVertical: 8, marginHorizontal: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
    subText: { fontSize: 14, color: '#888', marginTop: 4 },
    extraText: { fontSize: 16, fontWeight: '500', color: '#444' },
    musicButtons: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginTop: 10 },
    musicImage: { width: 100, height: 100, borderRadius: 14, marginBottom: 8 },
    musicLabel: { textAlign: 'center', fontSize: 14, fontWeight: '500', color: '#444' },
    selected: { borderWidth: 2.5, borderColor: '#6C9EFF', borderRadius: 14 },
    timePicker: { marginTop: 10, padding: 12, backgroundColor: '#F1F3F5', borderRadius: 10, alignItems: 'center' },
    disabled: { backgroundColor: '#E9ECEF' },
    disabledText: { color: '#ADB5BD' },
    divider: { height: 1, backgroundColor: '#E9ECEF', marginVertical: 16 },
});

export default SettingsScreen;