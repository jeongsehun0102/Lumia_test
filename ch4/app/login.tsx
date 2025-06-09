import axios from 'axios';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import TimeBasedBackground from '../components/TimeBasedBackground';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

const LoginScreen: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading: authContextLoading } = useAuth();
  const [isLoginAttempting, setIsLoginAttempting] = useState(false);

  const [isFindIdModalVisible, setIsFindIdModalVisible] = useState(false);
  const [emailForFindId, setEmailForFindId] = useState('');
  const [foundUserId, setFoundUserId] = useState<string | null>(null);
  const [isFindingId, setIsFindingId] = useState(false);
  const [findIdErrorMessage, setFindIdErrorMessage] = useState<string | null>(null);


  const handleLogin = async () => {
    if (authContextLoading || isLoginAttempting) return;

    if (!userId || !password) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoginAttempting(true);
    const LOGIN_API_URL = `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`;

    try {
      const response = await axios.post(LOGIN_API_URL, { userId, password });
      const { token: responseAccessToken, refreshToken: responseRefreshToken } = response.data;

      if (responseAccessToken && responseRefreshToken) {
        await login(responseAccessToken, responseRefreshToken);
      } else {
        Alert.alert('로그인 실패', '서버로부터 유효한 토큰 정보를 받지 못했습니다. (E01)');
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = typeof error.response?.data === 'string'
          ? error.response?.data
          : error.response?.data?.message || '알 수 없는 서버 오류';

        if (status === 401) {
          Alert.alert('로그인 실패', '아이디 또는 비밀번호가 일치하지 않습니다.');
        } else if (status === 404) {
          Alert.alert('로그인 실패', '로그인 요청 경로를 찾을 수 없습니다.');
        } else {
          Alert.alert('로그인 실패', message + ` (E${status})`);
        }
      } else {
        Alert.alert('로그인 오류', '예기치 않은 오류가 발생했습니다.');
      }
    } finally {
      setIsLoginAttempting(false);
    }
  };

const openFindIdModal = () => {
  setEmailForFindId('');
  setFoundUserId(null);
  setFindIdErrorMessage(null);
  setIsFindIdModalVisible(true);
};

const closeFindIdModal = () => {
  if (isFindingId) return;
  Keyboard.dismiss();
  setIsFindIdModalVisible(false);
};

const handleFindIdByEmail = async () => {
  if (!emailForFindId.trim()) {
    Alert.alert('입력 오류', '이메일 주소를 입력해주세요.');
    return;
  }
  setIsFindingId(true);
  setFoundUserId(null);
  setFindIdErrorMessage(null);
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.FIND_ID_BY_EMAIL}`, { // FIND_ID_BY_EMAIL 엔드포인트 사용
      params: { email: emailForFindId.trim() }
    });
    if (response.data && response.data.userId) {
      setFoundUserId(response.data.userId);
    } else {
      setFindIdErrorMessage(response.data.message || '해당 이메일로 가입된 아이디를 찾을 수 없습니다.');
    }
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
        setFindIdErrorMessage(error.response.data.message || '아이디를 찾는 중 오류가 발생했습니다.');
      } else {
        setFindIdErrorMessage('아이디를 찾는 중 알 수 없는 오류가 발생했습니다.');
      }
      console.error("Error finding ID:", error);
  } finally {
    setIsFindingId(false);
  }
};


  const handleForgotPassword = () => Alert.alert('알림', '비밀번호 찾기 기능은 준비 중입니다.');
  const navigateToSignup = () => {
    if (isLoginAttempting || authContextLoading) return;
    router.push('/signup');
  };

  return (
    <TimeBasedBackground>
      <View style={styles.backgroundOverlay} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={navigateToSignup} style={styles.cloudTouchable}>
            <ImageBackground
              source={require('../assets/images/cloud_signin.png')}
              style={styles.cloudImageBackground}
              resizeMode="contain"
            >
              <Text style={styles.signInText}>SIGN UP</Text>
            </ImageBackground>
          </TouchableOpacity>

          <Image
            source={require('../assets/images/main_character.gif')}
            style={styles.characterImage}
          />

          <View style={styles.mainContent}>
            <Text style={styles.appTitle}>Lumia</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="User ID"
                placeholderTextColor="#A0A0A0"
                value={userId}
                onChangeText={setUserId}
                autoCapitalize="none"
                editable={!isLoginAttempting && !authContextLoading}
              />
              <TouchableOpacity onPress={openFindIdModal} style={styles.iconButton} disabled={isLoginAttempting || authContextLoading}>
                <Text style={styles.iconText}>?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoginAttempting && !authContextLoading}
              />
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.iconButton}
                disabled={isLoginAttempting || authContextLoading}
              >
                <Text style={styles.iconText}>?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoginAttempting || authContextLoading}
            >
              {(isLoginAttempting || authContextLoading) ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>LOG IN</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
{/* --- 아이디 찾기 모달 UI (index.tsx 구조 참고) --- */}
      {isFindIdModalVisible && ( // Modal을 조건부로 렌더링
        // 1. 화면 전체를 덮는 View (index.tsx의 StyleSheet.absoluteFillObject 역할)
        <View style={StyleSheet.absoluteFillObject} pointerEvents="auto">
          <Modal
            animationType="fade"
            transparent={true}
            visible={isFindIdModalVisible} // 실제 visible 상태는 이 Modal의 prop으로 제어
            onRequestClose={closeFindIdModal}
          >
            {/* 2. 모달 배경 및 중앙 정렬을 위한 TouchableOpacity */}
            <TouchableOpacity
              style={modalStyles.modalOverlay} // flex:1, justifyContent/alignItems: center
              activeOpacity={1}
              onPressOut={closeFindIdModal} // 배경 터치 시 닫기
            >
              {/* 3. 실제 모달 콘텐츠를 담는 View (배경 터치 시 닫힘 방지) */}
              <TouchableWithoutFeedback onPress={() => { /* 모달 내부 클릭 시 닫힘 방지 */ }}>
                <View style={modalStyles.modalContent}>
                  <Text style={modalStyles.modalTitle}>아이디 찾기</Text>
                  <Text style={modalStyles.modalSubtitle}>가입 시 사용한 이메일 주소를 입력해주세요.</Text>
                  <TextInput
                    style={modalStyles.modalInput}
                    placeholder="이메일 주소"
                    value={emailForFindId}
                    onChangeText={setEmailForFindId}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isFindingId}
                    placeholderTextColor="#A0A0A0"
                    autoFocus={true} // 모달 열릴 때 자동 포커스
                  />
                  <TouchableOpacity
                    style={[modalStyles.modalButton, (isFindingId || !emailForFindId.trim()) && modalStyles.modalButtonDisabled]}
                    onPress={handleFindIdByEmail}
                    disabled={isFindingId || !emailForFindId.trim()}
                  >
                    {isFindingId ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={modalStyles.modalButtonText}>아이디 찾기</Text>
                    )}
                  </TouchableOpacity>

                  {foundUserId && (
                    <Text style={modalStyles.modalResultText}>
                      회원님의 아이디는 <Text style={modalStyles.modalUserIdText}>{foundUserId}</Text> 입니다.
                    </Text>
                  )}
                  {findIdErrorMessage && (
                    <Text style={modalStyles.modalErrorText}>{findIdErrorMessage}</Text>
                  )}

                  <TouchableOpacity style={modalStyles.modalCloseButton} onPress={closeFindIdModal} disabled={isFindingId}>
                    <Text style={modalStyles.modalCloseButtonText}>닫기</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </TouchableOpacity>
          </Modal>
        </View>
      )}


    </TimeBasedBackground>

    

  );
};



const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 20,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 0,
  },
  cloudTouchable: {
    alignSelf: 'flex-end',
    marginRight:10,
    marginTop: 65,
  },
  cloudImageBackground: {
    width: 90,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    marginTop: 15,
    fontWeight: '700',
    fontSize: 12,
    color: '#2C3E50',
    textAlign: 'center',
    
  },
  characterImage: {
    width: 152,
    height: 152,
    marginTop: 70,
    marginBottom: 30,
    left: 80,
  },
  mainContent: {
    width: '85%',
    backgroundColor: 'rgba(243, 255, 234, 0.79)',
    borderRadius: 55,
    paddingVertical: 35,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#003366',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    zIndex: 1,
  },
  appTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#4CAF50',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 224, 0.95)',
    borderRadius: 30,
    height: 60,
    marginBottom: 22,
    paddingHorizontal: 25,
    elevation: 6,
    shadowColor: '#001f3f',
    shadowOpacity: 0.15,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 18,
    color: '#222',
    fontWeight: '600',
  },
  iconButton: {
    paddingLeft: 12,
  },
  iconText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5A5A5A',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#2E8B57',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    elevation: 8,
    shadowColor: '#004d00',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  loginButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#F0FFF4', // 부드러운 연녹색 배경
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E8B57',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderColor: '#B5EFC0',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalResultText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#2C3E50',
    lineHeight: 22,
  },
  modalUserIdText: {
    fontWeight: '700',
    color: '#388E3C',
  },
  modalErrorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalCloseButton: {
    marginTop: 18,
    paddingVertical: 10,
  },
  modalCloseButtonText: {
    fontSize: 15,
    color: '#00796B',
    fontWeight: '600',
  },
});

export default LoginScreen;