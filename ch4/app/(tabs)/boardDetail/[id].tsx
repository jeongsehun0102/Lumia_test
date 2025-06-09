// app/boardDetail/[id].tsx
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList, // ImageBackground 추가
  Image,
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
  View,
} from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api'; // 경로 확인 필요
import { useAuth } from '../../context/AuthContext'; // 경로 확인 필요

interface PostDetail {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  userId: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: string;
}

const BoardDetail = () => {
  const { id: postIdFromParams } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { token } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);

  const getCurrentUserId = () => {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload).sub;
    } catch (e) {
      console.error("Failed to decode token or get user ID (boardDetail.tsx):", e);
      return null;
    }
  };
  const currentUserId = getCurrentUserId();

  const fetchPostDetail = useCallback(async () => {
    if (!postIdFromParams) return;
    try {
      const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.GET_POST_DETAIL(postIdFromParams)}`;
      const res = await axios.get<PostDetail>(apiUrl);
      setPost(res.data);
    } catch (error) {
      console.error('게시글 상세 정보 로딩 실패 (boardDetail.tsx):', error);
      Alert.alert("오류", "게시글 정보를 불러오는 데 실패했습니다.");
    }
  }, [postIdFromParams]);

  const fetchComments = useCallback(async () => {
    if (!postIdFromParams) return;
    try {
      const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.GET_COMMENTS_FOR_POST(postIdFromParams)}`;
      const res = await axios.get<Comment[]>(apiUrl);
      setComments(res.data);
    } catch (error) {
      console.error('댓글 목록 로딩 실패 (boardDetail.tsx):', error);
    }
  }, [postIdFromParams]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPostDetail();
      await fetchComments();
      setLoading(false);
    };
    if (postIdFromParams) {
      loadData();
    } else {
      Alert.alert("오류", "게시글 ID가 올바르지 않습니다.");
      if(navigation.canGoBack()) router.back(); else router.replace('/board');
      setLoading(false);
    }
  }, [postIdFromParams, fetchPostDetail, fetchComments, navigation, router]);


  const handleSubmitComment = async () => {
    if (!commentInput.trim() || !token || !postIdFromParams) {
        Alert.alert("입력 오류", "댓글 내용을 입력해주세요.");
        return;
    }
    if (isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.CREATE_COMMENT(postIdFromParams)}`;
      await axios.post(
        apiUrl,
        { content: commentInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentInput('');
      Keyboard.dismiss();
      await fetchComments();
    } catch (error: any) {
      console.error('댓글 작성 실패 (boardDetail.tsx):', error.response?.data || error.message);
      Alert.alert("오류", error.response?.data?.message || "댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditPost = () => {
    if (!postIdFromParams) return;
        router.push(`/boardEdit/${postIdFromParams}` as any);
  };

  const handleDeletePost = async () => {
    if (!token || !postIdFromParams) return;
    Alert.alert("게시글 삭제", "정말로 이 게시글을 삭제하시겠습니까?",
      [{ text: "취소", style: "cancel" },
       { text: "삭제", style: "destructive", onPress: async () => {
            try {
              const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.DELETE_POST(postIdFromParams)}`;
              await axios.delete(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
              Alert.alert("성공", "게시글이 삭제되었습니다.");
              router.back();
            } catch (error: any) {
              console.error('게시글 삭제 실패 (boardDetail.tsx):', error.response?.data || error.message);
              Alert.alert("오류", error.response?.data?.message || "게시글 삭제 중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;
     Alert.alert("댓글 삭제", "정말로 이 댓글을 삭제하시겠습니까?",
      [{ text: "취소", style: "cancel" },
       { text: "삭제", style: "destructive", onPress: async () => {
            try {
              const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.DELETE_COMMENT(commentId)}`;
              await axios.delete(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
              await fetchComments();
            } catch (error: any) {
              console.error('댓글 삭제 실패 (boardDetail.tsx):', error.response?.data || error.message);
              Alert.alert("오류", error.response?.data?.message || "댓글 삭제 실패");
            }
          },
        },
      ]
    );
  };

  const handleUpdateComment = async () => {
    if (!editedCommentContent.trim() || editingCommentId === null || !token) {
        Alert.alert("입력 오류", "수정할 댓글 내용을 입력해주세요.");
        return;
    }
    if(isUpdatingComment) return;
    setIsUpdatingComment(true);
    try {
      const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.UPDATE_COMMENT(editingCommentId)}`;
      await axios.put(apiUrl, { content: editedCommentContent }, { headers: { Authorization: `Bearer ${token}` } });
      setEditingCommentId(null);
      setEditedCommentContent('');
      await fetchComments();
    } catch (error: any) {
      console.error('댓글 수정 실패 (boardDetail.tsx):', error.response?.data || error.message);
      Alert.alert("오류", error.response?.data?.message || "댓글 수정 실패");
    } finally {
        setIsUpdatingComment(false);
    }
  };

  const isPostAuthor = post?.userId === currentUserId;

  const renderCommentItem = ({ item }: { item: Comment }) => {
    const isCommentAuthor = item.userId === currentUserId;
    return (
      <View style={styles.commentBox}>
        <View style={styles.commentHeaderRow}>
            <Text style={styles.commentUser}>{item.userId}</Text>
            <Text style={styles.commentMeta}>
            {' · '}{new Date(item.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
        {editingCommentId === item.id ? (
          <>
            <TextInput value={editedCommentContent} onChangeText={setEditedCommentContent} style={styles.inputInline} multiline placeholder="댓글 수정..." placeholderTextColor="#A0522D" autoFocus />
            <View style={styles.editCommentActions}>
              <TouchableOpacity style={[styles.smallButton, styles.saveButton]} onPress={handleUpdateComment} disabled={isUpdatingComment}>
                <Text style={styles.buttonText}>{isUpdatingComment ? "저장중..." : "저장"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallButton, styles.cancelButton]} onPress={() => { setEditingCommentId(null); setEditedCommentContent(''); }} disabled={isUpdatingComment}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.commentContent}>{item.content}</Text>
            {isCommentAuthor && (
              <View style={styles.iconButtonGroup}>
                <TouchableOpacity onPress={() => { setEditingCommentId(item.id); setEditedCommentContent(item.content); }} style={styles.iconButton}>
                    <Feather name="edit-3" size={18} color="#8FBC8F" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={styles.iconButton}>
                    <Feather name="trash-2" size={18} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.loadingOrErrorContainer}>
        <ImageBackground
          source={require('../../assets/images/chat_tree.png')} // 로딩 중에도 배경 유지
          resizeMode="cover"
          style={styles.backgroundImageFill}
        >
            <View style={styles.screenOverlayForLoading} />
            <ActivityIndicator size="large" color="#A0522D" />
            <Text style={styles.loadingText}>정보를 불러오는 중...</Text>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  if (!postIdFromParams) { // 이 부분은 useEffect에서 이미 처리하지만, 방어적 코드로 둡니다.
    return (
      <SafeAreaView style={styles.loadingOrErrorContainer}>
         <ImageBackground
          source={require('../../assets/images/chat_tree.png')}
          resizeMode="cover"
          style={styles.backgroundImageFill}
        >
            <View style={styles.screenOverlayForLoading} />
            <Text style={styles.errorText}>게시글 정보를 불러올 수 없습니다.</Text>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/images/chat_tree.png')} // 경로 확인!
        resizeMode="cover"
        style={styles.backgroundImageFill}
      >
        <View style={styles.screenOverlay} />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <FlatList
            ListHeaderComponent={() => (
              <View style={styles.postOuterContainer}>
                <View style={styles.postInnerContainer}>
                    <View style={styles.titleRow}>
                        <View style={styles.categoryBadge}>
                        {/* 예시: 카테고리 옆에 작은 사과 아이콘 */}
                        <Image source={require('../../assets/images/chat_apple.png')} style={styles.smallAppleIcon} />
                        <Text style={styles.categoryText}>{post.category}</Text>
                        </View>
                        <Text style={styles.title}>{post.title}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>작성자: {post.userId}</Text>
                        <Text style={styles.metaText}>
                        {new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                    </View>

                    {isPostAuthor && (
                        <View style={styles.authorActionsContainer}>
                        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEditPost}>
                            <Feather name="edit" size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>수정</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeletePost}>
                            <Feather name="trash" size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>삭제</Text>
                        </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.contentDivider} />
                    <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContentContainer}>
                        <Text style={styles.body}>{post.content}</Text>
                    </ScrollView>
                    <View style={styles.contentDivider} />
                    <Text style={styles.commentsTitle}>댓글 {comments.length}개</Text>
                </View>
              </View>
            )}
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.commentsListContainer}
            ListEmptyComponent={
              <View style={styles.emptyCommentsContainer}>
                  <Text style={styles.emptyCommentsText}>아직 댓글이 없어요. 첫 댓글을 남겨보세요!</Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
          />

          {editingCommentId === null && (
            <View style={styles.commentInputSection}>
              <TextInput
                placeholder="따뜻한 댓글을 남겨주세요 :)"
                style={styles.input}
                value={commentInput}
                onChangeText={setCommentInput}
                multiline
                placeholderTextColor="#B08D57"
              />
              <TouchableOpacity
                style={[styles.submitButton, (isSubmittingComment || !commentInput.trim()) && styles.submitButtonDisabled]}
                onPress={handleSubmitComment}
                disabled={isSubmittingComment || !commentInput.trim()}
              >
                <Text style={styles.submitButtonText}>{isSubmittingComment ? "등록중" : "등록"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default BoardDetail;

// 스타일 정의
const styles = StyleSheet.create({
  safeArea: { // 기존 container 역할
    flex: 1,
  },
  backgroundImageFill: { // ImageBackground에 적용
    flex: 1,
  },
  screenOverlay: { // 메인 화면 반투명 오버레이
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 247, 240, 0.85)', // 따뜻한 크림색 반투명
    zIndex: 0, // 내용물보다 뒤에 있도록
  },
  screenOverlayForLoading: { // 로딩/에러 화면용 오버레이 (좀 더 불투명하게)
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 247, 240, 0.95)',
    zIndex: 0,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    zIndex: 1, // 오버레이 위에 있도록
  },
  loadingOrErrorContainer: { // 로딩 또는 에러 시 전체 화면 컨테이너
    flex: 1,
    // justifyContent: 'center', // ImageBackground가 flex:1을 가지므로 여기선 불필요
    // alignItems: 'center',
  },
  loadingText: { // 로딩 중 텍스트 (ActivityIndicator 아래)
      marginTop: 15,
      fontSize: 16,
      color: '#A0522D',
      textAlign: 'center',
      zIndex: 1, // 오버레이 위에
  },
  errorText: { // 에러 메시지 텍스트
    color: '#A0522D',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
    zIndex: 1, // 오버레이 위에
  },
  postOuterContainer: { // ListHeaderComponent의 루트 View, 패딩 등 외부 스타일 담당
    // backgroundColor: 'rgba(255,255,255,0.7)', // 게시글 내용 영역 배경 (선택 사항)
    // marginHorizontal: 10, // 좌우 여백 (선택 사항)
    // borderRadius: 10, // 모서리 둥글게 (선택 사항)
    // marginTop: 10, // 상단 여백 (선택 사항)
    // paddingBottom: 20,
  },
  postInnerContainer: { // 실제 게시글 컨텐츠들을 감싸는 역할
    backgroundColor: 'rgba(255, 253, 250, 0.75)', // 내용을 위한 살짝 불투명한 배경
    marginHorizontal: 15,
    borderRadius: 15,
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#B08D57',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  titleRow: {
    paddingHorizontal: 15, // InnerContainer 내부 패딩
    paddingTop: 5,      // InnerContainer 내부 패딩
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row', // 아이콘과 텍스트를 가로로 배열
    alignItems: 'center',
    backgroundColor: '#FFDAB9',
    paddingVertical: 5,
    paddingHorizontal: 10, // 아이콘 들어갈 공간 고려
    borderRadius: 12,
    marginRight: 10,
  },
  smallAppleIcon: { // 카테고리 배지 옆 작은 사과
    width: 14,
    height: 14,
    marginRight: 5,
  },
  categoryText: {
    fontSize: 13,
    color: '#A0522D',
    fontWeight: '600',
  },
  title: {
    fontSize: 24, // 약간 줄임
    fontWeight: 'bold',
    color: '#5D4037',
    flexShrink: 1,
  },
  metaRow: {
    paddingHorizontal: 15, // InnerContainer 내부 패딩
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E0D0',
    paddingBottom: 12,
  },
  metaText: {
    fontSize: 12, // 약간 줄임
    color: '#8C7B70',
  },
  authorActionsContainer: {
    paddingHorizontal: 15, // InnerContainer 내부 패딩
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginVertical: 10, // 간격 조정
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#8FBC8F',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13, // 약간 줄임
    fontWeight: '600',
    marginLeft: 5,
  },
  contentDivider: {
    marginHorizontal: 15, // InnerContainer 내부 패딩
    height: 1,
    backgroundColor: '#F0E0D0',
    marginVertical: 15, // 간격 조정
  },
  bodyScroll: { // 게시글 본문 내용이 길 경우를 대비한 ScrollView
    maxHeight: 300, // 본문 영역 최대 높이 제한 (선택 사항)
  },
  bodyContentContainer: { // bodyScroll의 contentContainerStyle
     paddingHorizontal: 15, // InnerContainer 내부 패딩
  },
  body: {
    fontSize: 16, // 약간 줄임
    color: '#6B4F4F',
    lineHeight: 26, // 줄간격 조정
  },
  commentsTitle: {
    fontSize: 18, // 약간 줄임
    fontWeight: 'bold',
    marginTop: 20, // 간격 조정
    marginBottom: 16,
    color: '#5D4037',
    paddingHorizontal: 15, // InnerContainer 내부 패딩
  },
  commentsListContainer: { // FlatList의 contentContainerStyle
    paddingHorizontal: 15, // 화면 좌우 여백
    paddingBottom: Platform.OS === 'ios' ? 170 : 150,
  },
  commentBox: {
    marginBottom: 16,
    padding: 15, // 패딩 약간 줄임
    backgroundColor: 'rgba(255, 250, 245, 0.85)', // 좀 더 불투명하게
    borderRadius: 10, // 모서리 약간 줄임
    borderWidth: 1,
    borderColor: '#F5E5D5', // 테두리 색 조정
    shadowColor: '#B08D57',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  commentUser: {
    fontSize: 14, // 약간 줄임
    fontWeight: 'bold',
    color: '#A0522D',
  },
  commentMeta: {
    fontSize: 11, // 약간 줄임
    color: '#B08D57',
    marginLeft: 4,
  },
  commentContent: {
    fontSize: 14, // 약간 줄임
    color: '#6B4F4F',
    lineHeight: 21, // 줄간격 조정
  },
  iconButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8, // 간격 약간 줄임
    gap: 12, // 간격 약간 줄임
  },
  iconButton: {
    padding: 4,
  },
  inputInline: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 거의 불투명
    color: '#5D4037',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0CFC0', // 테두리 색 조정
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14, // 약간 줄임
    minHeight: 50, // 높이 조정
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  editCommentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: '#66BB6A',
  },
  cancelButton: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  commentInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E0D0',
    backgroundColor: 'rgba(255, 247, 240, 0.95)', // 거의 불투명
    // marginBottom 제거 (KeyboardAvoidingView가 핸들)
  },
  input: { // 댓글 입력 TextInput
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0CFC0',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginRight: 10,
    color: '#5D4037',
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: '#D9534F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#FFB88C',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyCommentsContainer: {
      paddingVertical: 30,
      alignItems: 'center',
  },
  emptyCommentsText: {
      color: '#B08D57',
      fontSize: 15,
  }
});
