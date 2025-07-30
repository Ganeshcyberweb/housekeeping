import React from 'react';

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  subtitle,
  value,
  change,
  icon,
  className = ''
}) => {
  const getChangeStyles = () => {
    if (!change) return '';
    
    switch (change.type) {
      case 'increase':
        return 'bg-green-100 text-green-600';
      case 'decrease':
        return 'bg-red-100 text-red-600';
      case 'neutral':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-md w-64 ${className}`}>
      {/* Header with Icon */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400 ml-3">
            {icon}
          </div>
        )}
      </div>

      {/* Value & Change */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-4xl font-bold text-gray-900">{value}</span>
        {change && (
          <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${getChangeStyles()}`}>
            {change.value}
          </span>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCard;
