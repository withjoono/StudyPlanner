/**
 * Firebase 설정 및 초기화
 *
 * Firebase Auth를 중앙 IDP로 사용하여 모든 앱에서 SSO 지원
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth, connectAuthEmulator } from 'firebase/auth';
import { env } from '@/lib/config/env';

// Firebase 설정 (하드코딩 - 환경변수 미설정 시 기본값)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAo3YfEVPqRE5Pm7OUCByadZ3Yg56y4zHI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'geobukschool.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'geobukschool',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'geobukschool.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '69298836213',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:69298836213:web:15f6ef87bf5b9f0aadebbc',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DNKPV8QPCK',
};

// Firebase 앱 초기화 (중복 초기화 방지)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Firebase Auth 인스턴스
const auth: Auth = getAuth(app);

// 개발 환경에서 에뮬레이터 연결 (선택적)
if (env.isDevelopment && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

// Google OAuth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// 한국어 설정
auth.languageCode = 'ko';

export { app, auth, googleProvider };
export default app;
