import React, { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  icon?: ReactNode;
  className?: string;
  gradient?: boolean;
  children: ReactNode;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  icon,
  className = '',
  gradient = false,
  children
}) => {
  return (
    <div className={`bg-white shadow-md rounded-xl overflow-hidden ${className}`}>
      <div className={`px-6 py-4 ${gradient ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-white border-b border-gray-100'}`}>
        <h2 className={`text-lg font-medium flex items-center ${gradient ? 'text-white' : 'text-gray-800'}`}>
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardSection;