// 앱이 통신할 백엔드 서버의 기본 주소 (자신의 PC IP로 수정)
export const API_BASE_URL = 'http://192.168.91.161:8080';

// 실제 백엔드 엔드포인트에 맞게 경로 전부 수정!
export const API_ENDPOINTS = {
  // 인증/계정 관련 (UserController)
  LOGIN: '/api/users/auth/login',
  SIGNUP: '/api/users/auth/signup',
  REFRESH_TOKEN: '/api/users/auth/refresh-token',
  LOGOUT: '/api/users/auth/logout',
  FIND_ID_BY_EMAIL: '/api/users/auth/find-id',
  // 사용자 설정/프로필 (UserController)
  GET_USER_SETTINGS: '/api/users/me/settings',
  UPDATE_USER_SETTINGS: '/api/users/me/settings',
  GET_USER_PROFILE: '/api/users/me/profile',
  UPDATE_USER_PROFILE: '/api/users/me/profile',
  UPDATE_EMAIL: '/api/users/me/email',
  UPDATE_PASSWORD: '/api/users/me/password',

  // 질문 (QuestionController)
  GET_SCHEDULED_QUESTION: '/api/questions/scheduled',      // [수정]
  GET_DAILY_MOOD_QUESTION: '/api/questions/daily-mood',   // [신규]

  // 답변 (AnswerController)
  SAVE_ANSWER: '/api/answers',
  GET_MY_ANSWERS: '/api/answers/my-records',

  
  // === 게시글 (PostController) ===
  GET_POSTS_LIST: '/api/posts/list',
  CREATE_POST: '/api/posts/write',
  GET_POST_DETAIL: (postId: number | string) => `/api/posts/${postId}`,
  UPDATE_POST: (postId: number | string) => `/api/posts/${postId}`,
  DELETE_POST: (postId: number | string) => `/api/posts/${postId}`,

  // === 댓글 (CommentController) ===
  GET_COMMENTS_FOR_POST: (postId: number | string) => `/api/posts/${postId}/comments`,
  CREATE_COMMENT: (postId: number | string) => `/api/posts/${postId}/comments`,
  UPDATE_COMMENT: (commentId: number | string) => `/api/comments/${commentId}`,
  DELETE_COMMENT: (commentId: number | string) => `/api/comments/${commentId}`,
};