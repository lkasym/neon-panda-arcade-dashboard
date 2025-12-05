interface MonthFilterProps {
  selectedMonths: string[];
  setSelectedMonths: (months: string[]) => void;
}

export default function MonthFilter({ selectedMonths, setSelectedMonths }: MonthFilterProps) {
  const months = ['September', 'October', 'November'];
  const allMonthsSelected = selectedMonths.length === 0 || selectedMonths.length === months.length;
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setSelectedMonths([]);
    } else {
      setSelectedMonths([value]);
    }
  };

  const currentValue = allMonthsSelected ? 'all' : selectedMonths[0] || 'all';

  return (
    <div className="relative">
      <select
        value={currentValue}
        onChange={handleChange}
        className="appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm md:text-base font-medium text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
      >
        <option value="all">All Months</option>
        {months.map(month => (
          <option key={month} value={month}>{month}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
}

