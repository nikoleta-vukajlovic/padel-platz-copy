import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export const authService = {
  async register(email: string, password: string, name: string, phone: string, birthdate: string) {
    const role: string = 'user';
    if (!email || !password || !name || !phone || !birthdate) {
      throw new Error('All fields are required');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification
       await sendEmailVerification(userCredential.user);

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        name,
        phone,
        birthdate,
        role,
        createdAt: new Date().toISOString()
      });

      return userCredential.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already in use. Please use a different email or sign in.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password (minimum 6 characters).');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please check your email format.');
      } else {
        throw new Error('Failed to create account. Please try again.');
      }
    }
  },

  async loginWithGoogle(role: string = 'user') {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      // If user doesn't exist, create a new profile
      if (!userDoc.exists()) {
        console.log('Creating new user profile in Firestore', userCredential);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          role,
          emailVerified: true, // Google accounts are pre-verified
          createdAt: new Date().toISOString()
        });
      }

      return userCredential.user;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else {
        throw new Error('Failed to sign in with Google. Please try again.');
      }
    }
  },

  async login(email: string, password: string): Promise<UserCredential> {
    try {
       const userCredential = await signInWithEmailAndPassword(auth, email, password);

       // Update email verification status in Firestore if needed
       if (userCredential.user.emailVerified) {
         const userRef = doc(db, 'users', userCredential.user.uid);
         const userDoc = await getDoc(userRef);

         if (userDoc.exists() && userDoc.data().emailVerified === false) {
           await updateDoc(userRef, {
             emailVerified: true
           });
         }
       }

       return userCredential;
     } catch (error: any) {
       console.error('Login error:', error);
       if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
         throw new Error('Invalid email or password.');
       } else if (error.code === 'auth/too-many-requests') {
         throw new Error('Too many failed login attempts. Please try again later or reset your password.');
       } else {
         throw new Error('Failed to sign in. Please try again.');
       }
     }
  },

  async logout(): Promise<void> {
    return signOut(auth);
  },

   async sendPasswordResetEmail(email: string): Promise<void> {
     try {
       await sendPasswordResetEmail(auth, email);
     } catch (error: any) {
       console.error('Password reset error:', error);
       if (error.code === 'auth/user-not-found') {
         throw new Error('No account found with this email address.');
       } else {
         throw new Error('Failed to send password reset email. Please try again.');
       }
     }
   },

   async verifyPasswordResetCode(code: string): Promise<string> {
     try {
       return await verifyPasswordResetCode(auth, code);
     } catch (error) {
       console.error('Verify reset code error:', error);
       throw new Error('Invalid or expired password reset code.');
     }
   },

   async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
     try {
       await confirmPasswordReset(auth, code, newPassword);
     } catch (error) {
       console.error('Confirm password reset error:', error);
       throw new Error('Failed to reset password. Please try again.');
     }
   },

   async verifyEmail(code: string): Promise<void> {
     try {
       await applyActionCode(auth, code);

       // Update user's emailVerified status in Firestore if they're logged in
       if (auth.currentUser) {
         const userRef = doc(db, 'users', auth.currentUser.uid);
         await updateDoc(userRef, {
           emailVerified: true
         });
       }
     } catch (error) {
       console.error('Email verification error:', error);
       throw new Error('Failed to verify email. The link may be invalid or expired.');
     }
   },

   async resendVerificationEmail(): Promise<void> {
     if (!auth.currentUser) {
       throw new Error('No user is currently logged in.');
     }

     try {
       await sendEmailVerification(auth.currentUser);
     } catch (error) {
       console.error('Resend verification error:', error);
       throw new Error('Failed to resend verification email. Please try again later.');
     }
   }
};