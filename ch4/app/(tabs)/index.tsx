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
  Image, // 추가 (모달 내부 터치용)
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
import AnimatedCharacter from '../../components/AnimatedCharacter'; // AnimatedCharacterProps에 onCharacterPress 추가된 버전 사용
import TimeBasedBackground from '../../components/TimeBasedBackground'; // 시간대별 배경 컴포넌트
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { useMusic } from '../../context/MusicContext';

// 아이콘/이미지 경로 정의 (원본 코드 기준)
const icons = {
  shop: require('../../assets/images/shop_icon.png'),
  hospital: require('../../assets/images/music_icon.png'),
  settings: require('../../assets/images/set.png'),
  sun: require('../../assets/images/sun_icon.png'),
  egg: require('../../assets/images/Character_1.png'),
  flower: require('../../assets/images/Flower.png'),
  seed: require('../../assets/images/seeds.png'),
};

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
  const router = useRouter();
  const { isMusicOn } = useMusic();
  const { token } = useAuth();
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const fetchQuestion = useCallback(async (isManuallyTriggered = false) => {
    if (!token) {
      if (isManuallyTriggered) Alert.alert("오류", "로그인이 필요합니다.");
      setCurrentQuestion({ questionId: 0, questionText: "로그인하고 루미아와 대화해보세요!", questionType: "SYSTEM" });
      setIsLoadingQuestion(false);
      setShowNewMessageIndicator(false);
      return;
    }
    setIsLoadingQuestion(true);
    if (isManuallyTriggered) {
        setShowNewMessageIndicator(false);
    }
    console.log('MainScreen: Fetching question...');
    try {
      const response = await axios.get<NewMessageResponseDto>(
        `${API_BASE_URL}${API_ENDPOINTS.GET_QUESTION}`,
        { headers: { Authorization: `Bearer ${token}` } } // ★★★ 토큰 추가 ★★★
      );
      console.log('MainScreen: Question API response:', response.data);
      if (response.data) {
        if (response.data.hasNewMessage && response.data.newMessage) {
          setCurrentQuestion(response.data.newMessage);
          setShowNewMessageIndicator(true);
        } else if (response.data.newMessage) {
            setCurrentQuestion(response.data.newMessage);
            setShowNewMessageIndicator(false);
        } else {
          setCurrentQuestion(null);
          setShowNewMessageIndicator(false);
          if (isManuallyTriggered) Alert.alert("알림", "오늘은 더 이상 새로운 질문이 없어요.");
        }
      } else {
        setCurrentQuestion(null);
        setShowNewMessageIndicator(false);
        if (isManuallyTriggered) Alert.alert("알림", "새로운 이야기를 가져오지 못했어요.");
      }
    } catch (error) {
      console.error("MainScreen: [API 오류] 질문 가져오기 실패:", error);
      setCurrentQuestion(null);
      setShowNewMessageIndicator(false);
      if (isManuallyTriggered) Alert.alert('오류', '질문을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    if (token) {
      fetchQuestion();
    }
  }, [fetchQuestion, token]));

  const handleShopPress = () => {
    console.log('Shop pressed');
    Alert.alert('상점', '상점 기능은 준비 중입니다.');
  };
  const handleHospitalPress = () => { // 원본에서는 music_icon.png 사용
    console.log('Music Icon pressed');
    // Alert.alert('음악 설정', `현재 음악 ${isMusicOn ? 'ON' : 'OFF'}. 설정에서 변경하세요.`);
    router.push('/healing'); // 또는 다른 화면
  };
  const handleSettingsPress = () => {
    router.push('/(tabs)/settings'); // 경로 확인
  };

  const handleOpenQuestionModal = () => {
    if (!currentQuestion) {
      Alert.alert(
        "알림",
        "표시할 질문이 없거나 로딩 중입니다.",
        [{ text: "질문 새로고침", onPress: () => fetchQuestion(true) }, { text: "확인" }]
      );
      return;
    }
    setIsModalVisible(true);
    setShowNewMessageIndicator(false);
  };

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
        { questionId: currentQuestion.questionId, content: userAnswer }, // 백엔드 DTO에 맞게 content 또는 answerText
        { headers: { Authorization: `Bearer ${token}` } } // ★★★ 토큰 추가 ★★★
      );
      Alert.alert('기록 완료!', '네 이야기가 기록되었어.');
      setUserAnswer('');
      setIsModalVisible(false);
      fetchQuestion(false);
    } catch (error) {
      console.error("MainScreen: [API 오류] 답변 저장 실패:", error);
      Alert.alert('오류', '답변 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleCancelAnswer = () => {
    setUserAnswer('');
    setIsModalVisible(false);
  };

  const renderCharacterContent = () => (
    <View style={styles.characterContainer}>
      <AnimatedCharacter
        source={icons.egg}
        style={styles.characterImage}
        onCharacterPress={handleOpenQuestionModal} // ★★★ onCharacterPress로 연결 ★★★
      />
      {showNewMessageIndicator && currentQuestion && (
        <TouchableOpacity style={styles.newMessageIconContainer} onPress={handleOpenQuestionModal}>
          <View style={styles.tempNewMessageIcon}><Text style={styles.tempNewMessageIconText}>!</Text></View>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMessageArea = () => { // 원본 함수의 이름을 renderMessageArea로 변경 (renderMainContent와 구분)
    if (isLoadingQuestion && !isModalVisible) {
      return <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />;
    }
    if (showNewMessageIndicator && currentQuestion) {
      return (
        <View style={styles.messagePromptContainer}>
          <Text style={styles.messagePromptText}>새로운 이야기가 도착했어요!</Text>
          <Text style={styles.messagePromptHintText}>(캐릭터를 눌러 확인해보세요)</Text>
        </View>
      );
    }
    // currentQuestion이 있고, 모달이 안보이고, 새 메시지 인디케이터도 없을 때만 일반 질문 표시
    if (currentQuestion && !isModalVisible && !showNewMessageIndicator) {
      return (
        <TouchableOpacity style={styles.questionBubble} onPress={handleOpenQuestionModal}>
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
        </TouchableOpacity>
      );
    }
    if (!isModalVisible) { // 질문도 없고, 새 메시지 알림도 없을 때 (모달 아닐 때만)
      return (
        <View style={styles.noQuestionContainer}>
          <Text style={styles.noQuestionText}>오늘은 어떤 이야기를 해볼까요?</Text>
          <TouchableOpacity onPress={() => fetchQuestion(true)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>새로운 이야기 찾기</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <TimeBasedBackground> {/* ★★★ 최상위를 TimeBasedBackground로 감싸기 ★★★ */}
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
          <Image source={icons.sun} style={styles.sunIcon} resizeMode="contain" />
          {/* 캐릭터와 메시지 영역을 묶어서 중앙 정렬 */}
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
                      numberOfLines={4}
                      value={userAnswer}
                      onChangeText={setUserAnswer}
                    />
                    <View style={styles.modalButtonContainer}>
                      <Button title="다음에 할래" onPress={handleCancelAnswer} color="#FF6347" />
                      <View style={{width: 20}} />
                      <Button title="마음 속에 담아둘게" onPress={handleSubmitAnswer} disabled={isSubmittingAnswer}/>
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
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', // ★★★ 배경 이미지가 보이도록 transparent로 변경 ★★★
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 25 : 10,
    height: 60,
    // 배경 위에 헤더가 자연스럽게 뜨도록 하려면 absolute positioning도 고려할 수 있으나,
    // 현재는 TimeBasedBackground가 SafeAreaView를 감싸므로, 헤더는 배경 위에 올라옵니다.
    // 필요시 헤더 배경색을 투명하게 하거나 조절: backgroundColor: 'rgba(255,255,255,0.5)'
  },
  headerLeft: { flexDirection: 'row' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  coinContainer: { // 원본 스타일 유지
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 15,
  },
  coinContent: { flexDirection: 'row', alignItems: 'center' },
  coinImage: { width: 18, height: 18, marginRight: 6 },
  coinText: { fontSize: 16, fontWeight: '600', color: '#333' },
  iconButton: { padding: 2, marginLeft: 10 },
  headerIcon: { width: 35, height: 35, resizeMode: 'contain' },
  iconShadow: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 4,
  },
  content: { // 태양 아이콘과 mainInteractionArea를 포함하는 전체 컨텐츠 영역
    flex: 1,
    // alignItems: 'center', // mainInteractionArea에서 중앙 정렬
    // justifyContent: 'center', // mainInteractionArea에서 중앙 정렬
    paddingBottom: 50,
  },
  sunIcon: { // 원본 스타일 유지
    width: 40,
    height: 40,
    position: 'absolute',
    top: 20, // 헤더와 겹치지 않도록 값 조절
    left: 20,
    opacity: 0.8,
    // zIndex: 0, // TimeBasedBackground가 최하단이므로 sunIcon은 그 위에 잘 보임
  },
  mainInteractionArea: { // 캐릭터와 말풍선/메시지 그룹을 묶는 View
    flex: 1, // 이 영역이 content 내에서 최대한의 공간을 차지하도록
    alignItems: 'center', // 캐릭터와 말풍선을 가로 중앙에 배치
    justifyContent: 'center', // 캐릭터와 말풍선을 세로 중앙에 배치
  },
  characterContainer: { // 원본 스타일 유지
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  characterImage: { // 원본 캐릭터 크기 유지
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  newMessageIconContainer: { // 원본 스타일 유지
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 1,
  },
  tempNewMessageIcon: { // 원본 스타일 유지
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  tempNewMessageIconText: { // 원본 스타일 유지
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  messagePromptContainer: { // 원본 스타일 유지 + maxWidth, alignSelf 추가
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
    marginHorizontal: 30, // 좌우 여백
    // marginBottom: 10, // mainInteractionArea에서 중앙 정렬하므로 불필요할 수 있음
    maxWidth: '90%',     // ★★★ 말풍선 최대 너비 ★★★
    alignSelf: 'center', // ★★★ 중앙 정렬 ★★★
  },
  messagePromptText: { // 원본 스타일 유지
    fontSize: 17,
    fontWeight: '600',
    color: '#336699',
    textAlign: 'center',
  },
  messagePromptHintText: { // 원본 스타일 유지
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
  },
  questionBubble: { // 원본 스타일 유지 + maxWidth, alignSelf 추가
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 가독성 위해 약간 더 불투명하게 조정 가능
    paddingVertical: 15, // 원본보다 약간 늘려서 여유있게
    paddingHorizontal: 20,
    borderRadius: 20,    // 원본 14 -> 20
    marginHorizontal: 30, // 화면 좌우 여백으로 너비 간접 제어
    // marginTop: 10,       // characterContainer의 marginBottom으로 조절
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    maxWidth: '90%',    // ★★★ 말풍선 최대 너비 ★★★
    alignSelf: 'center', // ★★★ 중앙 정렬 ★★★
  },
  questionText: { // 원본 스타일 유지
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
  },
  noQuestionContainer: { // 원본 스타일 유지 + maxWidth, alignSelf 추가
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // 배경 약간 조정
    borderRadius: 15,
    marginHorizontal: 30,
    // marginBottom: 10,
    maxWidth: '90%',     // ★★★ 말풍선 최대 너비 ★★★
    alignSelf: 'center', // ★★★ 중앙 정렬 ★★★
  },
  noQuestionText: { // 원본 스타일 유지
    fontSize: 17,
    color: '#527289',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: { // 원본 스타일 유지
    backgroundColor: '#FFB74D',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  retryButtonText: { // 원본 스타일 유지
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 모달 스타일 (원본 코드 스타일 유지)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)'
  },
  modalContent: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8
  },
  modalQuestionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 26
  },
  modalTextInput: {
    width: '100%',
    minHeight: 100,
    maxHeight: 150,
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderColor: '#D0D0D0',
    borderWidth: 1,
    borderRadius: 12,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 30
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
});

export default MainScreen;