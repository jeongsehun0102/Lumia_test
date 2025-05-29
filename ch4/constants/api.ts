// app/constants/api.ts
export const API_BASE_URL = 'http://?.?.?.?:8080'; // 서버 주소

export const API_ENDPOINTS = {
  LOGIN: '/api/users/auth/login', // 수정된 경로
  SIGNUP: '/api/users/auth/signup', // 수정된 경로
  REFRESH_TOKEN: '/api/users/auth/refresh-token', // 수정된 경로

  GET_USER_PROFILE: '/api/users/me/profile', // 기존 프로필 경로 유지
  UPDATE_USER_PROFILE: '/api/users/me/profile', // 기존 프로필 경로 유지
  UPDATE_EMAIL: '/api/users/me/email', // 기존 프로필 경로 유지
  UPDATE_PASSWORD: '/api/users/me/password', // 기존 프로필 경로 유지

  GET_USER_SETTINGS: '/api/users/me/settings', // 기존 설정 경로 유지
  UPDATE_USER_SETTINGS: '/api/users/me/settings', // 기존 설정 경로 유지

  // 질문 및 답변 관련 엔드포인트는 UserController가 아닌 별도 컨트롤러에 있을 수 있으므로 확인 필요
  // 만약 UserController에 있다면 /api/users/questions/... 와 같이 변경 필요
  GET_QUESTION: '/api/questions/for-me', // 현재 QuestionController는 @RequestMapping("/api/questions")
  SAVE_ANSWER: '/api/answers',             // 현재 AnswerController는 @RequestMapping("/api/answers")
  GET_MY_ANSWERS: '/api/answers/my-records',
};
