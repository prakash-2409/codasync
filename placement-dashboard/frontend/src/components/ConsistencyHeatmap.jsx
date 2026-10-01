import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Flame, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import api from '../services/api';

/**
 * ConsistencyHeatmap: Platform-Agnostic Proof-of-Work Contribution Graph
 * Displays daily student engagement across 90 days mapped onto the Sienna editorial palette.
 */
export default function ConsistencyHeatmap({ 
  logs = [], 
  streak = 0, 
  onRefresh 
}) {
  const [fetchedLogs, setFetchedLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);

  // If logs are not provided as props, fetch them directly
  useEffect(() => {
    if (!logs || logs.length === 0) {
      setLoading(true);
      api.getUserProfile()
        .then((res) => {
          if (res?.data?.engagementLogs) {
            setFetchedLogs(res.data.engagementLogs);
          }
        })
        .catch((err) => console.warn('Heatmap log fetch failed:', err.message))
        .finally(() => setLoading(false));
    }
  }, [logs]);

  const activeLogs = logs && logs.length > 0 ? logs : fetchedLogs;

  // Process 90 days of calendar data ending today
  const { calendarWeeks, totalEngagements, activeDaysCount, maxSingleDay } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Build log map keyed by "YYYY-MM-DD"
    const countMap = {};
    activeLogs.forEach((log) => {
      if (!log.clickedAt) return;
      const d = new Date(log.clickedAt);
      const dateKey = d.toISOString().split('T')[0];
      countMap[dateKey] = (countMap[dateKey] || 0) + 1;
    });

    const days = [];
    const totalDays = 91; // 13 complete weeks of 7 days
    let totalCount = 0;
    let activeDays = 0;
    let maxCount = 0;

    // Start 90 days ago
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = countMap[dateStr] || 0;
      
      totalCount += count;
      if (count > 0) activeDays++;
      if (count > maxCount) maxCount = count;

      // Color intensity tier: 0 = none, 1 = 1 action, 2 = 2 actions, 3 = 3+ actions
      let level = 0;
      if (count >= 3) level = 3;
      else if (count === 2) level = 2;
      else if (count === 1) level = 1;

      days.push({
        date: d,
        dateStr,
        dayOfWeek: d.getDay(), // 0 = Sun, 6 = Sat
        count,
        level,
      });
    }

    // Group days into columns of weeks (Sunday to Saturday)
    const weeks = [];
    let currentWeek = [];

    days.forEach((day, idx) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || idx === days.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return {
      calendarWeeks: weeks,
      totalEngagements: totalCount,
      activeDaysCount: activeDays,
      maxSingleDay: maxCount,
    };
  }, [activeLogs]);

  // Color mapping based on strict Sienna OS design tokens
  const getCellColor = (level) => {
    switch (level) {
      case 3:
        return 'bg-sienna-600 border-sienna-700/40 text-parchment-50'; // 3+ actions
      case 2:
        return 'bg-sienna-400 border-sienna-500/40 text-parchment-50'; // 2 actions
      case 1:
        return 'bg-sienna-200 border-sienna-300 text-warm-brown-900'; // 1 action
      default:
        return 'bg-parchment-200/90 border-parchment-border/70 hover:border-warm-brown-300'; // 0 actions
    }
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-2xl bg-parchment-card border border-parchment-border shadow-sienna-card p-6 transition-all">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sienna-600" />
            <h3 className="font-serif text-lg font-semibold text-warm-brown-950">
              Proof-of-Work Consistency Matrix
            </h3>
          </div>
          <p className="text-xs text-warm-brown-500 mt-0.5">
            Platform-agnostic tracking across LeetCode, Skillrack, Codeforces & College Assessments (Last 90 Days)
          </p>
        </div>

        {/* Live Metrics Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-parchment-surface border border-parchment-border text-xs flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-sienna-600" />
            <span className="text-warm-brown-500">Total:</span>
            <strong className="font-mono text-warm-brown-900">{totalEngagements}</strong>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-sienna-50 border border-sienna-200/70 text-xs flex items-center gap-1.5 text-sienna-800">
            <Flame className="w-3.5 h-3.5 text-sienna-600" />
            <span>Streak:</span>
            <strong className="font-mono font-bold text-sienna-900">{streak} Days</strong>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-parchment-surface border border-parchment-border text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-warm-brown-500">Active Rate:</span>
            <strong className="font-mono text-warm-brown-900">
              {Math.round((activeDaysCount / 90) * 100)}%
            </strong>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px]">
          <div className="flex gap-1.5">
            {/* Day of Week Row Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] text-warm-brown-400 font-mono pr-2 py-0.5 select-none">
              <span className="h-3 leading-3">Sun</span>
              <span className="h-3 leading-3">Tue</span>
              <span className="h-3 leading-3">Thu</span>
              <span className="h-3 leading-3">Sat</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1.5 flex-1">
              {calendarWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                  {week.map((day) => (
                    <div
                      key={day.dateStr}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-3.5 w-full rounded-xs border transition-all cursor-pointer ${getCellColor(
                        day.level
                      )} hover:scale-115 hover:z-10`}
                      title={`${day.count} engagement${day.count === 1 ? '' : 's'} on ${day.dateStr}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Live Tooltip Detail + Color Legend */}
      <div className="mt-4 pt-3 border-t border-parchment-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Dynamic Tooltip Display on Hover */}
        <div className="text-warm-brown-600 min-h-[20px] flex items-center gap-1.5">
          {hoveredDay ? (
            <span className="inline-flex items-center gap-1 text-[11px] animate-fade-in">
              <span className="font-mono font-semibold text-warm-brown-950">
                {hoveredDay.count} {hoveredDay.count === 1 ? 'action' : 'actions'}
              </span>
              <span>logged on</span>
              <strong className="text-sienna-700">
                {hoveredDay.date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                  year: 'numeric',
                })}
              </strong>
            </span>
          ) : (
            <span className="text-[11px] text-warm-brown-400 italic">
              Hover over squares to review verified activity timestamps.
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-warm-brown-500 self-end sm:self-auto select-none">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-parchment-200 border border-parchment-border/70" title="0 actions" />
            <span className="w-3 h-3 rounded-xs bg-sienna-200 border border-sienna-300" title="1 action" />
            <span className="w-3 h-3 rounded-xs bg-sienna-400 border border-sienna-500/40" title="2 actions" />
            <span className="w-3 h-3 rounded-xs bg-sienna-600 border border-sienna-700/40" title="3+ actions" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
