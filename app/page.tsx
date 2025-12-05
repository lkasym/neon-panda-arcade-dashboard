'use client';

import { useMemo, useState } from 'react';
import {
  getSalesData,
  getRechargeData,
  getArcadeData,
  getSalesMixData,
  filterByMonth,
  getWeekendWeekdaySplit,
  getCardIssuanceMetrics,
} from '@/lib/data-processor';
import { formatIndianNumber, formatNumber } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import MonthFilter from '@/components/MonthFilter';

export default function ExecutiveSummary() {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const salesData = getSalesData();
  const rechargeData = getRechargeData();
  const arcadeData = getArcadeData();
  const salesMixData = getSalesMixData();

  const filteredSales = useMemo(() => {
    return filterByMonth(salesData, selectedMonths);
  }, [salesData, selectedMonths]);

  const filteredRecharge = useMemo(() => {
    return filterByMonth(rechargeData, selectedMonths);
  }, [rechargeData, selectedMonths]);

  const filteredArcade = useMemo(() => {
    return filterByMonth(arcadeData, selectedMonths);
  }, [arcadeData, selectedMonths]);

  const filteredSalesMix = useMemo(() => {
    return filterByMonth(salesMixData, selectedMonths);
  }, [salesMixData, selectedMonths]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalGameRevenue = filteredSales.reduce((sum, d) => sum + (d.GameRevenue || 0), 0);
    const totalFoodSale = filteredSales.reduce((sum, d) => sum + (d.FoodSale || 0), 0);
    const totalFootfall = filteredSales.reduce((sum, d) => sum + (d.Footfall || 0), 0);
    const totalRecharge = filteredRecharge.reduce((sum, d) => sum + (d.Amount || 0), 0);
    const totalArcadeCredit = filteredArcade.reduce((sum, d) => sum + (d.CREDIT || 0), 0);
    const totalArcadeBonus = filteredArcade.reduce((sum, d) => sum + (d['BONUS '] || 0), 0);
    
    // Party metrics
    const totalParties = filteredSales.reduce((sum, d) => sum + (d.NoOfParties || 0), 0);
    const totalPartyRevenue = filteredSales.reduce((sum, d) => sum + (d.PartyGameSale || 0) + (d.PartyFoodSale || 0), 0);
    const avgPartyRevenue = totalParties > 0 ? totalPartyRevenue / totalParties : 0;
    
    // Combo metrics
    const comboData = filteredSalesMix.filter(r => {
      const variant = (r.Variant || '').toLowerCase();
      return variant.includes('combo') || variant.includes('big thrill') || variant.includes('pack');
    });
    const comboRevenue = comboData.reduce((sum, r) => sum + (r['REVENUE '] || 0), 0);
    const comboQuantity = comboData.reduce((sum, r) => sum + (r['QUANTITY '] || 0), 0);
    
    const cardMetrics = getCardIssuanceMetrics(filteredSales, filteredRecharge);
    const weekendWeekday = getWeekendWeekdaySplit(filteredSales);
    const bonusCreditRatio = totalArcadeCredit > 0 ? (totalArcadeBonus / totalArcadeCredit) * 100 : 0;
    const revenuePerFootfall = totalFootfall > 0 ? (totalGameRevenue + totalFoodSale) / totalFootfall : 0;
    const foodPercentage = (totalGameRevenue + totalFoodSale) > 0 ? (totalFoodSale / (totalGameRevenue + totalFoodSale)) * 100 : 0;

    return {
      totalRevenue: totalGameRevenue + totalFoodSale,
      totalGameRevenue,
      totalFoodSale,
      totalFootfall,
      weekendRevenuePercent: weekendWeekday.weekend.percentage,
      bonusCreditPercent: bonusCreditRatio,
      totalRecharge,
      revenuePerFootfall,
      foodPercentage,
      avgDailyRevenue: filteredSales.length > 0 ? (totalGameRevenue + totalFoodSale) / filteredSales.length : 0,
      totalParties,
      totalPartyRevenue,
      avgPartyRevenue,
      comboRevenue,
      comboQuantity,
      ...cardMetrics,
    };
  }, [filteredSales, filteredRecharge, filteredArcade, filteredSalesMix]);

  // Daily revenue trend
  const dailyTrend = useMemo(() => {
    return filteredSales
      .map(d => {
        let dateStr = d.DateFormatted;
        if (!dateStr && d.Date) {
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + d.Date * 24 * 60 * 60 * 1000);
          dateStr = format(jsDate, 'MMM dd');
        }
        return {
          date: dateStr || '',
          gameRevenue: d.GameRevenue || 0,
          foodRevenue: d.FoodSale || 0,
          totalRevenue: (d.GameRevenue || 0) + (d.FoodSale || 0),
          footfall: d.Footfall || 0,
        };
      })
      .filter(d => d.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales]);

  // Weekend vs Weekday
  const weekendWeekday = useMemo(() => {
    return getWeekendWeekdaySplit(filteredSales);
  }, [filteredSales]);

  const weekendWeekdayChart = [
    {
      name: 'Weekend',
      Revenue: weekendWeekday.weekend.revenue,
      Footfall: weekendWeekday.weekend.footfall,
    },
    {
      name: 'Weekday',
      Revenue: weekendWeekday.weekday.revenue,
      Footfall: weekendWeekday.weekday.footfall,
    },
  ];

  // Day-wise performance
  const dayWisePerformance = useMemo(() => {
    const dayMap: Record<string, { revenue: number; footfall: number; count: number }> = {};
    
    filteredSales.forEach(d => {
      const day = d.Day || '';
      if (!day) return;
      
      if (!dayMap[day]) {
        dayMap[day] = { revenue: 0, footfall: 0, count: 0 };
      }
      dayMap[day].revenue += (d.GameRevenue || 0) + (d.FoodSale || 0);
      dayMap[day].footfall += d.Footfall || 0;
      dayMap[day].count += 1;
    });

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return dayOrder
      .filter(day => dayMap[day])
      .map(day => ({
        day: day.substring(0, 3),
        avgRevenue: dayMap[day].count > 0 ? dayMap[day].revenue / dayMap[day].count : 0,
        avgFootfall: dayMap[day].count > 0 ? dayMap[day].footfall / dayMap[day].count : 0,
      }));
  }, [filteredSales]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Executive Summary
          </h2>
          <p className="text-sm text-gray-600 mt-1">Key Performance Indicators & Insights</p>
        </div>
        <MonthFilter selectedMonths={selectedMonths} setSelectedMonths={setSelectedMonths} />
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title="Total Revenue"
          value={formatIndianNumber(kpis.totalRevenue)}
          subtitle="Game + Food"
          icon="💰"
          color="green"
        />
        <KPICard
          title="Total Footfall"
          value={formatNumber(kpis.totalFootfall)}
          subtitle="Visitors"
          icon="👥"
          color="blue"
        />
        <KPICard
          title="Revenue/Visitor"
          value={`₹${kpis.revenuePerFootfall.toFixed(0)}`}
          subtitle="Per footfall"
          icon="🎯"
          color="purple"
        />
        <KPICard
          title="Avg Daily"
          value={formatIndianNumber(kpis.avgDailyRevenue)}
          subtitle={`${filteredSales.length} days`}
          icon="📈"
          color="orange"
        />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title="Party Revenue"
          value={formatIndianNumber(kpis.totalPartyRevenue)}
          subtitle={`${kpis.totalParties} parties`}
          icon="🎉"
          color="purple"
        />
        <KPICard
          title="Avg per Party"
          value={`₹${kpis.avgPartyRevenue.toFixed(0)}`}
          subtitle="Game + Food"
          icon="🎯"
          color="orange"
        />
        <KPICard
          title="Combo Revenue"
          value={formatIndianNumber(kpis.comboRevenue)}
          subtitle={`${formatNumber(kpis.comboQuantity)} sold`}
          icon="🎁"
          color="green"
        />
        <KPICard
          title="Repeat Rate"
          value={`${kpis.rechargePercentage.toFixed(1)}%`}
          subtitle="Customer retention"
          icon="⭐"
          color="blue"
        />
      </div>

      {/* Key Insights - Executive Level */}
      <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">💡</span> Executive Insights & Priority Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
            <p className="text-sm font-bold text-green-700 mb-2">💰 Revenue Health</p>
            <p className="text-xs text-gray-700">
              Total: <span className="font-bold text-green-600">{formatIndianNumber(kpis.totalRevenue)}</span>
              <span className="block mt-1">
                Avg daily: <span className="font-bold">{formatIndianNumber(kpis.avgDailyRevenue)}</span>
              </span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
            <p className="text-sm font-bold text-purple-700 mb-2">🎉 High-Value Segments</p>
            <p className="text-xs text-gray-700">
              Parties: <span className="font-bold text-purple-600">{formatIndianNumber(kpis.totalPartyRevenue)}</span>
              <span className="block mt-1">
                Combos: <span className="font-bold">{formatIndianNumber(kpis.comboRevenue)}</span>
              </span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm font-bold text-blue-700 mb-2">👥 Customer Metrics</p>
            <p className="text-xs text-gray-700">
              ₹{kpis.revenuePerFootfall.toFixed(0)}/visitor
              <span className="block mt-1">
                {kpis.rechargePercentage.toFixed(0)}% repeat rate
              </span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
            <p className="text-sm font-bold text-orange-700 mb-2">📅 Revenue Pattern</p>
            <p className="text-xs text-gray-700">
              Weekend: <span className="font-bold text-orange-600">{kpis.weekendRevenuePercent.toFixed(0)}%</span>
              <span className="block mt-1">
                {kpis.weekendRevenuePercent > 50 
                  ? 'Boost weekday promotions'
                  : 'Balanced distribution'
                }
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ChartCard title="Daily Revenue Trend" subtitle="Performance over time">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number) => formatIndianNumber(value)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalRevenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Total Revenue"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekend vs Weekday" subtitle="Revenue and footfall">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={weekendWeekdayChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Revenue') return [formatIndianNumber(value), 'Revenue'];
                  return [formatNumber(value), name];
                }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="Revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="Footfall" stroke="#10b981" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Day-wise Performance */}
      <ChartCard title="Average Daily Performance by Day" subtitle="Revenue and footfall patterns" fullWidth>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dayWisePerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 11 }}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'avgRevenue') return [formatIndianNumber(value), 'Avg Revenue'];
                return [formatNumber(value), 'Avg Footfall'];
              }}
              contentStyle={{ 
                backgroundColor: 'white', 
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="avgRevenue" fill="#8b5cf6" name="Avg Revenue" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="avgFootfall" fill="#f59e0b" name="Avg Footfall" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Card Issuance Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Card Issuance Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">New Cards</p>
                <p className="text-2xl font-bold text-green-700">{formatNumber(kpis.totalNewCards)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-lg font-semibold text-green-600">{formatIndianNumber(kpis.newCardRevenue)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">Recharge Cards</p>
                <p className="text-2xl font-bold text-blue-700">{formatNumber(kpis.totalRechargeCards)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-lg font-semibold text-blue-600">{formatIndianNumber(kpis.rechargeCardRevenue)}</p>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Customer Retention</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                    style={{ width: `${kpis.rechargePercentage}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-purple-700">{kpis.rechargePercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Mix</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">Game Revenue</p>
                <p className="text-2xl font-bold text-blue-700">{formatIndianNumber(kpis.totalGameRevenue)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Share</p>
                <p className="text-lg font-semibold text-blue-600">{(100 - kpis.foodPercentage).toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">Food Revenue</p>
                <p className="text-2xl font-bold text-orange-700">{formatIndianNumber(kpis.totalFoodSale)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Share</p>
                <p className="text-lg font-semibold text-orange-600">{kpis.foodPercentage.toFixed(1)}%</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                <span className="text-xl font-bold text-gray-800">{formatIndianNumber(kpis.totalRevenue)}</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="bg-blue-500" style={{ width: `${100 - kpis.foodPercentage}%` }}></div>
                <div className="bg-orange-500" style={{ width: `${kpis.foodPercentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
