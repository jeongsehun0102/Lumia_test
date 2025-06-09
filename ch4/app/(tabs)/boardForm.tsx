// app/(tabs)/boardForm.tsx
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

export default function BoardFormScreen() {
  const { token } = useAuth();
  const router = useRouter();

  const [category, setCategory] = useState('칭찬');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }
    try {
      setIsSubmitting(true);
      const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.CREATE_POST}`;
      await axios.post(
        apiUrl,
        { category, title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle('');
      setContent('');
      setCategory('칭찬');
      router.push('/board');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

return (
  <ImageBackground
    source={require('../../assets/images/chat_tree.png')}
    resizeMode="cover"
    style={styles.backgroundImage}
  >
    {/* SafeAreaView 바깥에 위치 */}
    <View style={styles.fixedHeader}>
      <Text style={styles.headerTitle}>Share My Light</Text>
      <Text style={styles.separator}>⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆</Text>
      <View style={styles.categoryContainer}>
        {['칭찬', '격려', '기타'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.categoryButton,
              category === item && styles.categoryButtonActive,
            ]}
            onPress={() => setCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                category === item && styles.categoryTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* SafeArea 적용은 나머지 콘텐츠만 감싸기 */}
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.inputTitle}
              placeholder="제목을 입력하세요"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#A8A8A8"
            />
            <TextInput
              style={styles.inputContent}
              placeholder="당신의 이야기를 들려주세요"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#A8A8A8"
            />
          </ScrollView>

          <TouchableOpacity
            style={styles.fab}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Ionicons name="paper-plane-outline" size={24} color="white" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  </ImageBackground>
);

}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,

  },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 100 : 48,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#A0522D',
    textAlign: 'center',
    marginBottom: 15,
  },
  separator: {
    textAlign: 'center',
    color: '#8FBC8F',
    fontSize: 18,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(222, 239, 222, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(143, 188, 143, 0.5)',
  },
  categoryButtonActive: {
    backgroundColor: '#E74C3C',
    borderColor: '#C0392B',
  },
  categoryText: {
    fontSize: 16,
    color: '#5D4037',
    fontWeight: '500',
  },
  categoryTextActive: {
    fontWeight: 'bold',
    color: '#fff', // 흰색
  },
  scrollContent: { // styles.scroll -> styles.scrollContent로 변경
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100, // FAB와 겹치지 않도록 충분한 하단 패딩
  },
  inputTitle: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: 'rgba(160, 82, 45, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    color: '#333',
  },
  inputContent: {
    fontSize: 16,
    minHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(160, 82, 45, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    padding: 15,
    textAlignVertical: 'top',
    color: '#333',
  },
  fab: {
    position: 'absolute',
    right: 24,

    bottom: Platform.OS === 'ios' ? 90 : 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D9534F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});