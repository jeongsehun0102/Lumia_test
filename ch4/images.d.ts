// images.d.ts

declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpeg' { // jpeg도 추가
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.gif' { // gif 추가
  const value: import('react-native').ImageSourcePropType;
  export default value;
} 