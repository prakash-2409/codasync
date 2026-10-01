import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import FocusLayout from './FocusLayout';
import ConsistencyHeatmap from './ConsistencyHeatmap';
import api from '../services/api';
import {
  ArrowUpRight,
  Clock,
  Calendar,
  ExternalLink,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Award
} from 'lucide-react';

/**
 * Dashboard: Main Placement Orchestration Hub (Sienna OS)
 * Assembles Next-Best-Action hero card, 90-day consistency heatmap, and filtered contest timeline.
 */
export default function Dashboard({ banner }) {
  const { user: clerkUser } = useUser();

  const [user, setUser] = useState({
    name: 'Student',
    registerNumber: '312320104001',
    activityStreak: 3,
    targetTier: '10+LPA',
    engagementLogs: [],
  });

  const [nextAction, setNextAction] = useState(null);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');

  /**
   * Concurrently fetches User Profile, Next-Best-Action, and Contest Timeline
   */
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user profile first or alongside to obtain targetTier
      const [profileResult, contestsResult] = await Promise.allSettled([
        api.getUserProfile(),
        api.getContests(),
      ]);

      let currentTier = '10+LPA';
      if (profileResult.status === 'fulfilled' && profileResult.value?.data) {
        setUser(profileResult.value.data);
        currentTier = profileResult.value.data.targetTier || '10+LPA';
      }

      if (contestsResult.status === 'fulfilled' && contestsResult.value?.data) {
        setContests(contestsResult.value.data);
      }

      // Concurrently fetch Next-Best-Action tailored to the user's tier
      try {
        const nextActionRes = await api.getNextBestAction(currentTier);
        if (nextActionRes?.data) {
          setNextAction(nextActionRes.data);
        }
      } catch (actionErr) {
        console.warn('[Dashboard] Could not retrieve next-best-action:', actionErr.message);
      }
    } catch (err) {
      console.error('[Dashboard] Error during telemetry synchronization:', err);
      setError('Unable to synchronize live placement telemetry. Displaying cached state.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [clerkUser, fetchDashboardData]);

  /**
   * Telemetry Click Handler:
   * Routes outbound clicks through backend (/api/redirect) to log engagement and streak.
   * Optimistically increments the UI streak count and appends engagement log.
   */
  const handleActionClick = (targetUrl, contestId) => {
    if (!targetUrl) return;

    // Generate wrapped telemetry redirect URL
    const smartUrl = api.getSmartRedirectUrl(
      targetUrl,
      contestId,
      user?._id || user?.registerNumber || 'active-student'
    );

    // Open target contest in a clean new tab
    window.open(smartUrl, '_blank', 'noopener,noreferrer');

    // Optimistically update the UI streak counter and local activity log
    const now = new Date();
    setUser((prev) => ({
      ...prev,
      activityStreak: (prev.activityStreak || 0) + 1,
      engagementLogs: [
        ...(prev.engagementLogs || []),
        {
          contestId,
          targetUrl,
          clickedAt: now.toISOString(),
        },
      ],
    }));
  };

  /**
   * Tier Switcher Logic:
   * Fires a PUT request to update the student's targetTier,
   * then immediately re-fetches the Next-Best-Action for the new tier.
   */
  const handleTierChange = async (newTier) => {
    // Optimistic UI state update
    setUser((prev) => ({ ...prev, targetTier: newTier }));

    try {
      // 1. Persist tier choice to backend User document via PUT
      await api.updateTargetTier(newTier);

      // 2. Instantly re-fetch tailored Next-Best-Action for the updated tier
      const actionRes = await api.getNextBestAction(newTier);
      if (actionRes?.data) {
        setNextAction(actionRes.data);
      }
    } catch (e) {
      console.warn('[Dashboard] Could not update target tier:', e.message);
    }
  };

  // Filter timeline contests by category
  const filteredContests = contests.filter((c) => {
    if (filterCategory === 'ALL') return true;
    return c.category?.toUpperCase() === filterCategory.toUpperCase();
  });

  return (
    <FocusLayout user={user} onTierChange={handleTierChange}>
      {/* Optional Top Notification or Clerk Demo Banner */}
      {banner}

      {/* Synchronisation Alert with Retry */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-sienna-50 border border-sienna-200 text-sienna-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-sienna-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1 font-semibold text-sienna-700 hover:text-sienna-900 underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* 1. HERO: The Single-Threaded "Next-Best-Action" Card */}
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
            {/* Top Warm-Sienna Accent Strip */}
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
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-warm-brown-100 text-warm-brown-800 border border-warm-brown-200 flex items-center gap-1">
                      <Award className="w-3 h-3 text-sienna-600" />
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

              {/* Action Button: Bound to Telemetry Smart Redirect */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => handleActionClick(nextAction.url, nextAction.id || nextAction._id)}
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

      {/* 2. HEATMAP: Gamified Proof-of-Work Consistency Matrix (Directly Below Next-Best-Action) */}
      <section className="mb-10">
        <ConsistencyHeatmap
          logs={user?.engagementLogs || []}
          streak={user?.activityStreak || 0}
          onRefresh={fetchDashboardData}
        />
      </section>

      {/* 3. TIMELINE: Active & Upcoming Placement Timeline Feed */}
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
                      <span>
                        {formattedDate} • {formattedTime}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-parchment-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-warm-brown-400">
                      <span>Tier:</span>
                      <span className="font-semibold text-warm-brown-600">
                        {item.tierRecommendation?.join(', ') || 'All Tiers'}
                      </span>
                    </div>

                    {/* Action Button: Bound to Telemetry Smart Redirect */}
                    <button
                      onClick={() => handleActionClick(item.url, item._id)}
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
