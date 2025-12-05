'use client';

import { useMemo, useState } from 'react';
import {
  getArcadeData,
  filterByMonth,
  getMachinePerformance,
  getArcadeVRSplit,
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
} from 'recharts';
import KPICard from '@/components/KPICard';
import ChartCard from '@/components/ChartCard';
import MonthFilter from '@/components/MonthFilter';

export default function ArcadePage() {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [gameTypeFilter, setGameTypeFilter] = useState<string>('All');

  const arcadeData = getArcadeData();
  const filteredData = useMemo(() => {
    let data = filterByMonth(arcadeData, selectedMonths);
    if (gameTypeFilter !== 'All') {
      data = data.filter(d => 
        (d['Type of Game'] || '').toLowerCase() === gameTypeFilter.toLowerCase()
      );
    }
    return data;
  }, [arcadeData, selectedMonths, gameTypeFilter]);

  const machinePerformance = useMemo(() => {
    return getMachinePerformance(filteredData);
  }, [filteredData]);

  const arcadeVRSplit = useMemo(() => {
    return getArcadeVRSplit(filteredData);
  }, [filteredData]);

  // Calculate KPIs
  const totalCredit = machinePerformance.reduce((sum, m) => sum + m.credit, 0);
  const totalBonus = machinePerformance.reduce((sum, m) => sum + m.bonus, 0);
  const totalRevenue = totalCredit + totalBonus;
  const bonusRatio = totalCredit > 0 ? (totalBonus / totalCredit) * 100 : 0;
  const topMachine = machinePerformance[0];

  // Top machines for charts
  const topMachines = machinePerformance.slice(0, 12);

  // Arcade vs VR split data
  const splitData = [
    {
      name: 'Arcade',
      revenue: arcadeVRSplit.arcade.credit + arcadeVRSplit.arcade.bonus,
    },
    {
      name: 'VR',
      revenue: arcadeVRSplit.vr.credit + arcadeVRSplit.vr.bonus,
    },
  ];

  // Underperforming machines (revenue < 1000)
  const underperformingMachines = machinePerformance.filter(m => m.total < 1000);

  // Machines with >50% bonus
  const highBonusMachines = machinePerformance.filter(m => {
    const bonusPercent = m.credit > 0 ? (m.bonus / m.credit) * 100 : 0;
    return bonusPercent > 50;
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Arcade & VR Machines
          </h2>
          <p className="text-sm text-gray-600 mt-1">Machine Performance & Utilization</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <select
              value={gameTypeFilter}
              onChange={(e) => setGameTypeFilter(e.target.value)}
              className="appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm md:text-base font-medium text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="All">All Types</option>
              <option value="Arcade">Arcade Only</option>
              <option value="VR">VR Only</option>
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
          title="Total Revenue"
          value={formatIndianNumber(totalRevenue)}
          subtitle="Credit + Bonus"
          icon="💰"
          color="green"
        />
        <KPICard
          title="Top Machine"
          value={topMachine ? topMachine.gameName.substring(0, 12) : 'N/A'}
          subtitle={topMachine ? formatIndianNumber(topMachine.total) : ''}
          icon="🏆"
          color="orange"
        />
        <KPICard
          title="Bonus Ratio"
          value={`${bonusRatio.toFixed(1)}%`}
          subtitle={formatIndianNumber(totalBonus)}
          icon="🎁"
          color="purple"
        />
        <KPICard
          title="Machines"
          value={machinePerformance.length}
          subtitle={underperformingMachines.length > 0 ? `${underperformingMachines.length} need attention` : 'All performing'}
          icon="🎮"
          color={underperformingMachines.length > 0 ? 'red' : 'blue'}
        />
      </div>

      {/* Key Insights - Prominent */}
      <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-300">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">💡</span> Key Insights & Action Items
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
            <p className="text-sm font-bold text-orange-700 mb-2">🏆 Top Machine</p>
            <p className="text-xs text-gray-700">
              <span className="font-bold text-orange-600">{topMachine?.gameName}</span> generates 
              <span className="font-bold"> {formatIndianNumber(topMachine?.total || 0)}</span>.
              <span className="block mt-1 text-orange-600 font-bold">
                → {((topMachine?.total || 0) / totalRevenue * 100).toFixed(1)}% of arcade revenue
              </span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
            <p className="text-sm font-bold text-red-700 mb-2">⚠️ Issues Found</p>
            <p className="text-xs text-gray-700">
              {underperformingMachines.length > 0 && (
                <>
                  <span className="font-bold text-red-600">{underperformingMachines.length} low performers</span> (&lt;₹1K)
                  <span className="block mt-1 text-red-600 font-bold">→ Replace or relocate</span>
                </>
              )}
              {highBonusMachines.length > 0 && (
                <>
                  <span className="font-bold text-orange-600">{highBonusMachines.length} high bonus</span> (&gt;50%)
                  <span className="block mt-1 text-orange-600 font-bold">→ Review bonus settings</span>
                </>
              )}
              {underperformingMachines.length === 0 && highBonusMachines.length === 0 && (
                <span className="text-green-600 font-bold">✓ All machines performing well!</span>
              )}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-amber-500">
            <p className="text-sm font-bold text-amber-700 mb-2">🎮 Bonus Utilization</p>
            <p className="text-xs text-gray-700">
              Bonus ratio: <span className="font-bold text-amber-600">{bonusRatio.toFixed(1)}%</span>
              <span className="block mt-1">
                {bonusRatio > 35 
                  ? <span className="text-red-600 font-bold">⚠️ High bonus usage - optimize settings</span>
                  : bonusRatio > 25 
                    ? <span className="text-orange-600 font-bold">→ Monitor bonus levels</span>
                    : <span className="text-green-600 font-bold">✓ Healthy bonus ratio</span>
                }
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Alert for high bonus machines */}
      {highBonusMachines.length > 0 && (
        <div className="glass-card rounded-xl p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-orange-900 mb-1">
                High Bonus Alert: {highBonusMachines.length} Machine(s)
              </p>
              <p className="text-sm text-orange-800">
                The following machines have &gt;50% bonus usage: {highBonusMachines.map(m => m.gameName).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ChartCard title="Top Machines by Revenue" subtitle="Top 12 performers">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topMachines}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis 
                dataKey="gameName" 
                type="category" 
                width={80} 
                tick={{ fontSize: 9 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'credit') return [formatIndianNumber(value), 'Credit'];
                  if (name === 'bonus') return [formatIndianNumber(value), 'Bonus'];
                  return [formatIndianNumber(value), name];
                }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="credit" fill="#3b82f6" name="Credit" stackId="a" />
              <Bar dataKey="bonus" fill="#8b5cf6" name="Bonus" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Arcade vs VR Revenue" subtitle="Total revenue split">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={splitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number) => formatIndianNumber(value)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Arcade</p>
              <p className="text-2xl font-bold text-blue-700">{formatIndianNumber(arcadeVRSplit.arcade.credit + arcadeVRSplit.arcade.bonus)}</p>
              <p className="text-xs text-gray-500 mt-1">{arcadeVRSplit.arcade.quantity} plays</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">VR</p>
              <p className="text-2xl font-bold text-purple-700">{formatIndianNumber(arcadeVRSplit.vr.credit + arcadeVRSplit.vr.bonus)}</p>
              <p className="text-xs text-gray-500 mt-1">{arcadeVRSplit.vr.quantity} plays</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Machine Performance Table */}
      <ChartCard title="Complete Machine Performance" subtitle="All machines with metrics" fullWidth>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  #
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                  Machine
                </th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                  Type
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Credit
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Bonus
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Total
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                  Plays
                </th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {machinePerformance.map((machine, idx) => {
                const bonusPercent = machine.credit > 0 ? (machine.bonus / machine.credit) * 100 : 0;
                const isHighBonus = bonusPercent > 50;
                const isLowPerformer = machine.total < 1000;
                
                return (
                  <tr 
                    key={idx} 
                    className={`hover:bg-orange-50 transition-colors ${
                      isLowPerformer ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {machine.gameName}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        (machine.type || 'Arcade').toLowerCase() === 'vr' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {machine.type || 'Arcade'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-semibold">
                      {formatIndianNumber(machine.credit)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-semibold">
                      {formatIndianNumber(machine.bonus)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-bold">
                      {formatIndianNumber(machine.total)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {formatNumber(machine.quantity)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      {isLowPerformer && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          ⚠️ Low
                        </span>
                      )}
                      {isHighBonus && !isLowPerformer && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          ⚡ High Bonus
                        </span>
                      )}
                      {!isHighBonus && !isLowPerformer && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ✓ Good
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(underperformingMachines.length > 0 || highBonusMachines.length > 0) && (
          <div className="mt-4 space-y-2">
            {underperformingMachines.length > 0 && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm">
                <p className="font-semibold text-red-900">
                  ⚠️ {underperformingMachines.length} Low Performers (&lt;₹1K revenue)
                </p>
                <p className="text-red-800 mt-1">Consider maintenance, relocation, or replacement.</p>
              </div>
            )}
            {highBonusMachines.length > 0 && (
              <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded text-sm">
                <p className="font-semibold text-orange-900">
                  ⚡ {highBonusMachines.length} High Bonus Machines (&gt;50% bonus)
                </p>
                <p className="text-orange-800 mt-1">Review bonus settings to optimize revenue.</p>
              </div>
            )}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
