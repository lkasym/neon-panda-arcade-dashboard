'use client';

import { useMemo, useState } from 'react';
import {
  getSalesData,
  filterByMonth,
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
  ComposedChart,
  Area,
} from 'recharts';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import MonthFilter from '@/components/MonthFilter';
import { format } from 'date-fns';

export default function PartiesPage() {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const salesData = getSalesData();
  const filteredData = useMemo(() => {
    return filterByMonth(salesData, selectedMonths);
  }, [salesData, selectedMonths]);

  // Party metrics
  const partyMetrics = useMemo(() => {
    const totalParties = filteredData.reduce((sum, d) => sum + (d.NoOfParties || 0), 0);
    const totalPartyGameSale = filteredData.reduce((sum, d) => sum + (d.PartyGameSale || 0), 0);
    const totalPartyFoodSale = filteredData.reduce((sum, d) => sum + (d.PartyFoodSale || 0), 0);
    const totalPartyRevenue = totalPartyGameSale + totalPartyFoodSale;
    
    const totalGameRevenue = filteredData.reduce((sum, d) => sum + (d.GameRevenue || 0), 0);
    const totalFoodSale = filteredData.reduce((sum, d) => sum + (d.FoodSale || 0), 0);
    const totalRevenue = totalGameRevenue + totalFoodSale;
    
    const avgPartyGameSale = totalParties > 0 ? totalPartyGameSale / totalParties : 0;
    const avgPartyFoodSale = totalParties > 0 ? totalPartyFoodSale / totalParties : 0;
    const avgPartyRevenue = totalParties > 0 ? totalPartyRevenue / totalParties : 0;
    
    const partyRevenuePercent = totalRevenue > 0 ? (totalPartyRevenue / totalRevenue) * 100 : 0;
    const foodPercentInParty = totalPartyRevenue > 0 ? (totalPartyFoodSale / totalPartyRevenue) * 100 : 0;

    return {
      totalParties,
      totalPartyGameSale,
      totalPartyFoodSale,
      totalPartyRevenue,
      avgPartyGameSale,
      avgPartyFoodSale,
      avgPartyRevenue,
      partyRevenuePercent,
      foodPercentInParty,
      totalRevenue,
    };
  }, [filteredData]);

  // Daily party trends
  const dailyPartyTrend = useMemo(() => {
    return filteredData
      .filter(d => (d.NoOfParties || 0) > 0)
      .map(d => {
        let dateStr = d.DateFormatted;
        if (!dateStr && d.Date) {
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + d.Date * 24 * 60 * 60 * 1000);
          dateStr = format(jsDate, 'MMM dd');
        }
        return {
          date: dateStr || '',
          parties: d.NoOfParties || 0,
          gameRevenue: d.PartyGameSale || 0,
          foodRevenue: d.PartyFoodSale || 0,
          totalRevenue: (d.PartyGameSale || 0) + (d.PartyFoodSale || 0),
        };
      })
      .filter(d => d.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // Weekend vs Weekday parties
  const weekendWeekdayParties = useMemo(() => {
    const weekend = ['Saturday', 'Sunday'];
    const weekendData = filteredData.filter(d => weekend.includes(d.Day));
    const weekdayData = filteredData.filter(d => !weekend.includes(d.Day));

    const weekendParties = weekendData.reduce((sum, d) => sum + (d.NoOfParties || 0), 0);
    const weekdayParties = weekdayData.reduce((sum, d) => sum + (d.NoOfParties || 0), 0);
    const weekendRevenue = weekendData.reduce((sum, d) => sum + (d.PartyGameSale || 0) + (d.PartyFoodSale || 0), 0);
    const weekdayRevenue = weekdayData.reduce((sum, d) => sum + (d.PartyGameSale || 0) + (d.PartyFoodSale || 0), 0);

    return [
      {
        name: 'Weekend',
        parties: weekendParties,
        revenue: weekendRevenue,
        avgRevenue: weekendParties > 0 ? weekendRevenue / weekendParties : 0,
      },
      {
        name: 'Weekday',
        parties: weekdayParties,
        revenue: weekdayRevenue,
        avgRevenue: weekdayParties > 0 ? weekdayRevenue / weekdayParties : 0,
      },
    ];
  }, [filteredData]);

  // Day-wise party performance
  const dayWiseParties = useMemo(() => {
    const dayMap: Record<string, { parties: number; revenue: number; count: number }> = {};
    
    filteredData.forEach(d => {
      const day = d.Day || '';
      if (!day) return;
      
      if (!dayMap[day]) {
        dayMap[day] = { parties: 0, revenue: 0, count: 0 };
      }
      dayMap[day].parties += Number(d.NoOfParties) || 0;
      dayMap[day].revenue += (Number(d.PartyGameSale) || 0) + (Number(d.PartyFoodSale) || 0);
      dayMap[day].count += 1;
    });

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return dayOrder
      .filter(day => dayMap[day])
      .map(day => ({
        day: day.substring(0, 3),
        avgParties: dayMap[day].count > 0 ? Math.round(dayMap[day].parties / dayMap[day].count) : 0,
        avgRevenue: dayMap[day].count > 0 ? dayMap[day].revenue / dayMap[day].count : 0,
        totalRevenue: dayMap[day].revenue,
        totalParties: dayMap[day].parties,
      }));
  }, [filteredData]);

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const monthMap: Record<string, { parties: number; gameRevenue: number; foodRevenue: number }> = {};
    
    filteredData.forEach(d => {
      const month = d.Month || '';
      if (!month) return;
      
      if (!monthMap[month]) {
        monthMap[month] = { parties: 0, gameRevenue: 0, foodRevenue: 0 };
      }
      monthMap[month].parties += d.NoOfParties || 0;
      monthMap[month].gameRevenue += d.PartyGameSale || 0;
      monthMap[month].foodRevenue += d.PartyFoodSale || 0;
    });

    return Object.entries(monthMap).map(([month, data]) => ({
      month,
      parties: data.parties,
      gameRevenue: data.gameRevenue,
      foodRevenue: data.foodRevenue,
      totalRevenue: data.gameRevenue + data.foodRevenue,
      avgPerParty: data.parties > 0 ? (data.gameRevenue + data.foodRevenue) / data.parties : 0,
    }));
  }, [filteredData]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Party & Events Revenue
          </h2>
          <p className="text-sm text-gray-600 mt-1">Birthday parties and group bookings</p>
        </div>
        <MonthFilter selectedMonths={selectedMonths} setSelectedMonths={setSelectedMonths} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title="Total Parties"
          value={formatNumber(partyMetrics.totalParties)}
          subtitle="Events hosted"
          icon="🎉"
          color="purple"
        />
        <KPICard
          title="Party Revenue"
          value={formatIndianNumber(partyMetrics.totalPartyRevenue)}
          subtitle={`${partyMetrics.partyRevenuePercent.toFixed(1)}% of total`}
          icon="💰"
          color="green"
        />
        <KPICard
          title="Avg per Party"
          value={`₹${partyMetrics.avgPartyRevenue.toFixed(0)}`}
          subtitle="Game + Food"
          icon="🎯"
          color="blue"
        />
        <KPICard
          title="Food Share"
          value={`${partyMetrics.foodPercentInParty.toFixed(1)}%`}
          subtitle={formatIndianNumber(partyMetrics.totalPartyFoodSale)}
          icon="🍕"
          color="orange"
        />
      </div>

      {/* Key Insights - Prominent */}
      {partyMetrics.totalParties > 0 && (
        <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Key Insights & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
              <p className="text-sm font-bold text-purple-700 mb-2">🎉 Party Contribution</p>
              <p className="text-xs text-gray-700">
                Parties generate <span className="font-bold text-purple-600">{partyMetrics.partyRevenuePercent.toFixed(1)}%</span> of total revenue
                (<span className="font-bold">{formatIndianNumber(partyMetrics.totalPartyRevenue)}</span>) from 
                <span className="font-bold"> {partyMetrics.totalParties}</span> events.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
              <p className="text-sm font-bold text-orange-700 mb-2">🍕 Food Opportunity</p>
              <p className="text-xs text-gray-700">
                Food is <span className="font-bold text-orange-600">{partyMetrics.foodPercentInParty.toFixed(1)}%</span> of party revenue.
                {partyMetrics.foodPercentInParty < 40 
                  ? <span className="text-red-600 font-bold"> Below 40% target - upsell opportunity!</span>
                  : <span className="text-green-600 font-bold"> Strong food attachment ✓</span>
                }
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-bold text-blue-700 mb-2">📅 Booking Pattern</p>
              <p className="text-xs text-gray-700">
                {weekendWeekdayParties[0].parties > weekendWeekdayParties[1].parties 
                  ? `Weekend leads: ${weekendWeekdayParties[0].parties} vs ${weekendWeekdayParties[1].parties} weekday bookings.`
                  : `Weekday strong: ${weekendWeekdayParties[1].parties} bookings.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Game vs Food Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-4">🎮 Party Game Revenue</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white rounded-lg border-2 border-purple-200">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Game Sales</p>
                <p className="text-3xl font-bold text-purple-700">{formatIndianNumber(partyMetrics.totalPartyGameSale)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Avg/Party</p>
                <p className="text-xl font-semibold text-purple-600">₹{partyMetrics.avgPartyGameSale.toFixed(0)}</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Share of Party Revenue</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                    style={{ width: `${100 - partyMetrics.foodPercentInParty}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-purple-700">{(100 - partyMetrics.foodPercentInParty).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
          <h3 className="text-lg font-bold text-orange-900 mb-4">🍕 Party Food Revenue</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white rounded-lg border-2 border-orange-200">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Food Sales</p>
                <p className="text-3xl font-bold text-orange-700">{formatIndianNumber(partyMetrics.totalPartyFoodSale)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Avg/Party</p>
                <p className="text-xl font-semibold text-orange-600">₹{partyMetrics.avgPartyFoodSale.toFixed(0)}</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Share of Party Revenue</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all"
                    style={{ width: `${partyMetrics.foodPercentInParty}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-orange-700">{partyMetrics.foodPercentInParty.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Party Trend */}
      <ChartCard title="Daily Party Revenue Trend" subtitle="Game + Food revenue per day" fullWidth>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={dailyPartyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: 'Parties', angle: 90, position: 'insideRight' }} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'Parties' || name === 'parties') return [formatNumber(value), 'Parties'];
                if (name === 'Game Revenue' || name === 'gameRevenue') return [formatIndianNumber(value), 'Game Revenue'];
                if (name === 'Food Revenue' || name === 'foodRevenue') return [formatIndianNumber(value), 'Food Revenue'];
                return [formatIndianNumber(value), name];
              }}
              contentStyle={{ 
                backgroundColor: 'white', 
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="gameRevenue" fill="#8b5cf6" name="Game Revenue" stackId="a" />
            <Bar yAxisId="left" dataKey="foodRevenue" fill="#f59e0b" name="Food Revenue" stackId="a" />
            <Line yAxisId="right" type="monotone" dataKey="parties" stroke="#10b981" strokeWidth={3} name="Parties" />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Weekend vs Weekday */}
        <ChartCard title="Weekend vs Weekday Parties" subtitle="Booking patterns">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={weekendWeekdayParties}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 11 }} 
                label={{ value: 'Parties', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => Math.round(value).toString()}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 11 }} 
                label={{ value: 'Avg Revenue (₹)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Total Parties' || name === 'parties') return [Math.round(value).toString(), 'Total Parties'];
                  if (name === 'Avg Revenue/Party' || name === 'avgRevenue') return [formatIndianNumber(value), 'Avg Revenue/Party'];
                  return [formatIndianNumber(value), name];
                }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="parties" fill="#8b5cf6" name="Total Parties" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgRevenue" fill="#10b981" name="Avg Revenue/Party" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Day-wise Party Performance */}
        <ChartCard title="Day-wise Party Performance" subtitle="Average parties and revenue per day">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={dayWiseParties}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 11 }} 
                label={{ value: 'Avg Parties', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => Math.round(value).toString()}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 11 }} 
                label={{ value: 'Avg Revenue (₹)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Avg Parties/Day' || name === 'avgParties') return [Math.round(value).toString(), 'Avg Parties/Day'];
                  if (name === 'Avg Revenue/Day' || name === 'avgRevenue') return [formatIndianNumber(value), 'Avg Revenue/Day'];
                  if (name === 'Total Parties' || name === 'totalParties') return [Math.round(value).toString(), 'Total Parties'];
                  return [formatIndianNumber(value), name];
                }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="avgParties" fill="#ec4899" name="Avg Parties/Day" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgRevenue" stroke="#3b82f6" strokeWidth={3} name="Avg Revenue/Day" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Monthly Breakdown Table */}
      <ChartCard title="Monthly Party Breakdown" subtitle="Detailed performance by month" fullWidth>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Month
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Parties
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Game Revenue
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Food Revenue
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Total Revenue
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Avg/Party
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyBreakdown.map((month, idx) => (
                <tr key={idx} className="hover:bg-purple-50 transition-colors">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {month.month}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-semibold">
                    {formatNumber(month.parties)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatIndianNumber(month.gameRevenue)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatIndianNumber(month.foodRevenue)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                    {formatIndianNumber(month.totalRevenue)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">
                    ₹{month.avgPerParty.toFixed(0)}
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

