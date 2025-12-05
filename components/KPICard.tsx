interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
}

export default function KPICard({ title, value, subtitle, icon, trend, color = 'blue' }: KPICardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    gray: 'from-gray-500 to-gray-600',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    orange: 'bg-orange-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    gray: 'bg-gray-100',
  };

  return (
    <div className="glass-card rounded-xl p-5 md:p-6 hover:shadow-xl transition-all duration-300 hover:scale-102 animate-fade-in">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
        {icon && (
          <span className={`text-2xl md:text-3xl ${iconBgClasses[color]} p-2 rounded-lg`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent mb-2 break-words`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
      )}
      {trend && (
        <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
          trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
