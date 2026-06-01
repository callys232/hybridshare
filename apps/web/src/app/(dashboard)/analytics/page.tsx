'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api, type ApiResponse } from '@/lib/api';
import { NodesPattern } from '@/component/ui/BackgroundPattern';
import { cn, formatBytes } from '@/lib/utils';
import { StorageChart } from '@/component/analytics/StorageChart';
import { Badge } from '@/component/ui/Badge';
import { Spinner } from '@/component/ui/Spinner';
import {
  MOCK_STORAGE_DATA,
  MOCK_ACTIVITY_TIMELINE,
  MOCK_SYSTEM_STATS,
} from '@/mocks';

interface ActivityPoint { date: string; uploads: number; bytes: number }

export default function AnalyticsPage() {
  const [storageData, setStorageData] = useState<typeof MOCK_STORAGE_DATA | null>(null);
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);
  const [systemStats, setSystemStats] = useState<typeof MOCK_SYSTEM_STATS | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get<ApiResponse<typeof MOCK_STORAGE_DATA>>('/analytics/storage'),
      api.get<ApiResponse<ActivityPoint[]>>(`/analytics/activity?period=${period}`),
      api.get<ApiResponse<typeof MOCK_SYSTEM_STATS>>('/analytics/system'),
    ]).then(([storage, activity, stats]) => {
      setStorageData(storage.status === 'fulfilled' ? storage.value.data.data ?? MOCK_STORAGE_DATA : MOCK_STORAGE_DATA);
      setActivityData(activity.status === 'fulfilled' ? activity.value.data.data ?? MOCK_ACTIVITY_TIMELINE : MOCK_ACTIVITY_TIMELINE);
      setSystemStats(stats.status === 'fulfilled' ? stats.value.data.data ?? MOCK_SYSTEM_STATS : MOCK_SYSTEM_STATS);
    }).finally(() => setIsLoading(false));
  }, [period]);

  const chartColors = ['#c12129', '#000000', '#888888', '#cccccc', '#f5e6e7'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-brand-gray-dark" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6 animate-fade-in">
      <NodesPattern opacity={0.4} />
      <div className="relative z-10 page-header">
        <h1 className="page-title">Analytics</h1>
        <div className="flex gap-1 p-1 bg-brand-white-soft rounded-lg border border-brand-gray">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 capitalize',
                period === p
                  ? 'bg-white shadow-card text-brand-black'
                  : 'text-brand-gray-dark hover:text-brand-black'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* System stats */}
      {systemStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Users', value: systemStats.users.toLocaleString() },
            { label: 'Total Files', value: systemStats.files.toLocaleString() },
            { label: 'Workspaces', value: systemStats.workspaces.toLocaleString() },
            { label: 'Storage Used', value: formatBytes(systemStats.storageUsed) },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="text-2xl font-bold text-brand-black">{s.value}</p>
              <p className="text-xs text-brand-gray-dark font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Activity chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Upload Activity</h2>
          <Badge variant="default">{activityData.length} data points</Badge>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={activityData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#888' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const d = new Date(v);
                return period === 'daily'
                  ? `${d.getMonth() + 1}/${d.getDate()}`
                  : period === 'weekly'
                  ? `W${Math.ceil(d.getDate() / 7)}`
                  : d.toLocaleDateString('en-US', { month: 'short' });
              }}
            />
            <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="uploads"
              stroke="#c12129"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#c12129' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage by workspace */}
        {storageData && (
          <div className="card p-5">
            <h2 className="section-title mb-5">Storage by Workspace</h2>
            <StorageChart data={storageData.byWorkspace} />
          </div>
        )}

        {/* Storage by type */}
        {storageData && (
          <div className="card p-5">
            <h2 className="section-title mb-5">Storage by Type</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={storageData.byMimeType}
                  dataKey="size"
                  nameKey="mimeType"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                >
                  {storageData.byMimeType.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatBytes(value)}
                  contentStyle={{ border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {storageData.byMimeType.slice(0, 5).map((item, i) => (
                <div key={item.mimeType} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: chartColors[i % chartColors.length] }}
                    />
                    <span className="text-brand-gray-dark truncate max-w-[140px]">
                      {item.mimeType.split('/').pop() ?? item.mimeType}
                    </span>
                  </div>
                  <span className="font-semibold text-brand-black">{formatBytes(item.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
