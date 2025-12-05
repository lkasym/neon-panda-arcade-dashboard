import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  fullWidth?: boolean;
}

export default function ChartCard({ title, subtitle, children, fullWidth = false }: ChartCardProps) {
  return (
    <div className={`glass-card rounded-xl p-4 md:p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in ${
      fullWidth ? 'col-span-full' : ''
    }`}>
      <div className="mb-4">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs md:text-sm text-gray-500 mt-1 ml-3">{subtitle}</p>
        )}
      </div>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

