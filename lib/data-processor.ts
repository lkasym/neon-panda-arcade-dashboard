import salesData from '@/data/sales.json';
import salesMixData from '@/data/salesmix.json';
import rechargeData from '@/data/recharge.json';
import arcadeData from '@/data/arcade.json';

// Activity square footage mapping
export const ACTIVITY_SQFT: Record<string, number> = {
  'Trampoline': 9000,
  'BOWLING': 5000,
  'BOWLING ': 5000,
  'Laser Tag': 2200,
  'Shooting': 400,
  'Hyper Grid': 400,
  'Rope Course': 1200,
  'ROPE COURSE': 1200,
  'Sky Rider': 500,
  'SKY RIDER': 500,
  'Cricket': 500,
  'SOFT PLAY': 2500,
  'SOFT PLAY ': 2500,
  'Gravity Glide': 700,
  'Panda Climb': 500,
  'PANDA CLIMB': 500,
  'PANDA CLIMB ': 500,
  'Pool Report': 200,
  'POOL REPORT': 200,
  'POOL REPORT ': 200,
  'Arcade': 2000,
  'VR Zone': 500,
  'VR': 500,
};

// Recharge level groupings
export const RECHARGE_SLABS = {
  '1000': [1000],
  '3000': [3000],
  '6000': [6000],
  '12000': [12000],
  '25000': [25000],
  'Variable': [] as number[]
};

export interface SalesRecord {
  Date: number;
  Month: string;
  Day: string;
  GameRevenue: number;
  FoodSale: number;
  Footfall: number;
  Consumption_ArcadeCredit: number;
  Consumption_ArcadeBonus: number;
  DateFormatted?: string;
}

export interface SalesMixRecord {
  Date: number;
  Month: string;
  Day: string;
  Activity: string;
  Variant: string;
  'REVENUE ': number;
  'QUANTITY ': number;
  DateFormatted?: string;
}

export interface RechargeRecord {
  Date: number;
  Month: string;
  Cashier: string;
  Recharge_Type: string;
  Recharge_Level: number;
  Quantity: number;
  Amount: number;
  DateFormatted?: string;
}

export interface ArcadeRecord {
  'DATE ': number;
  Month: string;
  DAY: string;
  'GAME NAME FINAL': string;
  'GAME NAME': string;
  'Type of Game': string;
  QTY: number;
  CREDIT: number;
  'BONUS ': number;
  Total: number;
  DateFormatted?: string;
}

// Get all data
export function getSalesData(): SalesRecord[] {
  return salesData as SalesRecord[];
}

// Calculate card issuance metrics
export function getCardIssuanceMetrics(salesData: SalesRecord[], rechargeData: RechargeRecord[]) {
  const totalNewCards = salesData.reduce((sum, d) => sum + (d.NewCards || 0), 0);
  const totalRechargeCards = salesData.reduce((sum, d) => sum + (d.RechargeCards || 0), 0);
  const totalCards = totalNewCards + totalRechargeCards;
  
  const rechargePercentage = totalCards > 0 ? (totalRechargeCards / totalCards) * 100 : 0;
  
  // New card revenue
  const newCardRevenue = rechargeData
    .filter(r => (r.Recharge_Type || '').includes('CARD ISSUE'))
    .reduce((sum, r) => sum + (r.Amount || 0), 0);
  
  // Recharge card revenue
  const rechargeCardRevenue = rechargeData
    .filter(r => (r.Recharge_Type || '').includes('RECHARGE CARD'))
    .reduce((sum, r) => sum + (r.Amount || 0), 0);
  
  return {
    totalNewCards,
    totalRechargeCards,
    totalCards,
    rechargePercentage,
    newCardRevenue,
    rechargeCardRevenue,
  };
}

export function getSalesMixData(): SalesMixRecord[] {
  return salesMixData as SalesMixRecord[];
}

export function getRechargeData(): RechargeRecord[] {
  return rechargeData as RechargeRecord[];
}

export function getArcadeData(): ArcadeRecord[] {
  return arcadeData as ArcadeRecord[];
}

// Filter by month
export function filterByMonth<T extends { Month: string }>(data: T[], months: string[]): T[] {
  if (months.length === 0) return data;
  return data.filter(d => months.includes(d.Month));
}

// Filter by date range
export function filterByDateRange<T extends { DateFormatted?: string }>(data: T[], startDate?: string, endDate?: string): T[] {
  if (!startDate && !endDate) return data;
  return data.filter(d => {
    if (!d.DateFormatted) return false;
    if (startDate && d.DateFormatted < startDate) return false;
    if (endDate && d.DateFormatted > endDate) return false;
    return true;
  });
}

// Calculate weekend vs weekday
export function getWeekendWeekdaySplit(data: SalesRecord[]) {
  const weekend = ['Saturday', 'Sunday'];
  const weekendData = data.filter(d => weekend.includes(d.Day));
  const weekdayData = data.filter(d => !weekend.includes(d.Day));
  
  const weekendRevenue = weekendData.reduce((sum, d) => sum + d.GameRevenue, 0);
  const weekdayRevenue = weekdayData.reduce((sum, d) => sum + d.GameRevenue, 0);
  const totalRevenue = weekendRevenue + weekdayRevenue;
  
  return {
    weekend: {
      revenue: weekendRevenue,
      footfall: weekendData.reduce((sum, d) => sum + d.Footfall, 0),
      percentage: totalRevenue > 0 ? (weekendRevenue / totalRevenue) * 100 : 0
    },
    weekday: {
      revenue: weekdayRevenue,
      footfall: weekdayData.reduce((sum, d) => sum + d.Footfall, 0),
      percentage: totalRevenue > 0 ? (weekdayRevenue / totalRevenue) * 100 : 0
    }
  };
}

// Activity revenue aggregation
export function getActivityRevenue(data: SalesMixRecord[]) {
  const activityMap: Record<string, { revenue: number; quantity: number }> = {};
  
  data.forEach(record => {
    let activity = (record.Activity || '').trim();
    if (!activity || activity === 'GRAND TOTAL') return;
    
    // Normalize activity names
    activity = activity.replace(/\s+/g, ' ').trim();
    
    // Handle case variations
    const normalizedActivity = Object.keys(ACTIVITY_SQFT).find(
      key => key.toLowerCase() === activity.toLowerCase()
    ) || activity;
    
    if (!activityMap[normalizedActivity]) {
      activityMap[normalizedActivity] = { revenue: 0, quantity: 0 };
    }
    activityMap[normalizedActivity].revenue += record['REVENUE '] || 0;
    activityMap[normalizedActivity].quantity += record['QUANTITY '] || 0;
  });
  
  return Object.entries(activityMap)
    .map(([activity, metrics]) => ({
      activity,
      revenue: metrics.revenue || 0,
      quantity: metrics.quantity || 0,
      revenuePerSqft: ACTIVITY_SQFT[activity] ? (metrics.revenue || 0) / ACTIVITY_SQFT[activity] : 0
    }))
    .filter(a => a.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

// Recharge level grouping
export function getRechargeBySlab(data: RechargeRecord[]) {
  const slabMap: Record<string, { revenue: number; quantity: number }> = {};
  
  data.forEach(record => {
    const level = record.Recharge_Level;
    let slab = 'Variable';
    
    if (level === 1000) slab = '1000';
    else if (level === 3000) slab = '3000';
    else if (level === 6000) slab = '6000';
    else if (level === 12000) slab = '12000';
    else if (level === 25000) slab = '25000';
    
    if (!slabMap[slab]) {
      slabMap[slab] = { revenue: 0, quantity: 0 };
    }
    slabMap[slab].revenue += record.Amount || 0;
    slabMap[slab].quantity += record.Quantity || 0;
  });
  
  return Object.entries(slabMap)
    .map(([slab, metrics]) => ({
      slab,
      revenue: metrics.revenue,
      quantity: metrics.quantity
    }))
    .sort((a, b) => {
      const order = ['1000', '3000', '6000', '12000', '25000', 'Variable'];
      return order.indexOf(a.slab) - order.indexOf(b.slab);
    });
}

// Spender segmentation
export function getSpenderSegmentation(data: RechargeRecord[]) {
  const segments = {
    low: { revenue: 0, quantity: 0, count: 0 },
    mid: { revenue: 0, quantity: 0, count: 0 },
    high: { revenue: 0, quantity: 0, count: 0 }
  };
  
  data.forEach(record => {
    const level = record.Recharge_Level;
    if (level >= 1000 && level <= 3000) {
      segments.low.revenue += record.Amount || 0;
      segments.low.quantity += record.Quantity || 0;
      segments.low.count += 1;
    } else if (level > 3000 && level <= 12000) {
      segments.mid.revenue += record.Amount || 0;
      segments.mid.quantity += record.Quantity || 0;
      segments.mid.count += 1;
    } else if (level > 12000) {
      segments.high.revenue += record.Amount || 0;
      segments.high.quantity += record.Quantity || 0;
      segments.high.count += 1;
    }
  });
  
  return segments;
}

// Arcade machine performance
export function getMachinePerformance(data: ArcadeRecord[]) {
  const machineMap: Record<string, {
    credit: number;
    bonus: number;
    total: number;
    quantity: number;
    type: string;
  }> = {};
  
  data.forEach(record => {
    const gameName = record['GAME NAME FINAL'] || record['GAME NAME'] || '';
    if (!gameName) return;
    
    if (!machineMap[gameName]) {
      machineMap[gameName] = {
        credit: 0,
        bonus: 0,
        total: 0,
        quantity: 0,
        type: record['Type of Game'] || 'Arcade'
      };
    }
    
    machineMap[gameName].credit += record.CREDIT || 0;
    machineMap[gameName].bonus += record['BONUS '] || 0;
    machineMap[gameName].total += record.Total || 0;
    machineMap[gameName].quantity += record.QTY || 0;
  });
  
  return Object.entries(machineMap)
    .map(([gameName, metrics]) => ({
      gameName,
      ...metrics,
      avgPerPlay: metrics.quantity > 0 ? metrics.total / metrics.quantity : 0
    }))
    .sort((a, b) => b.total - a.total);
}

// Arcade vs VR split
export function getArcadeVRSplit(data: ArcadeRecord[]) {
  const arcade = data.filter(d => (d['Type of Game'] || '').toLowerCase() === 'arcade');
  const vr = data.filter(d => (d['Type of Game'] || '').toLowerCase() === 'vr');
  
  return {
    arcade: {
      credit: arcade.reduce((sum, d) => sum + (d.CREDIT || 0), 0),
      bonus: arcade.reduce((sum, d) => sum + (d['BONUS '] || 0), 0),
      quantity: arcade.reduce((sum, d) => sum + (d.QTY || 0), 0)
    },
    vr: {
      credit: vr.reduce((sum, d) => sum + (d.CREDIT || 0), 0),
      bonus: vr.reduce((sum, d) => sum + (d['BONUS '] || 0), 0),
      quantity: vr.reduce((sum, d) => sum + (d.QTY || 0), 0)
    }
  };
}

