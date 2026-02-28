/**
 * Firebase 모듈 진입점
 */
export { app, auth, googleProvider } from './config';
export {
  onAuthStateChange,
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  getFirebaseIdToken,
  getFirebaseIdTokenResult,
  sendPasswordReset,
  sendVerificationEmail,
  updateUserProfile,
} from './auth';
export { useFirebaseAuth } from './useFirebaseAuth';
