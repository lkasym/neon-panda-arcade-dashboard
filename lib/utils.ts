// Format numbers in Indian numbering system
export function formatIndianNumber(num: number | null | undefined): string {
  // Handle invalid inputs
  if (num === null || num === undefined || typeof num !== 'number' || isNaN(num)) {
    return '₹0';
  }
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 10000000) {
    return `${sign}₹${(absNum / 10000000).toFixed(2)}Cr`;
  } else if (absNum >= 100000) {
    return `${sign}₹${(absNum / 100000).toFixed(2)}L`;
  } else if (absNum >= 1000) {
    return `${sign}₹${(absNum / 1000).toFixed(0)}K`;
  }
  return `${sign}₹${absNum.toFixed(0)}`;
}

export function formatNumber(num: number | null | undefined): string {
  // Handle invalid inputs
  if (num === null || num === undefined || typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 10000000) {
    return `${sign}${(absNum / 10000000).toFixed(2)}Cr`;
  } else if (absNum >= 100000) {
    return `${sign}${(absNum / 100000).toFixed(2)}L`;
  } else if (absNum >= 1000) {
    return `${sign}${(absNum / 1000).toFixed(0)}K`;
  }
  return `${sign}${absNum.toFixed(0)}`;
}

export function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined || typeof num !== 'number' || isNaN(num)) {
    return '₹0';
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

