// app/(tabs)/index.tsx
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedCharacter from '../../components/AnimatedCharacter';
import TimeBasedBackground from '../../components/TimeBasedBackground';
 
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
 
import { useMusic } from '../../context/MusicContext';

// 이미지 아이콘 경로
const icons = {
  shop: require('../../assets/images/shop_icon.png'),
  hospital: require('../../assets/images/music_icon.png'),
  settings: require('../../assets/images/set.png'),
  egg: require('../../assets/images/Character_1.png'),
  flower: require('../../assets/images/Flower.png'),
  seed: require('../../assets/images/seeds.png'),
};

// API 타입 정의
interface QuestionDto {
  questionId: number;
  questionText: string;
  questionType: string;
}
interface NewMessageResponseDto {
  hasNewMessage: boolean;
  newMessage: QuestionDto | null;
}

const MainScreen: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDto | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const router = useRouter();
  const { token } = useAuth();
  const { isMusicOn } = useMusic();

  // [수정] 스케줄된 질문을 가져오는 함수
  const fetchScheduledQuestion = useCallback(async () => {
    if (!token) {
      setCurrentQuestion({ questionId: 0, questionText: "로그인하고 루미아와 대화해보세요!", questionType: "SYSTEM" });
      return;
    }
    setIsLoadingQuestion(true);
    try {
      const response = await axios.get<NewMessageResponseDto>(
        `${API_BASE_URL}${API_ENDPOINTS.GET_SCHEDULED_QUESTION}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.hasNewMessage && response.data.newMessage) {
        setCurrentQuestion(response.data.newMessage);
        setShowNewMessageIndicator(true);
      } else {
        setShowNewMessageIndicator(false);
      }
    } catch (error) {
      console.error('스케줄 질문 가져오기 실패:', error);
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [token]);

  // [신규] 데일리 무드 질문을 가져오는 함수
  const fetchDailyMoodQuestion = async () => {
    if (!token) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }
    setIsLoadingQuestion(true);
    setShowNewMessageIndicator(false); // 버튼 누르면 느낌표는 숨김
    try {
      const response = await axios.get<NewMessageResponseDto>(
        `${API_BASE_URL}${API_ENDPOINTS.GET_DAILY_MOOD_QUESTION}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.hasNewMessage && response.data.newMessage) {
        setCurrentQuestion(response.data.newMessage);
        setIsModalVisible(true); // 새 질문을 받으면 바로 모달 열기
      } else {
        // 이미 오늘 데일리 질문을 받은 경우
        Alert.alert("알림", "오늘의 특별한 이야기는 이미 확인했어요. 내일 다시 만나요!");
      }
    } catch (error) {
      Alert.alert('오류', '새로운 이야기를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // 화면이 포커스될 때 스케줄 질문을 확인
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchScheduledQuestion();
      }
    }, [token, fetchScheduledQuestion])
  );

  // 상단 버튼/네비게이션 핸들러
  const handleShopPress = () => Alert.alert('상점', '상점 기능은 준비 중입니다.');
  const handleHospitalPress = () => router.push('/healing');
  const handleSettingsPress = () => router.push('/settings');

  // 캐릭터 클릭 시 질문 모달 열기
  const handleOpenQuestionModal = () => {
    if (currentQuestion) {
      setIsModalVisible(true);
      setShowNewMessageIndicator(false);
    } else {
      Alert.alert(
        "알림",
        "아직 도착한 이야기가 없어요. 새로운 이야기를 찾아볼까요?",
        [
          { text: "찾아보기", onPress: fetchDailyMoodQuestion },
          { text: "괜찮아요", style: 'cancel' }
        ]
      );
    }
  };

  // 답변 제출 로직
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      Alert.alert('알림', '답변을 입력해주세요.');
      return;
    }
    if (!currentQuestion || !token) {
      Alert.alert('오류', '답변을 저장하기 위한 정보가 부족합니다.');
      return;
    }
    setIsSubmittingAnswer(true);
    try {
      await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.SAVE_ANSWER}`,
        {
            questionId: currentQuestion.questionId,
            answerText: userAnswer, // 백엔드 DTO에 맞게 'answerText'로 수정
            emotionTag: 'DEFAULT' // 필요시 감정 태그 추가
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('기록 완료!', '네 이야기가 기록되었어.');
      setUserAnswer('');
      setIsModalVisible(false);
      setCurrentQuestion(null); // 답변 완료 후 현재 질문 비우기
    } catch (error) {
      Alert.alert('오류', '답변 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // 답변 취소
  const handleCancelAnswer = () => {
    setUserAnswer('');
    setIsModalVisible(false);
  };

  // 캐릭터 렌더링
  const renderCharacterContent = () => (
    <View style={styles.characterContainer}>
      <AnimatedCharacter
        source={icons.egg}
        style={styles.characterImage}
        onCharacterPress={handleOpenQuestionModal}
      />
      {showNewMessageIndicator && (
        <TouchableOpacity style={styles.newMessageIconContainer} onPress={handleOpenQuestionModal}>
          <View style={styles.tempNewMessageIcon}>
            <Text style={styles.tempNewMessageIconText}>!</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  // 메시지 영역 렌더링
  const renderMessageArea = () => {
    if (isLoadingQuestion && !isModalVisible) {
      return <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />;
    }
    if (currentQuestion && !isModalVisible) {
      return (
        <TouchableOpacity style={styles.questionBubble} onPress={handleOpenQuestionModal}>
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
        </TouchableOpacity>
      );
    }
    if (!isModalVisible) {
      return (
        <View style={styles.noQuestionContainer}>
          <Text style={styles.noQuestionText}>오늘은 어떤 이야기를 해볼까요?</Text>
          <TouchableOpacity onPress={fetchDailyMoodQuestion} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>새로운 이야기 찾기</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };
  
  return (
    <TimeBasedBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.coinContainer}>
              <View style={styles.coinContent}>
                <Image source={icons.seed} style={styles.coinImage} />
                <Text style={styles.coinText}>210</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleShopPress} style={styles.iconButton}>
              <View style={styles.iconShadow}><Image source={icons.shop} style={styles.headerIcon} /></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleHospitalPress} style={styles.iconButton}>
              <View style={styles.iconShadow}><Image source={icons.hospital} style={styles.headerIcon} /></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSettingsPress} style={styles.iconButton}>
              <View style={styles.iconShadow}><Image source={icons.settings} style={styles.headerIcon} /></View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.mainInteractionArea}>
            {renderCharacterContent()}
            {renderMessageArea()}
          </View>
        </View>
        {isModalVisible && currentQuestion && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="auto">
            <Modal
              animationType="fade"
              transparent={true}
              visible={isModalVisible}
              onRequestClose={handleCancelAnswer}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={() => {
                  if (!isSubmittingAnswer) {
                    Keyboard.dismiss();
                    handleCancelAnswer();
                  }
                }}
              >
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalQuestionText}>{currentQuestion.questionText}</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      placeholder="네 생각을 편하게 이야기해줘..."
                      placeholderTextColor="#888"
                      multiline
                      value={userAnswer}
                      onChangeText={setUserAnswer}
                    />
                    <View style={styles.modalButtonContainer}>
                      <Button title="다음에 할래" onPress={handleCancelAnswer} color="#FF6347" />
                      <View style={{ width: 20 }} />
                      <Button title="마음 속에 담아둘게" onPress={handleSubmitAnswer} disabled={isSubmittingAnswer} />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </TouchableOpacity>
            </Modal>
          </View>
        )}
      </SafeAreaView>
    </TimeBasedBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 25 : 10, height: 60 },
  headerLeft: { flexDirection: 'row' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  coinContainer: { backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 15 },
  coinContent: { flexDirection: 'row', alignItems: 'center' },
  coinImage: { width: 18, height: 18, marginRight: 6 },
  coinText: { fontSize: 16, fontWeight: '600', color: '#333' },
  iconButton: { padding: 2, marginLeft: 10 },
  headerIcon: { width: 35, height: 35, resizeMode: 'contain' },
  iconShadow: { backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 30, padding: 4 },
  content: { flex: 1, paddingBottom: 50 },
  mainInteractionArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  characterContainer: { position: 'relative', alignItems: 'center', marginBottom: 10, marginTop: 320 },
  characterImage: { width: 120, height: 120, resizeMode: 'contain' },
  newMessageIconContainer: { position: 'absolute', top: -5, right: -5, zIndex: 1 },
  tempNewMessageIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  tempNewMessageIconText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  questionBubble: { backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 20, marginHorizontal: 30, minHeight: 60, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, maxWidth: '90%', alignSelf: 'center' },
  questionText: { fontSize: 16, color: '#333333', textAlign: 'center', lineHeight: 22 },
  noQuestionContainer: { alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 15, marginHorizontal: 30, maxWidth: '90%', alignSelf: 'center' },
  noQuestionText: { fontSize: 17, color: '#527289', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
  retryButton: { backgroundColor: '#FFB74D', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  modalContent: { width: '90%', maxWidth: 380, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 4.65, elevation: 8 },
  modalQuestionText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 25, textAlign: 'center', lineHeight: 26 },
  modalTextInput: { width: '100%', minHeight: 100, maxHeight: 150, padding: 15, backgroundColor: '#F9F9F9', borderColor: '#D0D0D0', borderWidth: 1, borderRadius: 12, textAlignVertical: 'top', fontSize: 16, lineHeight: 22, color: '#333', marginBottom: 30 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
});

export default MainScreen;