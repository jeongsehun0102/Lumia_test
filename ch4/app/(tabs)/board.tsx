import { useIsFocused } from '@react-navigation/native'; // 이 부분 꼭 추가!
import axios from 'axios';
import { useRouter } from 'expo-router'; // useFocusEffect 추가
import React, { useCallback, useEffect, useState } from 'react'; // useCallback 추가
import {
  Dimensions,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

const PAGE_SIZE = 3;

interface PostItem {
  id: number;
  title: string;
  category: string;
  userId: string;
}

const BoardScreen = () => {
  const [data, setData] = useState<PostItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const isFocused = useIsFocused();  // 화면 포커스 상태 체크

  // fetchData 함수를 useCallback으로 감싸서 불필요한 재생성을 방지합니다.
  // setData, setTotalPages는 React에 의해 안정성이 보장되므로 의존성 배열에 추가할 필요가 없습니다.
  const fetchData = useCallback(async (pageNum: number) => {
    console.log(`Fetching data for page: ${pageNum}`); // 데이터 요청 시 로그 추가
    try {
      const res = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.GET_POSTS_LIST}`, {
        params: { page: pageNum, size: PAGE_SIZE, sort: 'id,DESC' },
      });
      setData(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('게시글 목록 로딩 실패:', error);
      // 에러 발생 시 totalPages를 초기화하거나 사용자에게 알림을 줄 수 있습니다.
      // setTotalPages(0);
    }
  }, []); // API_BASE_URL, API_ENDPOINTS, PAGE_SIZE는 외부 상수이므로 의존성 배열이 비어있어도 괜찮습니다.

  // 페이지 번호가 변경될 때 데이터 가져오기
  useEffect(() => {
    if (isFocused) {
      fetchData(page);
    }
  }, [page, isFocused]);

  const MAX_PAGE_BUTTONS = 5;

  const getPageButtons = () => {
    let start = Math.max(0, page - Math.floor(MAX_PAGE_BUTTONS / 2));
    let end = start + MAX_PAGE_BUTTONS;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(0, end - MAX_PAGE_BUTTONS);
    }

    const pages = [];
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/chat_tree.png')}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.overlay} />
        <View style={styles.backgroundApplesContainer}>
          {data.map((item, index) => (
            <View
              key={`bg-apple-${item.id}`}
              style={[
                styles.backgroundAppleWrapper,
                {
                  top: 240 + index * 70,
                  left: 90 + (index % 2) * 180,
                },
              ]}
            >
              <Image
                source={require('../../assets/images/chat_apple.png')}
                style={styles.backgroundAppleIcon}
              />
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.listContainer}>
          {data.length > 0 ? (
            data.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/boardDetail/${item.id}`)}
                style={styles.postItem}
              >
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postCategory}>카테고리: {item.category}</Text>
                <Text style={styles.postUser}>작성자: {item.userId}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyMessage}>게시글이 없습니다.</Text>
          )}
        </ScrollView>

        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => page > 0 && setPage(page - 1)}
            style={styles.arrowButton}
            disabled={page === 0}
          >
            <Text style={styles.arrowText}>{'<'}</Text>
          </TouchableOpacity>

          {getPageButtons().map((pageIndex) => (
            <TouchableOpacity
              key={pageIndex}
              onPress={() => setPage(pageIndex)}
              style={[
                styles.pageButton,
                page === pageIndex && styles.pageButtonActive,
              ]}
            >
              <Text style={styles.pageButtonText}>{pageIndex + 1}</Text>
            </TouchableOpacity>

          ))}
          <TouchableOpacity
            onPress={() => page < totalPages - 1 && setPage(page + 1)}
            style={styles.arrowButton}
            disabled={page === totalPages - 1}
          >
            <Text style={styles.arrowText}>{'>'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => router.push('/boardForm')}
        >
          <Text style={styles.floatingButtonText}>＋</Text>
        </TouchableOpacity>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default BoardScreen;

// ... styles 객체는 이전과 동일하게 유지 ...
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 0,
  },
  background: {
    top: -60,
    width,
    height,
    // justifyContent: 'center', // space-between 등으로 변경하여 전체 영역 활용 고려
    justifyContent: 'space-between', // 페이지네이션, 목록 등의 배치를 위해
    alignItems: 'center',
    paddingBottom: 180,
  },
  backgroundApplesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 300,
    zIndex: 0,
  },
  backgroundAppleWrapper: {
    position: 'absolute',
  },
  backgroundAppleIcon: {
    width: 50,
    height: 50,
    opacity: 0.8,
  },
  listContainer: {
    width: width * 0.9,
    alignItems: 'center',
    paddingTop: 160,
  },
  postItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  postCategory: {
    fontSize: 14,
    color: '#444',
    marginBottom: 3,
  },
  postUser: {
    fontSize: 12,
    color: '#555',
  },
  emptyMessage: {
    marginTop: 50,
    fontSize: 16,
    color: 'rgba(0,0,0,0.7)',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 10,
    borderRadius: 5,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%',
    bottom: -60,
    zIndex: 1,
  },
  pageButton: {
    marginHorizontal: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(238, 238, 238, 0.85)',
    borderRadius: 10,
  },
  pageButtonActive: {
    backgroundColor: 'rgba(255, 204, 0, 0.85)',
  },
  pageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  arrowButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(221, 221, 221, 0.85)',
    borderRadius: 8,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  floatingButton: {
    position: 'absolute',
    right: 30,
    bottom: 220,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff6666',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 1,
  },
  floatingButtonText: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
});