// app/boardEdit/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

interface PostData {
  id: number;
  category: string;
  title: string;
  content: string;
}

export default function BoardEditScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { id: postId } = useLocalSearchParams<{ id: string }>();

  const [category, setCategory] = useState('칭찬');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) {
      Alert.alert('오류', '게시글 ID가 올바르지 않습니다.');
      router.replace('/board');
      return;
    }

    const fetchPost = async () => {
      try {
        const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.GET_POST_DETAIL(postId)}`;
        const res = await axios.get<PostData>(apiUrl);
        const post = res.data;
        setCategory(post.category);
        setTitle(post.title);
        setContent(post.content);
      } catch (err) {
        Alert.alert('오류', '게시글 정보를 불러오는 데 실패했습니다.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (!token || !postId) {
      Alert.alert('오류', '요청에 필요한 정보가 없습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.UPDATE_POST(postId)}`;
      await axios.put(
        apiUrl,
        { category, title, content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      Alert.alert('성공', '게시글이 성공적으로 수정되었습니다.');
      router.push('/board');
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '수정 중 오류 발생');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>게시글 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <Text style={styles.headerTitle}>게시글 수정하기</Text>
        <Text style={styles.separator}>⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆ ⋆</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <View style={styles.categoryContainer}>
                  {['칭찬', '격려', '기타'].map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.categoryButton, category === item && styles.categoryButtonActive]}
                      onPress={() => setCategory(item)}
                    >
                      <Text
                        style={[styles.categoryText, category === item && styles.categoryTextActive]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>제목</Text>
                <TextInput
                  style={styles.input}
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>내용</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="내용을 입력하세요"
                  multiline
                  value={content}
                  onChangeText={setContent}
                  placeholderTextColor="#888"
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.fab, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Ionicons name="paper-plane-outline" size={24} color="white" />
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
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
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 90 : 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A5568',
  },
});
