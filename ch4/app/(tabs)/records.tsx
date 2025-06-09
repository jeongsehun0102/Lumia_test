// app/(tabs)/records.tsx
import { Ionicons } from '@expo/vector-icons'; // 아이콘 사용 (선택적)
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

// AnswerResponseDto에 대응하는 프론트엔드 인터페이스
interface AnswerRecord {
  answerId: number;
  questionId: number;
  questionText: string;
  answerText: string;
  emotionTag?: string; // 선택적 필드
  answeredAt: string; // 백엔드에서 LocalDateTime.toString() 등으로 문자열로 올 것임
}

const PAGE_SIZE = 10; // 한 페이지에 보여줄 기록 수

export default function RecordsScreen() {
  const { token } = useAuth();
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [page, setPage] = useState(0); // 현재 페이지 (0부터 시작)
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList<AnswerRecord>>(null); // FlatList 타입 명시

  const fetchRecords = useCallback(async (pageNum: number) => {
    if (!token) {
      // 토큰이 없으면 로딩 중단 또는 사용자에게 알림
      console.log('RecordsScreen: No token available, cannot fetch records.');
      setRecords([]); // 기존 기록 비우기
      setTotalPages(0);
      return;
    }
    setLoading(true);
    try {
      const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.GET_MY_ANSWERS}`;
      console.log(`Fetching records (page: ${pageNum}) from: ${apiUrl}`);
      const response = await axios.get<{ content: AnswerRecord[], totalPages: number }>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: pageNum,
          size: PAGE_SIZE,
          sort: 'answeredAt,DESC', // 답변 시간을 기준으로 내림차순 정렬 (최신순)
        },
      });
      setRecords(response.data.content);
      setTotalPages(response.data.totalPages);
      if (pageNum === 0 && records.length > 0) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error: any) {
      console.error('내 답변 기록 로딩 실패 (records.tsx):', error.response?.data || error.message);
      // 사용자에게 오류 알림 (선택적)
      // Alert.alert("오류", "내 답변 기록을 불러오는 데 실패했습니다.");
      setRecords([]); // 오류 시 기록 비우기
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [token]); // token이 변경될 때마다 fetchRecords 함수 재생성

  // 페이지 번호가 변경될 때마다 데이터 호출
  useEffect(() => {
    fetchRecords(page);
  }, [page, fetchRecords]); // fetchRecords가 token에 의존하므로, token이 바뀔때 재생성된 fetchRecords도 effect를 재실행

  // 화면이 포커스될 때마다 데이터 다시 호출
  useFocusEffect(
    useCallback(() => {
      fetchRecords(0); // 항상 첫 페이지부터 다시 불러오거나, 현재 page를 유지할 수 있음
      setPage(0); // 포커스 시 첫 페이지로 리셋 (선택적)
    }, [fetchRecords]) // fetchRecords 의존
  );
  
  const renderRecordItem = ({ item }: { item: AnswerRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.questionHeader}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#555" style={styles.questionIcon} />
        <Text style={styles.questionText} numberOfLines={2}>{item.questionText}</Text>
      </View>
      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>나의 답변:</Text>
        <Text style={styles.answerText}>{item.answerText}</Text>
      </View>
      <View style={styles.recordFooter}>
        {item.emotionTag && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{item.emotionTag}</Text>
          </View>
        )}
        <Text style={styles.dateText}>
          {new Date(item.answeredAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );

  // 페이지네이션 UI (board.tsx의 getPagination 로직 재활용 가능)
  const getPaginationControls = () => {
    // board.tsx와 유사한 페이지네이션 UI 구성
    // 여기서는 간단히 이전/다음 버튼만 예시로 추가
    if (totalPages <= 1) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
        >
          <Ionicons name="chevron-back" size={24} color={page === 0 ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
        <Text style={styles.pageInfoText}>{`페이지 ${page + 1} / ${totalPages}`}</Text>
        <TouchableOpacity
          onPress={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          style={[styles.pageButton, (page >= totalPages - 1) && styles.pageButtonDisabled]}
        >
          <Ionicons name="chevron-forward" size={24} color={(page >= totalPages - 1) ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>나의 기록</Text>
      </View>
      {loading && records.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={records}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item.answerId.toString()}
          contentContainerStyle={styles.listContentContainer}
          ListFooterComponent={getPaginationControls}
          ListEmptyComponent={
            !loading && records.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>아직 작성한 답변 기록이 없어요.</Text>
                <Text style={styles.emptySubText}>루미아와 대화하고 마음을 기록해보세요!</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F8', // 전체 배경색
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 25 : 10,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentContainer: {
    padding: 16,
    paddingBottom: 80, // 페이지네이션 공간 확보
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start', // 여러 줄일 경우 아이콘과 상단 정렬
    marginBottom: 10,
  },
  questionIcon: {
    marginRight: 8,
    marginTop: 2, // 텍스트와의 미세한 정렬
  },
  questionText: {
    flex: 1, // 텍스트가 길어지면 자동으로 줄바꿈
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    lineHeight: 22,
  },
  answerContainer: {
    marginBottom: 12,
    paddingLeft: 26, // 아이콘 너비만큼 들여쓰기 효과
  },
  answerLabel: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tagBadge: {
    backgroundColor: '#E0EFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#777',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pageButton: {
    padding: 8,
  },
  pageButtonDisabled: {
    // opacity: 0.5, // 비활성화 시 투명도 조절 대신 아이콘 색상으로 구분
  },
  pageInfoText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});