import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, useAuth, useUser } from '@clerk/clerk-react';
import FocusLayout, { clerkAppearance } from './components/FocusLayout';
import ConsistencyHeatmap from './components/ConsistencyHeatmap';
import api, { setAuthTokenGetter } from './services/api';
import { 
  ArrowUpRight, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

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
 * Main Authenticated Placement Dashboard
 */
function Dashboard({ banner }) {
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState({
    name: 'Student',
    registerNumber: '312320104001',
    activityStreak: 3,
    targetTier: '10+LPA',
    engagementLogs: []
  });

  const [nextAction, setNextAction] = useState(null);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Load backend data for authenticated user
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, nextActionRes, contestsRes] = await Promise.allSettled([
        api.getUserProfile(),
        api.getNextBestAction(),
        api.getContests(),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        setUser(profileRes.value.data);
      }

      if (nextActionRes.status === 'fulfilled' && nextActionRes.value?.data) {
        setNextAction(nextActionRes.value.data);
      }

      if (contestsRes.status === 'fulfilled' && contestsRes.value?.data) {
        setContests(contestsRes.value.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to synchronize telemetry with backend engine. Showing local cached state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clerkUser]);

  const handleTierChange = async (newTier) => {
    setUser((prev) => ({ ...prev, targetTier: newTier }));
    try {
      await api.updateTargetTier(newTier);
      const actionRes = await api.getNextBestAction(newTier);
      if (actionRes?.data) setNextAction(actionRes.data);
    } catch (e) {
      console.warn('Could not persist tier change:', e.message);
    }
  };

  const handleLaunchContest = (url, contestId) => {
    const smartUrl = api.getSmartRedirectUrl(url, contestId, user.registerNumber || user._id);
    window.open(smartUrl, '_blank', 'noopener,noreferrer');
    
    // Optimistic local update
    const now = new Date();
    setUser((prev) => ({
      ...prev,
      activityStreak: (prev.activityStreak || 0) + 1,
      engagementLogs: [
        ...(prev.engagementLogs || []),
        { contestId, targetUrl: url, clickedAt: now.toISOString() }
      ]
    }));
  };

  const filteredContests = contests.filter((c) => {
    if (filterCategory === 'ALL') return true;
    return c.category?.toUpperCase() === filterCategory.toUpperCase();
  });

  return (
    <FocusLayout user={user} onTierChange={handleTierChange}>
      {banner}

      {/* Top Banner / Notification */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-sienna-50 border border-sienna-200 text-sienna-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-sienna-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 font-semibold text-sienna-700 hover:text-sienna-900 underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Hero: The Single "Next-Best-Action" Focus Card */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sienna-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-warm-brown-500">
              Immediate Priority • Next-Best-Action
            </h2>
          </div>
          <span className="text-[11px] text-warm-brown-400 font-serif italic">
            Single-Threaded Recommendation
          </span>
        </div>

        {nextAction ? (
          <div className="relative rounded-2xl bg-parchment-card border border-parchment-border shadow-sienna-card p-6 sm:p-8 overflow-hidden transition-all hover:shadow-sienna-focus">
            {/* Urgency indicator top strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sienna-400 via-sienna-500 to-sienna-600" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sienna-100 text-sienna-700 border border-sienna-200">
                    {nextAction.platform}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-parchment-surface text-warm-brown-700 border border-parchment-border">
                    {nextAction.category || 'Coding'}
                  </span>
                  {nextAction.targetTier && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-warm-brown-100 text-warm-brown-800 border border-warm-brown-200">
                      Tier: {nextAction.targetTier}
                    </span>
                  )}
                  {nextAction.isLive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                      ● LIVE NOW
                    </span>
                  ) : nextAction.startsInMinutes !== undefined && nextAction.startsInMinutes > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3" /> In {Math.round(nextAction.startsInMinutes / 60)}h
                    </span>
                  ) : null}
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-warm-brown-950 tracking-tight leading-snug">
                  {nextAction.title}
                </h1>

                <p className="text-sm text-warm-brown-600 leading-relaxed font-sans">
                  {nextAction.rationale ||
                    'Calculated high-leverage milestone based on your placement target tier and consistency benchmark.'}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => handleLaunchContest(nextAction.url, nextAction.id || nextAction._id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-sienna-600 hover:bg-sienna-700 active:bg-sienna-800 text-parchment-50 font-medium text-sm transition-all shadow-sm hover:shadow group cursor-pointer"
                >
                  <span>Engage Priority Task</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-parchment-card border border-parchment-border text-center">
            <p className="text-sm text-warm-brown-500">
              {loading ? 'Evaluating Next-Best-Action...' : 'No immediate pending action. Keep your streak active!'}
            </p>
          </div>
        )}
      </section>

      {/* Gamified Proof-of-Work Heatmap */}
      <section className="mb-10">
        <ConsistencyHeatmap 
          logs={user?.engagementLogs || []} 
          streak={user?.activityStreak || 0} 
          onRefresh={fetchData} 
        />
      </section>

      {/* Filter and Upcoming Timeline Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-serif text-xl font-semibold text-warm-brown-900">
              Active & Upcoming Placement Timeline
            </h3>
            <p className="text-xs text-warm-brown-500">
              Auto-ingested from CLIST (LeetCode, Codeforces, CodeChef, AtCoder) & Campus Drives
            </p>
          </div>

          {/* Minimal Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-parchment-surface border border-parchment-border text-xs">
            {['ALL', 'CODING', 'APTITUDE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-parchment-card text-warm-brown-900 shadow-xs font-semibold'
                    : 'text-warm-brown-500 hover:text-warm-brown-800'
                }`}
              >
                {cat === 'ALL' ? 'All Events' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Contest Cards Grid */}
        {filteredContests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContests.map((item) => {
              const startDate = new Date(item.startTime);
              const formattedDate = startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
              });
              const formattedTime = startDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item._id || item.externalId || item.url}
                  className="rounded-xl bg-parchment-card border border-parchment-border p-5 flex flex-col justify-between hover:border-warm-brown-300 transition-all shadow-xs"
                >
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-sienna-700 bg-sienna-50 border border-sienna-200/60 px-2 py-0.5 rounded">
                        {item.platform}
                      </span>
                      <span className="text-warm-brown-400 flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {Math.round((item.duration || 7200) / 60)} min
                      </span>
                    </div>

                    <h4 className="font-medium text-warm-brown-900 text-base leading-snug line-clamp-2">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-warm-brown-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formattedDate} • {formattedTime}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-parchment-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-warm-brown-400">
                      <span>Tier:</span>
                      <span className="font-semibold text-warm-brown-600">
                        {item.tierRecommendation?.join(', ') || 'All Tiers'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleLaunchContest(item.url, item._id)}
                      className="inline-flex items-center gap-1 font-semibold text-sienna-600 hover:text-sienna-700 transition-colors cursor-pointer"
                    >
                      <span>Participate</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-parchment-card border border-parchment-border">
            <p className="text-sm text-warm-brown-500">
              {loading ? 'Refreshing contests...' : 'No upcoming contests found in this filter.'}
            </p>
          </div>
        )}
      </section>
    </FocusLayout>
  );
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
