import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { clerkAppearance } from './components/FocusLayout';
import Dashboard from './components/Dashboard';
import { setAuthTokenGetter } from './services/api';
import { GraduationCap } from 'lucide-react';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * AuthBridge: Connects Clerk's dynamic session token to the Axios interceptor
 */
function AuthBridge() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
  }, [getToken, isSignedIn]);

  return null;
}

/**
 * Seamless Editorial Authentication View (Rendered when signed out)
 */
function AuthView() {
  const [mode, setMode] = useState('sign-in');

  return (
    <div className="min-h-screen bg-parchment-100 flex flex-col justify-center items-center p-6 selection:bg-sienna-200">
      <div className="max-w-md w-full text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-sienna-600 text-parchment-50 flex items-center justify-center font-serif font-bold text-2xl shadow-sm mx-auto mb-4 select-none">
          S
        </div>
        <h1 className="font-serif text-3xl font-bold text-warm-brown-950 tracking-tight">
          Sienna OS
        </h1>
        <p className="text-sm text-warm-brown-600 mt-2 font-sans">
          Praxis Placement Focus Engine • St. Joseph’s College of Engineering
        </p>
        <p className="text-xs text-warm-brown-500 mt-1">
          Sign in with your institutional or placement Gmail account to track streaks and receive single-threaded next-best actions.
        </p>
      </div>

      <div className="w-full max-w-sm flex justify-center">
        {mode === 'sign-in' ? (
          <SignIn 
            appearance={clerkAppearance} 
            routing="hash"
            signUpUrl="#sign-up"
          />
        ) : (
          <SignUp 
            appearance={clerkAppearance} 
            routing="hash"
            signInUrl="#sign-in"
          />
        )}
      </div>

      <div className="mt-6 text-center text-xs text-warm-brown-500">
        {mode === 'sign-in' ? (
          <span>
            Need to register?{' '}
            <button 
              onClick={() => setMode('sign-up')} 
              className="text-sienna-600 hover:text-sienna-700 font-semibold underline cursor-pointer"
            >
              Create placement account
            </button>
          </span>
        ) : (
          <span>
            Already registered?{' '}
            <button 
              onClick={() => setMode('sign-in')} 
              className="text-sienna-600 hover:text-sienna-700 font-semibold underline cursor-pointer"
            >
              Sign into existing account
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Root Application Container
 */
export default function App() {
  const hasClerkKey = CLERK_PUBLISHABLE_KEY && !CLERK_PUBLISHABLE_KEY.includes('placeholder');

  // Fallback demo mode if developer has not yet inserted their real Clerk publishable key
  if (!hasClerkKey) {
    return (
      <Dashboard
        banner={
          <div className="mb-8 p-6 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-sienna-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-warm-brown-950">
                  Clerk Authentication Configured
                </h3>
                <p className="text-xs text-warm-brown-700 leading-relaxed">
                  Clerk provider integration is active. To enable live Gmail sign-ins, add your <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-[11px]">VITE_CLERK_PUBLISHABLE_KEY</code> and <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-[11px]">CLERK_SECRET_KEY</code> to your environment variables.
                </p>
              </div>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} appearance={clerkAppearance}>
      <AuthBridge />
      <SignedIn>
        <Dashboard />
      </SignedIn>
      <SignedOut>
        <AuthView />
      </SignedOut>
    </ClerkProvider>
  );
}
