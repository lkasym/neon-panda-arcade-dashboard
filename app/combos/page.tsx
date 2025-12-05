'use client';

import { useMemo, useState } from 'react';
import {
  getSalesMixData,
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
} from 'recharts';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import MonthFilter from '@/components/MonthFilter';
import { format } from 'date-fns';

export default function CombosPage() {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const salesMixData = getSalesMixData();
  const filteredData = useMemo(() => {
    return filterByMonth(salesMixData, selectedMonths);
  }, [salesMixData, selectedMonths]);

  // Identify combos - STRICT: Only true multi-activity packages
  const { comboData, singleData } = useMemo(() => {
    const combos: any[] = [];
    const singles: any[] = [];

    filteredData.forEach(record => {
      const variant = (record.Variant || '');
      const variantLower = variant.toLowerCase();
      
      // Exclude non-combo items first
      const isExcluded = (
        variantLower.includes('card') ||  // Recharge cards
        variantLower.includes('recharge') ||  // Recharge entries
        variantLower.includes('parent/guardian') ||  // Extra parent tickets
        variantLower.includes('parent/gaurdian') ||  // Typo version
        variantLower.includes('extra parent') ||
        variantLower.includes('complimentary') ||  // Free entries
        variantLower.includes('socks') ||  // Merchandise
        variantLower.includes('massage chair') ||  // Not an activity
        /^\d+\s*min/.test(variantLower) ||  // Single time-based (30 min, 60 min)
        /^\d+\s*over/.test(variantLower) ||  // Single cricket overs
        /^\d+\s*shots/.test(variantLower) ||  // Single shooting
        /^\d+\s*magazine/.test(variantLower)  // Single shooting magazines
      );
      
      if (isExcluded) {
        singles.push(record);
        return;
      }
      
      // TRUE combos: Explicit multi-activity packages ONLY
      const isCombo = (
        // "Big Thrill Combo" or "Combo Punch"
        (variantLower.includes('combo') && (
          variantLower.includes('thrill') ||
          variantLower.includes('punch')
        )) ||
        
        // Multiple activities with "/" (e.g., Bowling/Laser Tag/Trampoline)
        // Must have at least 2 activity names separated by /
        (/bowling.*\/.*laser|laser.*\/.*trampoline|trampoline.*\/.*bowling|skyrider.*\/.*gravity/i.test(variant)) ||
        
        // Party packages with multiple activities
        (variantLower.includes('party') && variantLower.includes(' + '))
      );
      
      if (isCombo) {
        combos.push(record);
      } else {
        singles.push(record);
      }
    });

    return { comboData: combos, singleData: singles };
  }, [filteredData]);

  // Combo performance metrics
  const comboMetrics = useMemo(() => {
    const comboRevenue = comboData.reduce((sum, r) => {
      const rev = Number(r['REVENUE ']) || 0;
      return sum + rev;
    }, 0);
    const comboQuantity = comboData.reduce((sum, r) => {
      const qty = Number(r['QUANTITY ']) || 0;
      return sum + qty;
    }, 0);
    const singleRevenue = singleData.reduce((sum, r) => {
      const rev = Number(r['REVENUE ']) || 0;
      return sum + rev;
    }, 0);
    const singleQuantity = singleData.reduce((sum, r) => {
      const qty = Number(r['QUANTITY ']) || 0;
      return sum + qty;
    }, 0);
    const totalRevenue = comboRevenue + singleRevenue;

    // Calculate averages safely
    const avgComboValue = comboQuantity > 0 ? comboRevenue / comboQuantity : 0;
    const avgSingleValue = singleQuantity > 0 ? singleRevenue / singleQuantity : 0;

    return {
      comboRevenue,
      comboQuantity,
      singleRevenue,
      singleQuantity,
      totalRevenue,
      comboPercent: totalRevenue > 0 ? (comboRevenue / totalRevenue) * 100 : 0,
      avgComboValue,
      avgSingleValue,
      hasValidData: comboRevenue > 0 && singleRevenue > 0, // Both should have data
    };
  }, [comboData, singleData]);

  // All combos (for complete table)
  const allCombos = useMemo(() => {
    const comboMap: Record<string, { revenue: number; quantity: number; activity: string }> = {};

    comboData.forEach(record => {
      const variant = record.Variant || '';
      const activity = record.Activity || '';
      if (!variant) return;

      const key = `${activity}::${variant}`;
      if (!comboMap[key]) {
        comboMap[key] = { revenue: 0, quantity: 0, activity };
      }
      comboMap[key].revenue += Number(record['REVENUE ']) || 0;
      comboMap[key].quantity += Number(record['QUANTITY ']) || 0;
    });

    return Object.entries(comboMap)
      .map(([key, data]) => ({
        activity: data.activity,
        variant: key.split('::')[1],
        revenue: data.revenue,
        quantity: data.quantity,
        avgValue: data.quantity > 0 ? data.revenue / data.quantity : 0,
      }))
      .sort((a, b) => {
        // Sort by revenue descending, but put zero-revenue at the very bottom
        if (a.revenue === 0 && b.revenue > 0) return 1;
        if (b.revenue === 0 && a.revenue > 0) return -1;
        return b.revenue - a.revenue;
      });
  }, [comboData]);

  // Top combos (for chart - only with revenue)
  const topCombos = useMemo(() => {
    return allCombos
      .filter(c => c.revenue > 0)
      .slice(0, 15);
  }, [allCombos]);

  // Low performing combos (bottom 10 by revenue)
  const lowPerformingCombos = useMemo(() => {
    const comboMap: Record<string, { revenue: number; quantity: number }> = {};

    comboData.forEach(record => {
      const variant = record.Variant || '';
      if (!variant) return;

      if (!comboMap[variant]) {
        comboMap[variant] = { revenue: 0, quantity: 0 };
      }
      comboMap[variant].revenue += Number(record['REVENUE ']) || 0;
      comboMap[variant].quantity += Number(record['QUANTITY ']) || 0;
    });

    return Object.entries(comboMap)
      .map(([variant, data]) => ({
        variant,
        revenue: data.revenue,
        quantity: data.quantity,
      }))
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 10);
  }, [comboData]);

  // Combo vs Single trend over time
  const trendData = useMemo(() => {
    const dateMap: Record<string, { combo: number; single: number }> = {};

    // Process combo data
    comboData.forEach(record => {
      let dateStr = record.DateFormatted;
      if (!dateStr && record.Date) {
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + record.Date * 24 * 60 * 60 * 1000);
        dateStr = format(jsDate, 'MMM dd');
      }
      if (!dateStr) return;

      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { combo: 0, single: 0 };
      }
      dateMap[dateStr].combo += Number(record['REVENUE ']) || 0;
    });

    // Process single data
    singleData.forEach(record => {
      let dateStr = record.DateFormatted;
      if (!dateStr && record.Date) {
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + record.Date * 24 * 60 * 60 * 1000);
        dateStr = format(jsDate, 'MMM dd');
      }
      if (!dateStr) return;

      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { combo: 0, single: 0 };
      }
      dateMap[dateStr].single += Number(record['REVENUE ']) || 0;
    });

    return Object.entries(dateMap)
      .map(([date, data]) => ({
        date,
        combo: data.combo,
        single: data.single,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [comboData, singleData]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Combo & Package Performance
          </h2>
          <p className="text-sm text-gray-600 mt-1">Multi-activity package analysis</p>
        </div>
        <MonthFilter selectedMonths={selectedMonths} setSelectedMonths={setSelectedMonths} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title="Combo Revenue"
          value={formatIndianNumber(comboMetrics.comboRevenue)}
          subtitle={`${comboMetrics.comboPercent.toFixed(1)}% of total`}
          icon="🎁"
          color="green"
        />
        <KPICard
          title="Combo Sales"
          value={formatNumber(comboMetrics.comboQuantity)}
          subtitle="Packages sold"
          icon="📦"
          color="blue"
        />
        <KPICard
          title="Avg Combo Value"
          value={`₹${comboMetrics.avgComboValue.toFixed(0)}`}
          subtitle="Per combo"
          icon="💰"
          color="purple"
        />
        <KPICard
          title="vs Single Activity"
          value={comboMetrics.hasValidData && comboMetrics.avgSingleValue > 0
            ? `+${((comboMetrics.avgComboValue / comboMetrics.avgSingleValue - 1) * 100).toFixed(0)}%`
            : comboMetrics.avgComboValue > 0 ? '✓ Available' : 'N/A'
          }
          subtitle={comboMetrics.hasValidData 
            ? (comboMetrics.avgComboValue > comboMetrics.avgSingleValue ? 'Higher value' : 'Similar value')
            : 'Combo-only data'
          }
          icon="📊"
          color={comboMetrics.avgComboValue > comboMetrics.avgSingleValue ? 'green' : 'blue'}
        />
      </div>

      {/* Key Insights - Prominent */}
      {comboMetrics.comboRevenue > 0 && (
        <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Key Insights & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <p className="text-sm font-bold text-green-700 mb-2">✅ Combo Performance</p>
              <p className="text-xs text-gray-700">
                Combos generate <span className="font-bold text-green-600">{comboMetrics.comboPercent.toFixed(1)}%</span> of activity revenue with 
                <span className="font-bold"> {formatNumber(comboMetrics.comboQuantity)}</span> packages sold.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-bold text-blue-700 mb-2">💰 Value Analysis</p>
              <p className="text-xs text-gray-700">
                Average combo value: <span className="font-bold text-blue-600">₹{comboMetrics.avgComboValue.toFixed(0)}</span>
                {comboMetrics.hasValidData && comboMetrics.avgSingleValue > 0 && (
                  <>
                    <span> vs single: </span>
                    <span className="font-bold">₹{comboMetrics.avgSingleValue.toFixed(0)}</span>
                    {comboMetrics.avgComboValue > comboMetrics.avgSingleValue && (
                      <span className="text-green-600 font-bold"> (+{((comboMetrics.avgComboValue / comboMetrics.avgSingleValue - 1) * 100).toFixed(0)}%)</span>
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
              <p className="text-sm font-bold text-orange-700 mb-2">🎯 Action Required</p>
              <p className="text-xs text-gray-700">
                {lowPerformingCombos.length > 0 
                  ? `${lowPerformingCombos.length} low-performing combos need review or removal.`
                  : 'All combos performing well. Consider new package offers.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Combo vs Single Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <h3 className="text-lg font-bold text-green-900 mb-4">💎 Combo Packages</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Revenue</span>
              <span className="text-2xl font-bold text-green-700">{formatIndianNumber(comboMetrics.comboRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Quantity</span>
              <span className="text-xl font-bold text-green-600">{formatNumber(comboMetrics.comboQuantity)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Avg Value</span>
              <span className="text-xl font-bold text-green-600">₹{comboMetrics.avgComboValue.toFixed(0)}</span>
            </div>
            <div className="pt-3 border-t border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenue Share</span>
                <span className="text-lg font-bold text-green-800">{comboMetrics.comboPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4">🎯 Single Activities</h3>
          {comboMetrics.singleRevenue > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Revenue</span>
                <span className="text-2xl font-bold text-blue-700">{formatIndianNumber(comboMetrics.singleRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Quantity</span>
                <span className="text-xl font-bold text-blue-600">{formatNumber(comboMetrics.singleQuantity)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Avg Value</span>
                <span className="text-xl font-bold text-blue-600">₹{comboMetrics.avgSingleValue.toFixed(0)}</span>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue Share</span>
                  <span className="text-lg font-bold text-blue-800">{(100 - comboMetrics.comboPercent).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">
                All activity revenue is from combo packages.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                No standalone single-activity sales detected in the selected period.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Combo vs Single Trend */}
      {trendData.length > 0 && (
        <ChartCard title="Combo vs Single Revenue Trend" subtitle="Daily performance comparison" fullWidth>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={trendData}>
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
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="combo" fill="#10b981" name="Combo Revenue" radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey="single" stroke="#3b82f6" strokeWidth={3} name="Single Revenue" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Combos */}
        <ChartCard title="Top Performing Combos" subtitle="Best revenue generators">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topCombos.slice(0, 10)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis 
                dataKey="variant" 
                type="category" 
                width={110} 
                tick={{ fontSize: 9 }}
              />
              <Tooltip 
                formatter={(value: number) => formatIndianNumber(value)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Low Performing Combos */}
        <ChartCard title="Low Performing Combos" subtitle="Need review or removal">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={lowPerformingCombos}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis 
                dataKey="variant" 
                type="category" 
                width={110} 
                tick={{ fontSize: 9 }}
              />
              <Tooltip 
                formatter={(value: number) => formatIndianNumber(value)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="revenue" fill="#ef4444" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Combo Table */}
      <ChartCard title="All Combo Packages" subtitle="Complete performance breakdown" fullWidth>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  #
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Activity
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Combo Package
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Revenue
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Sold
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Avg Value
                </th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allCombos.map((combo, idx) => {
                const isZeroRevenue = combo.revenue === 0 && combo.quantity > 0;
                const isFirstZeroRevenue = isZeroRevenue && idx > 0 && allCombos[idx - 1].revenue > 0;
                
                return (
                  <>
                    {isFirstZeroRevenue && (
                      <tr key={`separator-${idx}`} className="bg-yellow-50">
                        <td colSpan={7} className="px-4 md:px-6 py-2 text-xs font-semibold text-yellow-800 text-center">
                          ⚠️ Zero Revenue Combos (May be complimentary, data entry issues, or revenue recorded elsewhere)
                        </td>
                      </tr>
                    )}
                    <tr key={idx} className={`transition-colors ${isZeroRevenue ? 'hover:bg-red-50 bg-red-50/30' : 'hover:bg-green-50'}`}>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {idx + 1}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isZeroRevenue 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {combo.activity}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-700 max-w-md">
                        {combo.variant}
                      </td>
                      <td className={`px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        isZeroRevenue ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {combo.revenue === 0 ? '₹0' : formatIndianNumber(combo.revenue)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {formatNumber(combo.quantity)}
                      </td>
                      <td className={`px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        isZeroRevenue ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {combo.avgValue === 0 ? '₹0' : `₹${combo.avgValue.toFixed(0)}`}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                        {isZeroRevenue ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            ⚠️ Inactive
                          </span>
                        ) : combo.revenue > 0 && idx < 5 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            ⭐ Top
                          </span>
                        ) : combo.revenue > 0 && combo.revenue < (comboMetrics.comboRevenue / allCombos.filter(c => c.revenue > 0).length) * 0.5 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                            📉 Below Avg
                          </span>
                        ) : combo.revenue > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            ✓ Good
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            ⚠️ Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

    </div>
  );
}

