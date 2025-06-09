// app/(tabs)/chat.tsx
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import character from '@/assets/images/chat_Image.png';
import TimeBasedBackground from '@/components/TimeBasedBackground';

const OPENAI_API_KEY = '???????';

const ChatScreen = () => {
  const [botMessage, setBotMessage] = useState('안녕하세요! 무엇을 도와드릴까요?');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleSend = async () => {
    if (!userInput.trim()) return;
    const userMessage = userInput;
    setUserInput('');
    setLoading(true);
    Keyboard.dismiss();

    try {
      const messagesForAPI = [
        { role: 'system', content: '너는 친절한 도우미야.' },
        { role: 'user', content: userMessage },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: OPENAI_API_KEY,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messagesForAPI,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage =
        data.choices?.[0]?.message?.content?.trim() || '음... 지금은 답변하기 조금 어려워요.';
      setBotMessage(assistantMessage);
    } catch (err) {
      setBotMessage('죄송해요, 오류가 발생했어요. 다시 시도해 주세요!');
    } finally {
      setLoading(false);
    }
  };

  const handlePlusPress = () => {
    Keyboard.dismiss();
  };

  return (
    <TimeBasedBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.transparentHeaderSpacer} />

        <View style={{ flex: 1 }}>
          {/* 캐릭터는 고정된 위치 */}
          <View style={styles.fixedCharacterWrapper} pointerEvents="none">
            <Image source={character} style={styles.botImageLarge} />
          </View>

          {/* 말풍선은 캐릭터 위쪽으로 이동 */}
          <View style={styles.messageContainerAdjusted}>
            <View style={styles.botBubble}>
              {loading ? (
                <ActivityIndicator size="small" color="#555" />
              ) : (
                <Text style={styles.botText}>{botMessage}</Text>
              )}
            </View>
          </View>

          <View style={styles.container}>
            <View style={styles.inputArea}>
              <TouchableOpacity style={styles.plusButton} onPress={handlePlusPress}>
                <Text style={styles.plusText}>-</Text>
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={userInput}
                onChangeText={setUserInput}
                placeholder="답장하기"
                multiline
                placeholderTextColor="#ccc"
              />

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={loading}
              >
                <Text style={styles.sendButtonText}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TimeBasedBackground>
  );
};

const styles = StyleSheet.create({
  transparentHeaderSpacer: {
    height: Platform.OS === 'ios' ? 80 : 35,
    backgroundColor: 'transparent',
  },
  fixedCharacterWrapper: {
    position: 'absolute',
    top: 173,
    left: 200,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  messageContainerAdjusted: {
    marginTop: 90,
    alignItems: 'center',
    paddingHorizontal: 20,
    right: 10,
    zIndex: 11,
  },
  botImageLarge: {
    width: 84,
    height: 114,
  },
  botBubble: {
    backgroundColor: 'rgba(230, 230, 250, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: '80%',
    marginBottom: 8,
  },
  botText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 30,
    marginHorizontal: 10,
    marginBottom: 120,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  plusText: {
    fontSize: 20,
    color: 'white',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    paddingVertical: 8,
     zIndex: 11, // 👈 높게 설정 (덮기 위함)
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default ChatScreen;
