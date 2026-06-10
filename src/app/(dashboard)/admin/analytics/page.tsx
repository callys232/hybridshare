'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { api, type ApiResponse } from '@/lib/api';
import { isMockMode, MOCK_ADMIN_ANALYTICS } from '@/mocks';

interface SparkLineProps { data: number[]; color?: string; height?: number }
function SparkLine({ data, color = '#c12129', height = 40 }: SparkLineProps) {
  if (!data.length) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i/(data.length-1))*100},${height - ((v-min)/range)*(height-4)}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <polyline points={`0,${height} ${pts} 100,${height}`} fill={`${color}18`} stroke="none" />
    </svg>
  );
}

interface BarChartProps { data: number[]; labels: string[]; color?: string; height?: number }
function BarChart({ data, labels, color = '#c12129', height = 120 }: BarChartProps) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 w-full" style={{ height }}>
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md hover:opacity-80 cursor-default group relative" style={{ height: `${Math.max((val/max)*100,2)}%`, backgroundColor: color }} title={`${labels[i]}: ${val.toLocaleString()}`}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-black text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">{val.toLocaleString()}</div>
          </div>
          <span className="text-[9px] text-brand-gray-dark truncate w-full text-center">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

interface MetricCardProps { label: string; value: string | number; change?: { value: number; label: string }; color?: string; sparkData?: number[] }
function MetricCard({ label, value, change, color = '#c12129', sparkData }: MetricCardProps) {
  return (
    <div className="bg-white border border-brand-gray rounded-xl p-5 hover:border-brand-black hover:shadow-md transition-all duration-200 group overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        </div>
        {change && (
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', change.value >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
            {change.value >= 0 ? '+' : ''}{change.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-brand-black mb-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-brand-gray-dark">{label}</p>
      {sparkData && <div className="mt-3 -mx-1 opacity-70 group-hover:opacity-100 transition-opacity"><SparkLine data={sparkData} color={color} /></div>}
      {change && <p className="text-[10px] text-brand-gray-dark mt-1">{change.label}</p>}
    </div>
  );
}

interface FunnelStep { label: string; value: number; pct: number }
function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={step.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-brand-black">{step.label}</span>
            <span className="font-bold text-brand-black">{step.value.toLocaleString()} <span className="font-normal text-brand-gray-dark">({step.pct}%)</span></span>
          </div>
          <div className="h-6 bg-brand-gray rounded-lg overflow-hidden">
            <div className="h-full bg-brand-red rounded-lg transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${step.pct}%` }}>
              {step.pct > 15 && <span className="text-[10px] text-white font-bold">{step.pct}%</span>}
            </div>
          </div>
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
  funnelSteps: FunnelStep[];
  summary: { totalUsers: number; totalEnrollments: number; totalRevenue: number; avgCompletion: number };
}

const FALLBACK: AnalyticsData = MOCK_ADMIN_ANALYTICS;

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>(FALLBACK);
  const [activeSection, setActiveSection] = useState<'overview' | 'learning' | 'revenue' | 'funnel'>('overview');

  useEffect(() => {
    setIsLoading(true);
    if (isMockMode()) {
      setIsLoading(false);
      return;
    }
    api.get<ApiResponse<AnalyticsData>>(`/analytics/admin?range=${range}`)
      .then((r) => { if (r.data.data) setData(r.data.data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [range]);

  const { enrollmentTimeline, revenueTimeline, enrollmentByDay, completionByDay, revenueByMonth, topCourses, funnelSteps, summary } = data;
  const weekLabels  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-sm text-brand-gray-dark mt-1">Track performance, revenue, and learning outcomes.</p>
        </div>
        <div className="flex gap-1 bg-brand-white-soft border border-brand-gray rounded-lg p-0.5">
          {RANGE_OPTIONS.map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)}
              className={cn('px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                range === r ? 'bg-brand-black text-white shadow-sm' : 'text-brand-gray-dark hover:text-brand-black hover:bg-white')}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 border-b border-brand-gray">
        {(['overview','learning','revenue','funnel'] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveSection(tab)}
            className={cn('px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px capitalize',
              activeSection === tab ? 'border-brand-red text-brand-red' : 'border-transparent text-brand-gray-dark hover:text-brand-black hover:border-brand-gray')}>
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {activeSection === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Enrollments" value={summary.totalEnrollments} change={{ value: 18, label: 'vs previous period' }} color="#c12129" sparkData={enrollmentTimeline.slice(-14)} />
                <MetricCard label="Completions"        value={8947}                    change={{ value: 12, label: 'vs previous period' }} color="#10b981" sparkData={enrollmentTimeline.slice(-14).map(v => Math.round(v * 0.6))} />
                <MetricCard label="Total Revenue"      value={`$${(summary.totalRevenue/1000).toFixed(0)}k`} change={{ value: 24, label: 'vs previous period' }} color="#f59e0b" sparkData={revenueTimeline.slice(-14)} />
                <MetricCard label="Active Learners"    value={summary.totalUsers}      change={{ value: -3, label: 'vs previous period' }} color="#8b5cf6" sparkData={enrollmentTimeline.slice(-14).map(v => Math.round(v * 0.4))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-brand-gray rounded-xl p-5">
                  <p className="text-sm font-bold text-brand-black mb-4">Daily Enrollments (this week)</p>
                  <BarChart data={enrollmentByDay} labels={weekLabels} color="#c12129" height={100} />
                </div>
                <div className="bg-white border border-brand-gray rounded-xl p-5">
                  <p className="text-sm font-bold text-brand-black mb-4">30-day Enrollment Trend</p>
                  <SparkLine data={enrollmentTimeline} height={100} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'learning' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Completion Rate"    value={`${summary.avgCompletion}%`} color="#10b981" />
                <MetricCard label="Avg. Progress"      value="48%"  color="#f59e0b" />
                <MetricCard label="Certificates Issued" value={3847} color="#8b5cf6" />
                <MetricCard label="Avg. Rating"        value="4.7/5" color="#f59e0b" />
              </div>
              <div className="bg-white border border-brand-gray rounded-xl p-5">
                <p className="text-sm font-bold text-brand-black mb-4">Daily Completions (this week)</p>
                <BarChart data={completionByDay} labels={weekLabels} color="#10b981" height={100} />
              </div>
              <div className="bg-white border border-brand-gray rounded-xl p-5 overflow-x-auto">
                <p className="text-sm font-bold text-brand-black mb-4">Top Courses by Enrollment</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-gray text-[11px] uppercase text-brand-gray-dark font-bold tracking-wider">
                      <th className="text-left pb-2">Course</th>
                      <th className="text-right pb-2">Enrollments</th>
                      <th className="text-right pb-2">Completion</th>
                      <th className="text-right pb-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCourses.map((c) => (
                      <tr key={c.title} className="border-b border-brand-gray/50 hover:bg-brand-white-soft transition-colors">
                        <td className="py-2.5 font-medium text-brand-black">{c.title}</td>
                        <td className="text-right text-brand-gray-dark">{c.enrollments.toLocaleString()}</td>
                        <td className="text-right">
                          <span className={cn('font-semibold', c.completionRate >= 70 ? 'text-emerald-600' : c.completionRate >= 50 ? 'text-amber-600' : 'text-rose-600')}>
                            {c.completionRate}%
                          </span>
                        </td>
                        <td className="text-right text-brand-gray-dark">${c.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'revenue' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Revenue"     value={`$${(summary.totalRevenue/1000).toFixed(0)}k`} change={{ value: 24, label: 'vs previous period' }} color="#f59e0b" sparkData={revenueTimeline.slice(-14)} />
                <MetricCard label="Monthly Recurring" value="$42.8k" change={{ value: 18, label: 'vs previous period' }} color="#10b981" />
                <MetricCard label="Avg. Order Value"  value="$92.60"  change={{ value: 7,  label: 'vs previous period' }} color="#c12129" />
                <MetricCard label="Refund Rate"       value="2.1%"    change={{ value: -1, label: 'vs previous period' }} color="#8b5cf6" />
              </div>
              <div className="bg-white border border-brand-gray rounded-xl p-5">
                <p className="text-sm font-bold text-brand-black mb-4">Monthly Revenue</p>
                <BarChart data={revenueByMonth} labels={monthLabels} color="#f59e0b" height={120} />
              </div>
            </div>
          )}

          {activeSection === 'funnel' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-brand-gray rounded-xl p-6">
                <p className="text-sm font-bold text-brand-black mb-6">Enrollment Conversion Funnel</p>
                <FunnelChart steps={funnelSteps} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Visitor to Enroll',    value: '36%', desc: 'Of visitors start an enrollment' },
                  { label: 'Enroll to Pay',         value: '35%', desc: 'Of enrollments convert to payment' },
                  { label: 'Enroll to Complete',    value: '60%', desc: 'Of enrolled students complete the course' },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-brand-gray rounded-xl p-5">
                    <p className="text-2xl font-black text-brand-black">{s.value}</p>
                    <p className="text-xs font-bold text-brand-gray-dark mt-1">{s.label}</p>
                    <p className="text-xs text-brand-gray-dark mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
