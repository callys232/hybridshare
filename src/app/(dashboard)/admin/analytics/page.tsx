'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { api, type ApiResponse } from '@/lib/api';

// Simple mini chart component (no external dep)
function SparkLine({ data, color = '#c12129', height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Fill area */}
      <polyline
        points={`0,${height} ${points} 100,${height}`}
        fill={`${color}18`}
        stroke="none"
      />
    </svg>
  );
}

function BarChart({ data, labels, color = '#c12129', height = 120 }: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 w-full" style={{ height }}>
      {data.map((val, i) => {
        const pct = (val / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all duration-500 hover:opacity-80 cursor-default group relative"
              style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color }}
              title={`${labels[i]}: ${val.toLocaleString()}`}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-black text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                {val.toLocaleString()}
              </div>
            </div>
            <span className="text-[9px] text-brand-gray-dark truncate w-full text-center">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({ label, value, change, icon, color = '#c12129', sparkData }: {
  label: string;
  value: string | number;
  change?: { value: number; label: string };
  icon: string;
  color?: string;
  sparkData?: number[];
}) {
  return (
    <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black hover:shadow-md transition-all duration-200 group overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform duration-150 group-hover:scale-110"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
        {change && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full',
            change.value >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          )}>
            <span>{change.value >= 0 ? ‘↑’ : ‘↓’}</span>
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-brand-black mb-0.5">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-brand-gray-dark">{label}</p>
      {sparkData && (
        <div className="mt-3 -mx-1 opacity-70 group-hover:opacity-100 transition-opacity duration-150">
          <SparkLine data={sparkData} color={color} />
        </div>
      )}
      {change && (
        <p className="text-[10px] text-brand-gray-dark mt-1">{change.label}</p>
      )}
    </div>
  );
}

function FunnelChart({ steps }: { steps: { label: string; value: number; pct: number }[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={step.label} className="group">
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-gray flex items-center justify-center text-[10px] font-bold text-brand-black">
                {i + 1}
              </span>
              <span className="font-medium text-brand-black">{step.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-brand-black">{step.value.toLocaleString()}</span>
              <span className="text-brand-gray-dark">{step.pct}%</span>
            </div>
          </div>
          <div className="h-7 bg-brand-gray rounded-lg overflow-hidden">
            <div
              className="h-full bg-brand-red rounded-lg transition-all duration-700 ease-out group-hover:opacity-90 flex items-center justify-end pr-2"
              style={{ width: `${step.pct}%` }}
            >
              {step.pct > 15 && (
                <span className="text-[10px] text-white font-bold">{step.pct}%</span>
              )}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex items-center gap-2 mt-1 pl-7">
              <svg className="w-3 h-3 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="text-[10px] text-brand-gray-dark">
                {steps[i + 1] ? `${Math.round((steps[i + 1].value / step.value) * 100)}% continued` : ''}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const RANGE_OPTIONS = ['7d', '30d', '90d', '1y'] as const;
type Range = typeof RANGE_OPTIONS[number];

interface AnalyticsData {
  enrollmentTimeline: number[];
  revenueTimeline: number[];
  enrollmentByDay: number[];
  completionByDay: number[];
  revenueByMonth: number[];
  topCourses: { title: string; enrollments: number; completionRate: number; revenue: number }[];
  funnelSteps: { label: string; value: number; pct: number }[];
  summary: { totalUsers: number; totalEnrollments: number; totalRevenue: number; avgCompletion: number };
}

const FALLBACK: AnalyticsData = {
  enrollmentTimeline: [120,145,132,178,165,210,198,245,230,278,265,310,298,340,325,380,365,420,408,455,443,490,478,520,510,545,530,580,565,612],
  revenueTimeline: [2400,2800,2650,3200,3050,3800,3600,4200,4050,4800,4650,5200,5050,5800,5650,6200,6050,6800,6650,7200,7050,7800,7650,8200,8050,8800,8650,9200,9050,9800],
  enrollmentByDay: [48,62,54,73,69,42,35],
  completionByDay: [12,18,15,22,19,11,8],
  revenueByMonth: [18400,22500,19800,28900,32100,27600,35200,38900,41200,45600,48900,52300],
  topCourses: [
    { title: 'Complete React Developer', enrollments: 1204, completionRate: 72, revenue: 28900 },
    { title: 'Full-Stack Node.js', enrollments: 987, completionRate: 68, revenue: 23700 },
    { title: 'TypeScript Masterclass', enrollments: 843, completionRate: 81, revenue: 20200 },
    { title: 'System Design Fundamentals', enrollments: 756, completionRate: 65, revenue: 18100 },
    { title: 'Advanced Python & ML', enrollments: 698, completionRate: 74, revenue: 16700 },
  ],
  funnelSteps: [
    { label: 'Course Page Viewed', value: 24820, pct: 100 },
    { label: 'Enrollment Started', value: 8947, pct: 36 },
    { label: 'Checkout Initiated', value: 4201, pct: 17 },
    { label: 'Payment Completed', value: 3105, pct: 13 },
    { label: 'First Lesson Watched', value: 2878, pct: 12 },
    { label: 'Course Completed', value: 1842, pct: 7 },
  ],
  summary: { totalUsers: 4820, totalEnrollments: 18247, totalRevenue: 284900, avgCompletion: 68 },
};

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>(FALLBACK);
  const [activeSection, setActiveSection] = useState<'overview' | 'learning' | 'revenue' | 'funnel'>('overview');

  useEffect(() => {
    setIsLoading(true);
    api.get<ApiResponse<AnalyticsData>>(`/analytics/admin?range=${range}`)
      .then((r) => { if (r.data.data) setData(r.data.data); })
      .catch(() => { /* keep FALLBACK */ })
      .finally(() => setIsLoading(false));
  }, [range]);

  const { enrollmentTimeline: enrollmentData, revenueTimeline: revenueData, enrollmentByDay, completionByDay, revenueByMonth: revByMonth, topCourses, funnelSteps } = data;
  const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-sm text-brand-gray-dark mt-1">Track performance, revenue, and learning outcomes across your platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-brand-white-soft border border-brand-gray rounded-lg p-0.5">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150',
                  range === r ? 'bg-brand-black text-white shadow-sm' : 'text-brand-gray-dark hover:text-brand-black hover:bg-white'
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <button type="button" className="btn-secondary text-sm flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-brand-gray">
        {(['overview', 'learning', 'revenue', 'funnel'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSection(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-150 -mb-px capitalize',
              activeSection === tab
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-brand-gray-dark hover:text-brand-black hover:border-brand-gray'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Enrollments"
                  value={14820}
                  change={{ value: 18, label: 'vs previous period' }}
                  icon="ðŸ“š"
                  color="#c12129"
                  sparkData={enrollmentData.slice(-14)}
                />
                <MetricCard
                  label="Course Completions"
                  value={8947}
                  change={{ value: 12, label: 'vs previous period' }}
                  icon="ðŸŽ“"
                  color="#10b981"
                  sparkData={enrollmentData.slice(-14).map((v) => v * 0.6)}
                />
                <MetricCard
                  label="Total Revenue"
                  value="$287,400"
                  change={{ value: 24, label: 'vs previous period' }}
                  icon="ðŸ’°"
                  color="#f59e0b"
                  sparkData={revenueData.slice(-14)}
                />
                <MetricCard
                  label="Active Learners"
                  value={6203}
                  change={{ value: -3, label: 'vs previous period' }}
                  icon="ðŸ‘¥"
                  color="#8b5cf6"
                  sparkData={enrollmentData.slice(-14).map((v) => v * 0.4)}
                />
              </div>

              {/* Secondary KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Completion Rate', value: '62%', icon: 'ðŸ“ˆ', color: '#10b981' },
                  { label: 'Avg. Progress', value: '48%', icon: 'âš¡', color: '#f59e0b' },
                  { label: 'Certificates Issued', value: 3847, icon: 'ðŸ†', color: '#8b5cf6' },
                  { label: 'Avg. Rating', value: '4.7/5', icon: '⭐', color: '#f59e0b' },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white border border-brand-gray rounded-xl p-4 hover:border-brand-black hover:shadow-sm transition-all duration-200 group">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform duration-150 group-hover:scale-110"
                        style={{ backgroundColor: `${metric.color}15` }}
                      >
                        {metric.icon}
                      </div>
                      <div>
                        <p className="text-xl font-black text-brand-black">{typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}</p>
                        <p className="text-xs text-brand-gray-dark">{metric.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black transition-colors duration-200">
                  <h3 className="font-bold text-brand-black mb-1">Enrollments by Day</h3>
                  <p className="text-xs text-brand-gray-dark mb-5">Last 7 days</p>
                  <BarChart data={enrollmentByDay} labels={weeklyLabels} color="#c12129" />
                </div>
                <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black transition-colors duration-200">
                  <h3 className="font-bold text-brand-black mb-1">Completions by Day</h3>
                  <p className="text-xs text-brand-gray-dark mb-5">Last 7 days</p>
                  <BarChart data={completionByDay} labels={weeklyLabels} color="#10b981" />
                </div>
              </div>

              {/* Top Courses Table */}
              <div className="bg-white border border-brand-gray rounded-xl hover:border-brand-black transition-colors duration-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-brand-gray">
                  <h3 className="font-bold text-brand-black">Top Performing Courses</h3>
                  <button type="button" className="text-xs text-brand-red hover:underline font-semibold">View all</button>
                </div>
                <div className="divide-y divide-brand-gray">
                  {topCourses.map((course, i) => (
                    <div key={course.title} className="flex items-center gap-4 px-5 py-3.5 hover:bg-brand-white-soft transition-colors duration-150 group">
                      <span className="w-6 text-center text-sm font-bold text-brand-gray-dark group-hover:text-brand-black transition-colors">
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-black group-hover:text-brand-red transition-colors duration-150 truncate">
                          {course.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-brand-gray rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${course.completionRate}%` }} />
                            </div>
                            <span className="text-[11px] text-brand-gray-dark">{course.completionRate}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm flex-shrink-0">
                        <div className="text-center">
                          <p className="font-bold text-brand-black">{course.enrollments.toLocaleString()}</p>
                          <p className="text-[10px] text-brand-gray-dark">Enrolled</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-emerald-600">${course.revenue.toLocaleString()}</p>
                          <p className="text-[10px] text-brand-gray-dark">Revenue</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Learning Analytics */}
          {activeSection === 'learning' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Avg. Time/Session', value: '47 min', icon: '⏱️', color: '#c12129' },
                  { label: 'Quiz Pass Rate', value: '74%', icon: 'ðŸ§ ', color: '#8b5cf6' },
                  { label: 'Total XP Awarded', value: '2.4M', icon: 'âš¡', color: '#f59e0b' },
                  { label: 'Streak Avg.', value: '8 days', icon: 'ðŸ”¥', color: '#ef4444' },
                ].map((m) => (
                  <div key={m.label} className="bg-white border border-brand-gray rounded-xl p-4 hover:border-brand-black hover:shadow-sm transition-all duration-200 group">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 transition-transform duration-150 group-hover:scale-110"
                      style={{ backgroundColor: `${m.color}15` }}
                    >
                      {m.icon}
                    </div>
                    <p className="text-2xl font-black text-brand-black">{m.value}</p>
                    <p className="text-xs text-brand-gray-dark mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Level Distribution */}
              <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black transition-colors duration-200">
                <h3 className="font-bold text-brand-black mb-1">Learner Level Distribution</h3>
                <p className="text-xs text-brand-gray-dark mb-5">XP-based progression levels</p>
                <div className="space-y-3">
                  {[
                    { name: 'Novice', count: 2840, pct: 38, color: '#94a3b8' },
                    { name: 'Explorer', count: 1920, pct: 26, color: '#60a5fa' },
                    { name: 'Learner', count: 1105, pct: 15, color: '#34d399' },
                    { name: 'Scholar', count: 740, pct: 10, color: '#a78bfa' },
                    { name: 'Expert', count: 444, pct: 6, color: '#f59e0b' },
                    { name: 'Master', count: 222, pct: 3, color: '#ef4444' },
                    { name: 'Champion+', count: 148, pct: 2, color: '#c12129' },
                  ].map((lvl) => (
                    <div key={lvl.name} className="flex items-center gap-3 group">
                      <div className="w-16 text-xs font-semibold text-brand-black flex-shrink-0">{lvl.name}</div>
                      <div className="flex-1 h-6 bg-brand-gray rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${lvl.pct * 2}%`, backgroundColor: lvl.color }}
                        >
                          {lvl.pct > 5 && <span className="text-[10px] text-white font-bold">{lvl.pct}%</span>}
                        </div>
                      </div>
                      <div className="w-16 text-right text-xs text-brand-gray-dark flex-shrink-0">
                        {lvl.count.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black transition-colors duration-200">
                <h3 className="font-bold text-brand-black mb-5">Enrollments by Category</h3>
                <BarChart
                  data={[3240, 2180, 1960, 1540, 1320, 980]}
                  labels={['Web Dev', 'Data Science', 'Design', 'Mobile', 'DevOps', 'AI/ML']}
                  color="#8b5cf6"
                  height={140}
                />
              </div>
            </div>
          )}

          {/* Revenue */}
          {activeSection === 'revenue' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: '$287,400', change: 24, icon: 'ðŸ’°', color: '#f59e0b' },
                  { label: 'Monthly Recurring', value: '$42,800', change: 18, icon: 'ðŸ”„', color: '#10b981' },
                  { label: 'Avg. Order Value', value: '$92.60', change: 7, icon: 'ðŸ›’', color: '#c12129' },
                  { label: 'Refund Rate', value: '2.1%', change: -0.3, icon: 'â†©️', color: '#8b5cf6' },
                ].map((m) => (
                  <MetricCard
                    key={m.label}
                    label={m.label}
                    value={m.value}
                    change={{ value: m.change, label: 'vs last period' }}
                    icon={m.icon}
                    color={m.color}
                    sparkData={revenueData.slice(-14)}
                  />
                ))}
              </div>

              <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black transition-colors duration-200">
                <h3 className="font-bold text-brand-black mb-1">Monthly Revenue</h3>
                <p className="text-xs text-brand-gray-dark mb-5">Last 12 months</p>
                <BarChart data={revByMonth} labels={monthLabels} color="#f59e0b" height={160} />
              </div>

              {/* Revenue breakdown */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black transition-colors duration-200">
                  <h3 className="font-bold text-brand-black mb-4">Revenue by Plan</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Enterprise', value: 128400, pct: 45, color: '#c12129' },
                      { label: 'Professional', value: 86200, pct: 30, color: '#8b5cf6' },
                      { label: 'Starter', value: 57600, pct: 20, color: '#60a5fa' },
                      { label: 'Course Sales', value: 15200, pct: 5, color: '#34d399' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-brand-black flex-1">{item.label}</span>
                        <div className="flex-1 h-2 bg-brand-gray rounded-full overflow-hidden mx-2">
                          <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                        </div>
                        <span className="text-xs font-bold text-brand-black w-20 text-right">${item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black transition-colors duration-200">
                  <h3 className="font-bold text-brand-black mb-4">Top Revenue Courses</h3>
                  <div className="space-y-3">
                    {topCourses.map((c, i) => (
                      <div key={c.title} className="flex items-center justify-between gap-3 group">
                        <span className="text-xs text-brand-gray-dark w-4">#{i + 1}</span>
                        <span className="text-xs text-brand-black flex-1 truncate group-hover:text-brand-red transition-colors">{c.title}</span>
                        <span className="text-xs font-bold text-emerald-600">${c.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Funnel */}
          {activeSection === 'funnel' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-brand-gray rounded-xl p-6 hover:border-brand-black hover:shadow-md transition-all duration-200">
                <h3 className="font-bold text-brand-black mb-1">Enrollment Funnel</h3>
                <p className="text-sm text-brand-gray-dark mb-6">Track how learners progress from discovery to completion</p>
                <FunnelChart steps={funnelSteps} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Visitor ↑ Enroll', value: '36%', desc: 'Of visitors enroll in at least one course', icon: 'ðŸšª', color: '#c12129' },
                  { label: 'Enroll ↑ Pay', value: '35%', desc: 'Of course page views convert to paid enrollment', icon: 'ðŸ’³', color: '#f59e0b' },
                  { label: 'Enroll ↑ Complete', value: '60%', desc: 'Of enrolled students complete the course', icon: 'ðŸŽ“', color: '#10b981' },
                ].map((m) => (
                  <div key={m.label} className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black hover:shadow-sm transition-all duration-200 group">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-150">{m.icon}</div>
                    <p className="text-3xl font-black" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-sm font-semibold text-brand-black mt-1">{m.label}</p>
                    <p className="text-xs text-brand-gray-dark mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                ))}
              </div>

              {/* Drop-off analysis */}
              <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black transition-colors duration-200">
                <h3 className="font-bold text-brand-black mb-4">Drop-off Points</h3>
                <div className="space-y-3">
                  {[
                    { stage: 'Module 1 ↑ Module 2', dropoff: 18, users: 1180 },
                    { stage: 'Module 3 (Mid-Course)', dropoff: 24, users: 895 },
                    { stage: 'First Assignment', dropoff: 15, users: 540 },
                    { stage: 'Final Module', dropoff: 9, users: 220 },
                  ].map((d) => (
                    <div key={d.stage} className="flex items-center gap-4 group">
                      <span className="text-sm text-brand-black font-medium flex-1">{d.stage}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-brand-gray rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 rounded-full" style={{ width: `${d.dropoff * 3}%` }} />
                        </div>
                        <span className="text-xs font-bold text-rose-600 w-12 text-right">-{d.dropoff}%</span>
                        <span className="text-xs text-brand-gray-dark w-20 text-right">{d.users.toLocaleString()} dropped</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
