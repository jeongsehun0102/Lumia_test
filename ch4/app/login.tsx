// app/login.tsx
import axios from 'axios'; // isAxiosError 대신 AxiosError 직접 사용 또는 isAxiosError 유지
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import AnimatedCharacter from '../components/AnimatedCharacter';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api'; // 수정된 경로 사용

const LoginScreen: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login, isLoading: authContextLoading } = useAuth(); // AuthContext의 isLoading 사용
  const [isLoginAttempting, setIsLoginAttempting] = useState(false); // 자체 로그인 시도 로딩 상태

  const handleLogin = async () => {
    if (authContextLoading || isLoginAttempting) return; // 중복 시도 방지

    if (!userId || !password) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoginAttempting(true); // 로그인 시도 시작
    console.log(`[로그인 시도] User ID: ${userId}`);
    const LOGIN_API_URL = `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`;
    console.log("Requesting Login API URL:", LOGIN_API_URL);

    try {
      const response = await axios.post(LOGIN_API_URL, {
        userId: userId,
        password: password
      });

      console.log('[API 응답] 성공 (login.tsx):', response.status, response.data);
      const responseAccessToken = response.data.token;
      const responseRefreshToken = response.data.refreshToken;

      if (responseAccessToken && responseRefreshToken) {
        await login(responseAccessToken, responseRefreshToken); // AuthContext의 login 함수 호출
        // 성공 시 AuthContext 내부에서 (tabs)로 라우팅 처리함
      } else {
        // 이 경우는 서버 응답은 200 OK인데 토큰이 없는 비정상 상황
        Alert.alert('로그인 실패', '서버로부터 유효한 토큰 정보를 받지 못했습니다. (E01)');
        console.error('Login Error: Missing access token or refresh token in response', response.data);
      }

    } catch (error: any) {
      console.error("[API 오류] 로그인 요청 실패 (login.tsx):", error);
      if (axios.isAxiosError(error)) { // Axios 에러인지 확인
        if (error.response) {
          // 서버로부터 응답이 온 경우 (예: 401, 404, 500 등)
          const status = error.response.status;
          const messageFromServer = typeof error.response.data === 'string'
            ? error.response.data
            : (error.response.data?.message || error.response.data?.body || "알 수 없는 서버 오류");

          if (status === 401) { // 아이디 또는 비밀번호 불일치 (백엔드에서 401로 응답한다고 가정)
            Alert.alert('로그인 실패', '아이디 또는 비밀번호가 일치하지 않습니다.');
          } else if (status === 404) {
            Alert.alert('로그인 실패', '로그인 요청 경로를 찾을 수 없습니다. 앱을 업데이트하거나 관리자에게 문의하세요.');
          } else {
            Alert.alert('로그인 실패', messageFromServer + ` (E${status})`);
          }
        } else if (error.request) {
          // 서버로부터 응답을 받지 못한 경우 (네트워크 문제 등)
          Alert.alert('네트워크 오류', '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.');
        } else {
          // 요청 설정 중 오류 발생
          Alert.alert('요청 오류', '로그인 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        // Axios 에러가 아닌 다른 JavaScript 에러
        Alert.alert('로그인 오류', '로그인 처리 중 예기치 않은 오류가 발생했습니다.');
      }
    } finally {
      setIsLoginAttempting(false); // 로그인 시도 종료
    }
  };

  const handleForgotId = () => { Alert.alert('알림', '아이디 찾기 기능은 준비 중입니다.'); };
  const handleForgotPassword = () => { Alert.alert('알림', '비밀번호 찾기 기능은 준비 중입니다.'); };
  const navigateToSignup = () => {
    if (isLoginAttempting || authContextLoading) return; // 작업 중 이동 방지
    router.push('/signup');
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.topDecorContainer}>
          <TouchableOpacity onPress={navigateToSignup} style={styles.cloudTouchable}>
            <ImageBackground source={require('../assets/images/cloud_signin.png')} style={styles.cloudImageBackground} resizeMode="contain">
              <Text style={styles.signInText}>SIGN IN</Text>
            </ImageBackground>
          </TouchableOpacity>
          <View style={styles.characterRow}>
            <AnimatedCharacter source={require('../assets/images/Character_1.png')} style={styles.characterImage}/>
            <AnimatedCharacter source={require('../assets/images/Character_2.png')} style={styles.characterImage}/>
            <AnimatedCharacter source={require('../assets/images/Character_3.png')} style={styles.characterImage}/>
            <AnimatedCharacter source={require('../assets/images/Character_4.png')} style={styles.characterImage}/>
          </View>
          <View style={styles.flowerContainer}>
            <View style={styles.flowerGroup}>
              {Array.from({ length: 3 }).map((_, index) => ( <Image key={`left-flower-${index}`} source={require('../assets/images/Flower.png')} style={styles.flowerImage} /> ))}
            </View>
            <View style={styles.flowerGroup}>
              {Array.from({ length: 3 }).map((_, index) => ( <Image key={`right-flower-${index}`} source={require('../assets/images/Flower.png')} style={styles.flowerImage} /> ))}
            </View>
          </View>
        </View>

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
            <TouchableOpacity onPress={handleForgotId} style={styles.iconButton} disabled={isLoginAttempting || authContextLoading}>
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
              secureTextEntry={true}
              editable={!isLoginAttempting && !authContextLoading}
            />
            <TouchableOpacity onPress={handleForgotPassword} style={styles.iconButton} disabled={isLoginAttempting || authContextLoading}>
              <Text style={styles.iconText}>?</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoginAttempting || authContextLoading}>
            {(isLoginAttempting || authContextLoading) ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>LOG IN</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (기존 login.tsx 스타일은 동일하게 유지) ...
  safeArea: { flex: 1, backgroundColor: '#D0EFFF' },
  scrollViewContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  topDecorContainer: { width: '100%', alignItems: 'center', paddingHorizontal: 20, marginBottom: 5 },
  cloudTouchable: { alignSelf: 'flex-start', marginLeft: 10, marginBottom: 20 },
  cloudImageBackground: { width: 130, height: 85, justifyContent: 'center', alignItems: 'center' },
  signInText: { fontWeight: 'bold', fontSize: 14, color: '#4A4A4A' },
  characterRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '90%', marginBottom: 20 },
  characterImage: { width: 72, height: 72 },
  flowerContainer: { width: '95%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flowerGroup: { flexDirection: 'row' },
  flowerImage: { width: 52, height: 52, resizeMode: 'contain', marginHorizontal: 4 },
  mainContent: { width: '85%', backgroundColor: '#A0D2FF', borderRadius: 35, paddingVertical: 35, paddingHorizontal: 25, alignItems: 'center', marginTop: 10 },
  appTitle: { fontSize: 45, fontWeight: 'bold', color: 'white', marginBottom: 35 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#FFFFE0', borderRadius: 25, height: 55, marginBottom: 18, paddingHorizontal: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#333' },
  iconButton: { paddingLeft: 10 },
  iconText: { fontSize: 18, fontWeight: 'bold', color: '#757575' },
  loginButton: { width: '100%', backgroundColor: '#3CB371', borderRadius: 25, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default LoginScreen;