import React from 'react';
import { Flame, Target, Sparkles, LogIn } from 'lucide-react';
import { UserButton, SignInButton, useUser, SignedIn, SignedOut } from '@clerk/clerk-react';

/**
 * Editorial Clerk Appearance Config
 * Integrates Clerk widgets seamlessly into the Sienna OS warm-brown & parchment design system.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#A0522D', // sienna-600
    colorText: '#2E2524', // warm-brown-900
    colorTextSecondary: '#675751', // warm-brown-500
    colorBackground: '#F8F5EE', // parchment-card
    colorInputBackground: '#FBF9F5', // parchment-100
    colorInputText: '#2E2524',
    colorNeutral: '#4A3E3D',
    borderRadius: '0.75rem',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  elements: {
    card: 'border border-parchment-border shadow-sienna-card bg-parchment-card',
    headerTitle: 'font-serif text-warm-brown-950 text-2xl font-bold tracking-tight',
    headerSubtitle: 'text-warm-brown-500 text-xs font-sans',
    formButtonPrimary: 'bg-sienna-600 hover:bg-sienna-700 active:bg-sienna-800 text-parchment-50 font-medium transition-all shadow-sm',
    formFieldInput: 'bg-parchment-100 border-parchment-border focus:border-sienna-500 focus:ring-sienna-500/20 text-warm-brown-900 text-sm',
    footerActionLink: 'text-sienna-600 hover:text-sienna-700 font-semibold',
    socialButtonsBlockButton: 'border border-parchment-border hover:bg-parchment-surface text-warm-brown-800',
    userButtonAvatarBox: 'w-8 h-8 rounded-full border border-parchment-border shadow-xs',
    userButtonPopoverCard: 'bg-parchment-card border border-parchment-border shadow-sienna-card',
  }
};

/**
 * FocusLayout: Minimalist, editorial shell for Sienna OS
 * Removes traditional dense dashboard sidebars, notification noise, and multi-column feeds.
 * Retains only essential telemetry: Platform Brand, Streak Counter, Target Tier Indicator, and Clerk User Profile.
 */
export default function FocusLayout({
  children,
  user = { name: 'Student', activityStreak: 0, targetTier: '10+LPA' },
  onTierChange,
}) {
  const { user: clerkUser } = useUser();
  const displayName = clerkUser?.firstName || user?.name || 'Student';

  return (
    <div className="min-h-screen bg-parchment-100 text-warm-brown-900 font-sans selection:bg-sienna-200 selection:text-sienna-900 flex flex-col">
      {/* Top Editorial Bar */}
      <header className="sticky top-0 z-30 bg-parchment-100/90 backdrop-blur-md border-b border-parchment-border/80 px-6 py-3.5 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sienna-600 text-parchment-50 flex items-center justify-center font-serif font-bold text-lg shadow-sm select-none">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-semibold text-lg tracking-tight text-warm-brown-900">
                  Sienna OS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-sienna-100 text-sienna-700 border border-sienna-200/60 select-none">
                  Praxis
                </span>
              </div>
              <p className="text-[11px] text-warm-brown-500 hidden sm:block">
                St. Joseph’s Placement Focus Engine • Hello, {displayName}
              </p>
            </div>
          </div>

          {/* Telemetry Status: Streak & Target Tier & Clerk Profile */}
          <div className="flex items-center gap-3">
            {/* Streak Status Pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-parchment-card border border-parchment-border shadow-xs text-xs font-medium text-warm-brown-800"
              title="Consecutive daily engagement streak"
            >
              <Flame className="w-4 h-4 text-sienna-500 fill-sienna-500/20 animate-pulse" />
              <span>
                <strong className="font-semibold text-warm-brown-950 font-mono">
                  {user?.activityStreak || 0}
                </strong>
                <span className="text-warm-brown-500 ml-1 hidden md:inline">Day Streak</span>
              </span>
            </div>

            {/* Target Tier Selector / Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-parchment-surface border border-parchment-border text-xs text-warm-brown-800">
              <Target className="w-3.5 h-3.5 text-sienna-600" />
              <span className="text-warm-brown-500 hidden md:inline">Target:</span>
              <select
                aria-label="Select Target Placement Tier"
                value={user?.targetTier || '10+LPA'}
                onChange={(e) => onTierChange && onTierChange(e.target.value)}
                className="bg-transparent font-semibold text-sienna-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="5LPA">5 LPA (Core)</option>
                <option value="10LPA">10 LPA (Advanced)</option>
                <option value="10+LPA">&gt; 10 LPA (Marquee)</option>
              </select>
            </div>

            {/* Clerk User Button / Sign In */}
            <div className="flex items-center pl-1 border-l border-parchment-border/80">
              <SignedIn>
                <UserButton 
                  appearance={clerkAppearance} 
                  afterSignOutUrl="/" 
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sienna-600 hover:bg-sienna-700 text-parchment-50 text-xs font-medium transition-all shadow-xs cursor-pointer">
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {children}
      </main>

      {/* Minimal Editorial Footer */}
      <footer className="border-t border-parchment-border/60 py-6 px-6 text-center text-xs text-warm-brown-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sienna OS • Distraction-free single-threaded placement routing</span>
          <div className="flex items-center gap-4 text-warm-brown-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Clerk JWT Secured
            </span>
            <span>CLIST v4 Ingestion Sync: 12h</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
