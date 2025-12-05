'use client';

import { useMemo, useState } from 'react';
import {
  getSalesMixData,
  getArcadeData,
  filterByMonth,
  getActivityRevenue,
  ACTIVITY_SQFT,
} from '@/lib/data-processor';
import { formatIndianNumber, formatNumber } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import MonthFilter from '@/components/MonthFilter';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

export default function SpaceEfficiencyPage() {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const salesMixData = getSalesMixData();
  const arcadeData = getArcadeData();
  
  const filteredSalesMix = useMemo(() => {
    return filterByMonth(salesMixData, selectedMonths);
  }, [salesMixData, selectedMonths]);

  const filteredArcade = useMemo(() => {
    return filterByMonth(arcadeData, selectedMonths);
  }, [arcadeData, selectedMonths]);

  // Calculate space efficiency
  const spaceEfficiency = useMemo(() => {
    const activityRevenue = getActivityRevenue(filteredSalesMix);
    
    // Add Arcade and VR as categories
    const arcadeRevenue = filteredArcade
      .filter(d => (d['Type of Game'] || '').toLowerCase() === 'arcade')
      .reduce((sum, d) => sum + (d.CREDIT || 0) + (d['BONUS '] || 0), 0);
    
    const vrRevenue = filteredArcade
      .filter(d => (d['Type of Game'] || '').toLowerCase() === 'vr')
      .reduce((sum, d) => sum + (d.CREDIT || 0) + (d['BONUS '] || 0), 0);

    const allActivities = [
      ...activityRevenue.map(a => ({
        activity: a.activity,
        revenue: a.revenue,
        quantity: a.quantity,
        sqft: ACTIVITY_SQFT[a.activity] || 0,
      })),
      {
        activity: 'Arcade',
        revenue: arcadeRevenue,
        quantity: 0,
        sqft: ACTIVITY_SQFT['Arcade'] || 2000,
      },
      {
        activity: 'VR',
        revenue: vrRevenue,
        quantity: 0,
        sqft: ACTIVITY_SQFT['VR Zone'] || 500,
      },
    ];

    // Calculate efficiency
    const efficiency = allActivities
      .filter(a => a.sqft > 0 && a.revenue > 0)
      .map(a => ({
        ...a,
        revenuePerSqft: a.revenue / a.sqft,
      }))
      .sort((a, b) => b.revenuePerSqft - a.revenuePerSqft);

    return efficiency;
  }, [filteredSalesMix, filteredArcade]);

  // Top 3 and Bottom 3
  const top3 = spaceEfficiency.slice(0, 3);
  const bottom3 = spaceEfficiency.slice(-3).reverse();

  // Overall metrics
  const totalRevenue = spaceEfficiency.reduce((sum, a) => sum + a.revenue, 0);
  const totalSqft = spaceEfficiency.reduce((sum, a) => sum + a.sqft, 0);
  const avgRevenuePerSqft = totalSqft > 0 ? totalRevenue / totalSqft : 0;
  const bestPerformer = spaceEfficiency[0];
  const worstPerformer = spaceEfficiency[spaceEfficiency.length - 1];

  // Color coding
  const getBarColor = (index: number) => {
    if (index < 3) return '#10b981'; // Green
    if (index >= spaceEfficiency.length - 3) return '#ef4444'; // Red
    return '#3b82f6'; // Blue
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Space Efficiency Analysis
          </h2>
          <p className="text-sm text-gray-600 mt-1">Revenue Performance per Square Foot</p>
        </div>
        <MonthFilter selectedMonths={selectedMonths} setSelectedMonths={setSelectedMonths} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title="Best Performer"
          value={bestPerformer ? bestPerformer.activity : 'N/A'}
          subtitle={bestPerformer ? `₹${bestPerformer.revenuePerSqft.toFixed(0)}/sqft` : ''}
          icon="🥇"
          color="green"
        />
        <KPICard
          title="Avg ₹/Sqft"
          value={`₹${avgRevenuePerSqft.toFixed(0)}`}
          subtitle={`${formatNumber(totalSqft)} sqft total`}
          icon="📊"
          color="blue"
        />
        <KPICard
          title="Total Revenue"
          value={formatIndianNumber(totalRevenue)}
          subtitle={`${spaceEfficiency.length} activities`}
          icon="💰"
          color="purple"
        />
        <KPICard
          title="Needs Attention"
          value={worstPerformer ? worstPerformer.activity : 'N/A'}
          subtitle={worstPerformer ? `₹${worstPerformer.revenuePerSqft.toFixed(0)}/sqft` : ''}
          icon="⚠️"
          color="orange"
        />
      </div>

      {/* Key Insights - Prominent */}
      {spaceEfficiency.length > 0 && (
        <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Key Insights & Strategic Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <p className="text-sm font-bold text-green-700 mb-2">🥇 Best ROI</p>
              <p className="text-xs text-gray-700">
                <span className="font-bold text-green-600">{bestPerformer?.activity}</span> leads at 
                <span className="font-bold"> ₹{bestPerformer?.revenuePerSqft.toFixed(0)}/sqft</span>.
                <span className="block mt-1 text-green-600 font-bold">→ Expand this activity!</span>
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
              <p className="text-sm font-bold text-red-700 mb-2">⚠️ Needs Attention</p>
              <p className="text-xs text-gray-700">
                <span className="font-bold text-red-600">{worstPerformer?.activity}</span> at only 
                <span className="font-bold"> ₹{worstPerformer?.revenuePerSqft.toFixed(0)}/sqft</span>.
                <span className="block mt-1 text-red-600 font-bold">→ Optimize or reallocate space</span>
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-bold text-blue-700 mb-2">📊 Overall Efficiency</p>
              <p className="text-xs text-gray-700">
                Average: <span className="font-bold text-blue-600">₹{avgRevenuePerSqft.toFixed(0)}/sqft</span> across 
                <span className="font-bold"> {formatNumber(totalSqft)}</span> sqft generating 
                <span className="font-bold"> {formatIndianNumber(totalRevenue)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 and Bottom 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card rounded-xl p-5 md:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <h3 className="text-lg md:text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🌟</span> Top 3 Most Efficient
          </h3>
          <div className="space-y-3">
            {top3.map((activity, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-md flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm md:text-base">{activity.activity}</p>
                    <p className="text-xs text-gray-500">{formatNumber(activity.sqft)} sqft</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    ₹{activity.revenuePerSqft.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">per sqft</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 md:p-6 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200">
          <h3 className="text-lg md:text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span> Bottom 3 - Needs Improvement
          </h3>
          <div className="space-y-3">
            {bottom3.map((activity, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-md flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📉</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm md:text-base">{activity.activity}</p>
                    <p className="text-xs text-gray-500">{formatNumber(activity.sqft)} sqft</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl md:text-2xl font-bold text-red-600">
                    ₹{activity.revenuePerSqft.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">per sqft</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Efficiency Chart */}
      <ChartCard 
        title="Revenue per Square Foot - All Activities" 
        subtitle="Top performers in green, needs attention in red"
        fullWidth
      >
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={spaceEfficiency}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
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
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
            <Bar dataKey="revenuePerSqft" radius={[0, 8, 8, 0]}>
              {spaceEfficiency.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Efficiency vs Revenue Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ChartCard title="Efficiency Trend" subtitle="Revenue per sqft ranking">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={spaceEfficiency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="activity" 
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number) => `₹${value.toFixed(0)}/sqft`}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="revenuePerSqft" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="revenuePerSqft" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Total Revenue Distribution" subtitle="Contribution by activity">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={spaceEfficiency.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="activity" 
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number) => formatIndianNumber(value)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                {spaceEfficiency.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Table */}
      <ChartCard title="Detailed Efficiency Breakdown" fullWidth>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Rank
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Activity
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Square Feet
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Total Revenue
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  ₹/Sqft
                </th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {spaceEfficiency.map((activity, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-gray-50 transition-colors ${
                    idx < 3 ? 'bg-green-50/50' : idx >= spaceEfficiency.length - 3 ? 'bg-red-50/50' : ''
                  }`}
                >
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    #{idx + 1}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.activity}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatNumber(activity.sqft)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatIndianNumber(activity.revenue)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                    <span className={idx < 3 ? 'text-green-600' : idx >= spaceEfficiency.length - 3 ? 'text-red-600' : 'text-blue-600'}>
                      ₹{activity.revenuePerSqft.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                    {idx < 3 && (
                      <span className="badge-top">⭐ Top</span>
                    )}
                    {idx >= spaceEfficiency.length - 3 && (
                      <span className="badge-bottom">⚠️ Focus</span>
                    )}
                    {idx >= 3 && idx < spaceEfficiency.length - 3 && (
                      <span className="badge-mid">✓ Good</span>
                    )}
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
