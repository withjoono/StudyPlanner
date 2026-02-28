/**
 * Firebase Auth 서비스
 *
 * Firebase Authentication을 사용한 인증 기능 제공
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  getIdToken,
  getIdTokenResult,
} from 'firebase/auth';
import { auth, googleProvider } from './config';

// 인증 상태 리스너
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// 이메일/비밀번호 인증
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string,
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential;
};

// 소셜 로그인
export const signInWithGoogle = async (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
};

// 로그아웃
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// 토큰 관리
export const getFirebaseIdToken = async (forceRefresh = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return getIdToken(user, forceRefresh);
};

export const getFirebaseIdTokenResult = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return getIdTokenResult(user);
};

// 비밀번호 관리
export const sendPasswordReset = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

// 이메일 인증
export const sendVerificationEmail = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return sendEmailVerification(user);
};

// 프로필 관리
export const updateUserProfile = async (profile: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return updateProfile(user, profile);
};

export { auth };
