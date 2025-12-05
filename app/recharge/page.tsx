'use client';

import { useMemo, useState } from 'react';
import {
  getRechargeData,
  getSalesData,
  filterByMonth,
  getRechargeBySlab,
  getSpenderSegmentation,
  getCardIssuanceMetrics,
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
  ComposedChart,
  Line,
} from 'recharts';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import MonthFilter from '@/components/MonthFilter';

export default function RechargePage() {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const rechargeData = getRechargeData();
  const salesData = getSalesData();
  
  const filteredData = useMemo(() => {
    return filterByMonth(rechargeData, selectedMonths);
  }, [rechargeData, selectedMonths]);

  const filteredSales = useMemo(() => {
    return filterByMonth(salesData, selectedMonths);
  }, [salesData, selectedMonths]);

  const rechargeBySlab = useMemo(() => {
    return getRechargeBySlab(filteredData);
  }, [filteredData]);

  const spenderSegmentation = useMemo(() => {
    return getSpenderSegmentation(filteredData);
  }, [filteredData]);

  const cardMetrics = useMemo(() => {
    return getCardIssuanceMetrics(filteredSales, filteredData);
  }, [filteredSales, filteredData]);

  // Calculate KPIs
  const totalRechargeRevenue = filteredData.reduce((sum, r) => sum + (r.Amount || 0), 0);
  const totalRechargeEntries = filteredData.length; // Number of recharge entries
  const totalCardsRecharged = filteredData.reduce((sum, r) => sum + (r.Quantity || 0), 0); // Total cards
  const avgRechargeValue = totalRechargeEntries > 0 ? totalRechargeRevenue / totalRechargeEntries : 0;
  const avgPerCard = totalCardsRecharged > 0 ? totalRechargeRevenue / totalCardsRecharged : 0;
  const topSlab = rechargeBySlab.reduce((max, slab) => 
    slab.revenue > max.revenue ? slab : max
  , rechargeBySlab[0] || { slab: 'N/A', revenue: 0 });

  // Recharge type comparison
  const rechargeTypeData = useMemo(() => {
    const typeMap: Record<string, { revenue: number; quantity: number }> = {};
    
    filteredData.forEach(record => {
      const type = record.Recharge_Type?.trim() || '';
      if (!type || type === 'GRAND TOTAL') return;
      
      if (!typeMap[type]) {
        typeMap[type] = { revenue: 0, quantity: 0 };
      }
      typeMap[type].revenue += record.Amount || 0;
      typeMap[type].quantity += record.Quantity || 0;
    });
    
    return Object.entries(typeMap).map(([type, data]) => ({
      type: type.replace('CARD', '').replace('ISSUE', 'Issue').replace('RECHARGE', 'Recharge').trim(),
      revenue: data.revenue,
      quantity: data.quantity,
    }));
  }, [filteredData]);

  // Cashier performance
  const cashierPerformance = useMemo(() => {
    const cashierMap: Record<string, { revenue: number; quantity: number; count: number }> = {};
    
    filteredData.forEach(record => {
      const cashier = record.Cashier || '';
      if (!cashier) return;
      
      if (!cashierMap[cashier]) {
        cashierMap[cashier] = { revenue: 0, quantity: 0, count: 0 };
      }
      cashierMap[cashier].revenue += record.Amount || 0;
      cashierMap[cashier].quantity += record.Quantity || 0;
      cashierMap[cashier].count += 1;
    });
    
    return Object.entries(cashierMap)
      .map(([cashier, data]) => ({
        cashier,
        revenue: data.revenue,
        quantity: data.quantity,
        count: data.count,
        avgTransaction: data.count > 0 ? data.revenue / data.count : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // Spender segmentation data
  const segmentationData = [
    { name: 'Low', fullName: 'Low (₹1K-3K)', value: spenderSegmentation.low.revenue, count: spenderSegmentation.low.count },
    { name: 'Mid', fullName: 'Mid (₹3K-12K)', value: spenderSegmentation.mid.revenue, count: spenderSegmentation.mid.count },
    { name: 'High', fullName: 'High (₹12K+)', value: spenderSegmentation.high.revenue, count: spenderSegmentation.high.count },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Recharge Behavior
          </h2>
          <p className="text-sm text-gray-600 mt-1">Card Sales & Customer Segmentation</p>
        </div>
        <MonthFilter selectedMonths={selectedMonths} setSelectedMonths={setSelectedMonths} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title="Total Recharge"
          value={formatIndianNumber(totalRechargeRevenue)}
          subtitle="Card sales revenue"
          icon="💰"
          color="green"
        />
        <KPICard
          title="Cards Recharged"
          value={formatNumber(totalCardsRecharged)}
          subtitle={`${formatNumber(totalRechargeEntries)} entries`}
          icon="💳"
          color="blue"
        />
        <KPICard
          title="Avg per Card"
          value={`₹${avgPerCard.toFixed(0)}`}
          subtitle="Average recharge"
          icon="📊"
          color="purple"
        />
        <KPICard
          title="Repeat Rate"
          value={`${cardMetrics.rechargePercentage.toFixed(1)}%`}
          subtitle="Customer retention"
          icon="⭐"
          color="orange"
        />
      </div>

      {/* Key Insights - Prominent */}
      <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">💡</span> Key Insights & Growth Opportunities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
            <p className="text-sm font-bold text-indigo-700 mb-2">⭐ Customer Retention</p>
            <p className="text-xs text-gray-700">
              <span className="font-bold text-indigo-600">{cardMetrics.rechargePercentage.toFixed(1)}%</span> of customers return for recharges.
              {cardMetrics.rechargePercentage > 50 
                ? <span className="block mt-1 text-green-600 font-bold">✓ Strong retention rate!</span>
                : <span className="block mt-1 text-orange-600 font-bold">→ Improve loyalty programs</span>
              }
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
            <p className="text-sm font-bold text-purple-700 mb-2">💳 Top Recharge Slab</p>
            <p className="text-xs text-gray-700">
              <span className="font-bold text-purple-600">{topSlab.slab}</span> slab leads with 
              <span className="font-bold"> {formatIndianNumber(topSlab.revenue)}</span>.
              <span className="block mt-1 text-purple-600 font-bold">
                → Promote this value package
              </span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
            <p className="text-sm font-bold text-pink-700 mb-2">📊 Average Value</p>
            <p className="text-xs text-gray-700">
              Avg per card: <span className="font-bold text-pink-600">₹{avgPerCard.toFixed(0)}</span>
              <span className="block mt-1 text-pink-600 font-bold">
                Target higher slabs for upsell
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* New Card vs Recharge Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">New Card Issuance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div>
                <p className="text-sm font-medium text-gray-600">Cards Issued</p>
                <p className="text-3xl font-bold text-green-700">{formatNumber(cardMetrics.totalNewCards)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-xl font-semibold text-green-600">{formatIndianNumber(cardMetrics.newCardRevenue)}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Average per card</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{cardMetrics.totalNewCards > 0 ? (cardMetrics.newCardRevenue / cardMetrics.totalNewCards).toFixed(0) : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recharge Cards</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div>
                <p className="text-sm font-medium text-gray-600">Cards Recharged</p>
                <p className="text-3xl font-bold text-blue-700">{formatNumber(cardMetrics.totalRechargeCards)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-xl font-semibold text-blue-600">{formatIndianNumber(cardMetrics.rechargeCardRevenue)}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Average per recharge</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{cardMetrics.totalRechargeCards > 0 ? (cardMetrics.rechargeCardRevenue / cardMetrics.totalRechargeCards).toFixed(0) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ChartCard title="Recharge Level Distribution" subtitle="Revenue by slab">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={rechargeBySlab}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="slab" tick={{ fontSize: 11 }} />
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
              <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="quantity" stroke="#10b981" strokeWidth={3} name="Quantity" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spender Segmentation" subtitle="Customer value tiers">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={segmentationData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number) => formatIndianNumber(value)}
                labelFormatter={(label) => {
                  const item = segmentationData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {segmentationData.map((entry, index) => (
                  <text 
                    key={index}
                    x={0}
                    y={0}
                    fill="#666"
                    fontSize={12}
                    textAnchor="middle"
                  >
                    {entry.count} txns
                  </text>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            {segmentationData.map((seg, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded">
                <p className="font-semibold text-gray-700">{seg.name}</p>
                <p className="text-xs text-gray-500">{seg.count} entries</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Recharge Type Comparison */}
      <ChartCard title="Recharge Type Comparison" subtitle="Issue vs Recharge vs Variable" fullWidth>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rechargeTypeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="type" tick={{ fontSize: 11 }} />
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
            <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="quantity" fill="#10b981" name="Quantity" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Cashier Performance Table */}
      <ChartCard title="Cashier Performance" subtitle="Sales team contribution" fullWidth>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  #
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Cashier
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Revenue
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Quantity
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Entries
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Avg/Entry
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cashierPerformance.map((cashier, idx) => (
                <tr key={idx} className="hover:bg-purple-50 transition-colors">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {idx + 1}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cashier.cashier}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatIndianNumber(cashier.revenue)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatNumber(cashier.quantity)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {cashier.count}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-semibold">
                    ₹{cashier.avgTransaction.toFixed(0)}
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
