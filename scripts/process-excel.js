const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbook = XLSX.readFile('INDORE DATA BASE (2).xlsx');

// Sheet 1: Sales data
const sheet1 = workbook.Sheets['Sales data'];
const sheet1Raw = XLSX.utils.sheet_to_json(sheet1, { header: 1, defval: null });

let headerRowIndex = 0;
for (let i = 0; i < sheet1Raw.length; i++) {
  if (sheet1Raw[i] && (sheet1Raw[i][0] === 'Date' || (typeof sheet1Raw[i][0] === 'number' && sheet1Raw[i][1] === 'September'))) {
    headerRowIndex = i;
    break;
  }
}

if (typeof sheet1Raw[headerRowIndex][0] === 'number') {
  headerRowIndex = headerRowIndex - 1;
}

const sheet1Data = [];
for (let i = headerRowIndex + 1; i < sheet1Raw.length; i++) {
  const row = sheet1Raw[i];
  if (!row || !row[0] || typeof row[0] !== 'number') continue;
  
  sheet1Data.push({
    Date: row[0],
    Month: row[1],
    Day: row[2],
    GameRevenue: row[3] || 0,
    Consumption_Void: row[4] || 0,
    Consumption_PercentUsed: row[5] || 0,
    Consumption_ArcadeCredit: row[6] || 0,
    Consumption_ArcadeBonus: row[7] || 0,
    FoodSale: row[9] || 0,
    Footfall: row[10] || 0,
    TotalCardsPurchased: row[11] || 0,
    NewCards: row[12] || 0,
    RechargeCards: row[13] || 0,
    NewCardSale: row[14] || 0,
    RechargeCardSale: row[15] || 0,
    FoodSalePercent: row[16] || 0,
    AvgSalesPerFootfall: row[17] || 0,
    AvgSalesPerCard: row[18] || 0,
    AvgSaleNewCard: row[19] || 0,
    AvgSaleRechargeCard: row[20] || 0,
    PartyGameSale: row[21] || 0,
    PartyFoodSale: row[22] || 0,
    NoOfParties: row[23] || 0,
    AvgGameSaleOfParty: row[24] || 0,
    AvgFoodSaleOfParty: row[25] || 0,
    ReviewsReceived: row[26] || 0,
    StaffAttendance: row[27] || 0,
    MachineDowntimeMinutes: row[28] || 0,
    RefundsIssued: row[29] || 0,
    RefundsValue: row[30] || 0,
    StaffRostered: row[31] || 0
  });
}

// Sheet 2: Sales mix
const sheet2 = workbook.Sheets['Sales mix'];
const sheet2Data = XLSX.utils.sheet_to_json(sheet2, { 
  range: 1,
  defval: null 
}).filter(r => r.Date && r.Activity && r.Activity !== 'GRAND TOTAL' && r.Activity !== 'GRAND TOTAL ');

// Sheet 3: Recharge data
const sheet3 = workbook.Sheets['Recharge data'];
const sheet3Data = XLSX.utils.sheet_to_json(sheet3, { defval: null })
  .filter(r => r.Date && r.Recharge_Type && r.Recharge_Type !== 'GRAND TOTAL ');

// Sheet 4: ARCADE
const sheet4 = workbook.Sheets['ARCADE'];
const sheet4Data = XLSX.utils.sheet_to_json(sheet4, { 
  range: 1,
  defval: null 
}).filter(r => r['DATE '] && r['GAME NAME FINAL']);

// Convert Excel dates to ISO strings
const excelDateToJSDate = (excelDate) => {
  if (!excelDate || typeof excelDate !== 'number') return null;
  const excelEpoch = new Date(1899, 11, 30);
  const jsDate = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
  return jsDate.toISOString().split('T')[0];
};

sheet1Data.forEach(r => r.DateFormatted = excelDateToJSDate(r.Date));
sheet2Data.forEach(r => r.DateFormatted = excelDateToJSDate(r.Date));
sheet3Data.forEach(r => r.DateFormatted = excelDateToJSDate(r.Date));
sheet4Data.forEach(r => r.DateFormatted = excelDateToJSDate(r['DATE ']));

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Save cleaned data
fs.writeFileSync(path.join(dataDir, 'sales.json'), JSON.stringify(sheet1Data, null, 2));
fs.writeFileSync(path.join(dataDir, 'salesmix.json'), JSON.stringify(sheet2Data, null, 2));
fs.writeFileSync(path.join(dataDir, 'recharge.json'), JSON.stringify(sheet3Data, null, 2));
fs.writeFileSync(path.join(dataDir, 'arcade.json'), JSON.stringify(sheet4Data, null, 2));

console.log('✅ Data processed and saved to data/ directory');
console.log(`   - Sales: ${sheet1Data.length} records`);
console.log(`   - Sales Mix: ${sheet2Data.length} records`);
console.log(`   - Recharge: ${sheet3Data.length} records`);
console.log(`   - Arcade: ${sheet4Data.length} records`);

