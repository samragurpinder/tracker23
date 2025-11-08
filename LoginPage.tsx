import React, { useState } from 'react';
// Fix: The module resolution was failing. Assuming this is because the firebase module had compilation errors.
import { auth } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.438,36.338,48,30.418,48,24c0-3.584-0.422-7.025-1.189-10.275L43.611,20.083z"></path>
    </svg>
);


const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEmailAuth = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Please provide a valid email and password.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            await setPersistence(auth, browserLocalPersistence);
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
            } else {
                await signInWithEmailAndPassword(auth, email.trim(), password.trim());
            }
            // No navigation needed. App.tsx will handle the view change on auth state update.
        } catch (err: any) {
             switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError("Invalid email or password. Please try again.");
                    break;
                case 'auth/too-many-requests':
                    setError("Access to this account has been temporarily disabled due to many failed login attempts.");
                    break;
                case 'auth/email-already-in-use':
                    setError("An account with this email already exists. Please login.");
                    break;
                case 'auth/weak-password':
                    setError("Password should be at least 6 characters long.");
                    break;
                default:
                    setError("An unexpected error occurred. Please try again.");
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError(null);
        const provider = new GoogleAuthProvider();
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithPopup(auth, provider);
            // No navigation needed.
        } catch (err: any) {
             if (err.code !== 'auth/popup-closed-by-user') {
                setError("Failed to sign in with Google. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleEmailAuth();
        }
    }

    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-full max-w-sm p-8 space-y-6 bg-surface rounded-xl shadow-lg animate-fade-in">
                <div className="text-center">
                     <div className="flex flex-col items-center justify-center mb-4">
                        <svg className="w-24 h-24 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 01-6.23-.693L4.2 15.3m15.6 0-1.275 1.275a2.25 2.25 0 01-3.182 0l-1.275-1.275M4.2 15.3l1.275 1.275a2.25 2.25 0 003.182 0l1.275-1.275"></path></svg>
                        <div className="mt-2 text-center">
                            <h1 className="text-5xl font-bold text-text-primary leading-tight">Gurpinder's</h1>
                            <p className="text-xl text-text-secondary">Prep Tracker</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-text-primary">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="w-full px-3 py-2 mt-1 bg-background border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter your email"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="text-sm font-medium text-text-primary">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="w-full px-3 py-2 mt-1 bg-background border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-danger text-center animate-shake">{error}</p>}
                    <div className="flex flex-col space-y-2 pt-2">
                         <button
                            onClick={handleEmailAuth}
                            disabled={loading || !email.trim() || !password.trim()}
                            className="w-full px-4 py-2 font-semibold text-white bg-primary rounded-md hover:bg-primary-light disabled:bg-secondary disabled:cursor-not-allowed transition-all transform hover:scale-105"
                        >
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
                        </button>
                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-accent"></div>
                          <span className="flex-shrink mx-4 text-xs text-text-secondary">OR</span>
                          <div className="flex-grow border-t border-accent"></div>
                        </div>
                         <button
                            onClick={handleGoogleAuth}
                            disabled={loading}
                            className="w-full px-4 py-2 font-semibold text-text-primary bg-surface border border-accent rounded-md hover:bg-accent disabled:bg-secondary disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center"
                        >
                            <GoogleIcon />
                            Continue with Google
                        </button>
                        <button
                            onClick={() => {setIsSignUp(!isSignUp); setError(null);}}
                            className="text-sm text-primary hover:underline mt-2"
                        >
                            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;