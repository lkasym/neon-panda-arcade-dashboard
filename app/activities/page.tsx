'use client';

import { useMemo, useState } from 'react';
import {
  getSalesMixData,
  filterByMonth,
  getActivityRevenue,
} from '@/lib/data-processor';
import { formatIndianNumber, formatNumber } from '@/lib/utils';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import MonthFilter from '@/components/MonthFilter';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#14b8a6', '#a855f7'];

export default function ActivitiesPage() {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>('all');

  const salesMixData = getSalesMixData();
  const filteredData = useMemo(() => {
    return filterByMonth(salesMixData, selectedMonths);
  }, [salesMixData, selectedMonths]);

  const activityRevenue = useMemo(() => {
    return getActivityRevenue(filteredData);
  }, [filteredData]);

  // Get unique activities for dropdown
  const activities = useMemo(() => {
    return activityRevenue.map(a => a.activity);
  }, [activityRevenue]);

  // Filter data by selected activity for time series
  const activityTimeSeries = useMemo(() => {
    if (selectedActivity === 'all') return [];
    
    const activityData = filteredData.filter(d => 
      (d.Activity || '').trim().toLowerCase() === selectedActivity.toLowerCase()
    );

    const dateMap: Record<string, { revenue: number; quantity: number }> = {};
    
    activityData.forEach(record => {
      let dateStr = record.DateFormatted;
      if (!dateStr && record.Date) {
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + record.Date * 24 * 60 * 60 * 1000);
        dateStr = format(jsDate, 'MMM dd');
      }
      if (!dateStr) return;
      
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { revenue: 0, quantity: 0 };
      }
      dateMap[dateStr].revenue += record['REVENUE '] || 0;
      dateMap[dateStr].quantity += record['QUANTITY '] || 0;
    });

    return Object.entries(dateMap)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        quantity: data.quantity,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData, selectedActivity]);

  // Top performers
  const topActivity = activityRevenue[0];
  const totalRevenue = activityRevenue.reduce((sum, a) => sum + a.revenue, 0);
  const totalQuantity = activityRevenue.reduce((sum, a) => sum + a.quantity, 0);

  // Top variants
  const topVariants = useMemo(() => {
    const variantMap: Record<string, { revenue: number; quantity: number; activity: string }> = {};
    
    filteredData.forEach(record => {
      const variant = record.Variant || '';
      const activity = record.Activity || '';
      if (!variant || !activity) return;
      
      const key = `${activity}::${variant}`;
      if (!variantMap[key]) {
        variantMap[key] = { revenue: 0, quantity: 0, activity };
      }
      variantMap[key].revenue += record['REVENUE '] || 0;
      variantMap[key].quantity += record['QUANTITY '] || 0;
    });
    
    return Object.entries(variantMap)
      .map(([key, data]) => ({
        activity: data.activity,
        variant: key.split('::')[1],
        revenue: data.revenue,
        quantity: data.quantity,
        avgRevenue: data.quantity > 0 ? data.revenue / data.quantity : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [filteredData]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Activity Performance
          </h2>
          <p className="text-sm text-gray-600 mt-1">Revenue & Engagement Analysis</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm md:text-base font-medium text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="all">All Activities</option>
              {activities.map(activity => (
                <option key={activity} value={activity}>{activity}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          <MonthFilter selectedMonths={selectedMonths} setSelectedMonths={setSelectedMonths} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title="Top Activity"
          value={topActivity ? topActivity.activity : 'N/A'}
          subtitle={topActivity ? formatIndianNumber(topActivity.revenue) : ''}
          icon="🥇"
          color="green"
        />
        <KPICard
          title="Total Revenue"
          value={formatIndianNumber(totalRevenue)}
          subtitle={`${activityRevenue.length} activities`}
          icon="💰"
          color="blue"
        />
        <KPICard
          title="Total Plays"
          value={formatNumber(totalQuantity)}
          subtitle="All activities"
          icon="🎮"
          color="purple"
        />
        <KPICard
          title="Avg/Play"
          value={totalQuantity > 0 ? `₹${(totalRevenue / totalQuantity).toFixed(0)}` : '₹0'}
          subtitle="Per unit"
          icon="📊"
          color="orange"
        />
      </div>

      {/* Key Insights - Prominent */}
      {activityRevenue.length > 0 && (
        <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Key Insights & Opportunities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-cyan-500">
              <p className="text-sm font-bold text-cyan-700 mb-2">🎯 Top Performer</p>
              <p className="text-xs text-gray-700">
                <span className="font-bold text-cyan-600">{topActivity?.activity}</span> generates 
                <span className="font-bold"> {formatIndianNumber(topActivity?.revenue || 0)}</span>
                <span className="block mt-1 text-cyan-600 font-bold">
                  → {((topActivity?.revenue || 0) / totalRevenue * 100).toFixed(1)}% of activity revenue
                </span>
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-bold text-blue-700 mb-2">📊 Portfolio Balance</p>
              <p className="text-xs text-gray-700">
                <span className="font-bold text-blue-600">{activityRevenue.length}</span> activities generating 
                <span className="font-bold"> {formatIndianNumber(totalRevenue)}</span>.
                <span className="block mt-1 text-blue-600 font-bold">
                  Top 3: {((activityRevenue.slice(0, 3).reduce((s, a) => s + a.revenue, 0) / totalRevenue) * 100).toFixed(0)}%
                </span>
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
              <p className="text-sm font-bold text-indigo-700 mb-2">💰 Avg Value</p>
              <p className="text-xs text-gray-700">
                Average revenue per play: <span className="font-bold text-indigo-600">₹{totalQuantity > 0 ? (totalRevenue / totalQuantity).toFixed(0) : 0}</span>
                <span className="block mt-1 text-indigo-600 font-bold">
                  Total plays: {formatNumber(totalQuantity)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Activity-specific time series */}
      {selectedActivity !== 'all' && activityTimeSeries.length > 0 && (
        <ChartCard 
          title={`${selectedActivity} - Daily Performance`} 
          subtitle="Revenue and quantity over time"
          fullWidth
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [formatIndianNumber(value), 'Revenue'];
                  return [formatNumber(value), 'Quantity'];
                }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Revenue"
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="quantity" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Quantity"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ChartCard title="Activity Revenue Ranking" subtitle="Top 10 by revenue">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={activityRevenue.slice(0, 10)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis 
                dataKey="activity" 
                type="category" 
                width={90} 
                tick={{ fontSize: 10 }} 
              />
              <Tooltip 
                formatter={(value: number) => formatIndianNumber(value)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="revenue" radius={[0, 8, 8, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue per Square Foot" subtitle="Space efficiency">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={activityRevenue.filter(a => a.revenuePerSqft > 0).slice(0, 10)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis 
                dataKey="activity" 
                type="category" 
                width={90} 
                tick={{ fontSize: 10 }} 
              />
              <Tooltip 
                formatter={(value: number) => `₹${value.toFixed(0)}/sqft`}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="revenuePerSqft" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Variants Table */}
      <ChartCard title="Top Variants by Revenue" subtitle="Best performing packages" fullWidth>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Variant
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Avg ₹
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topVariants.map((variant, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {idx + 1}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {variant.activity}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-sm text-gray-700 max-w-md truncate">
                    {variant.variant}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatIndianNumber(variant.revenue)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatNumber(variant.quantity)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-semibold">
                    ₹{variant.avgRevenue.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
