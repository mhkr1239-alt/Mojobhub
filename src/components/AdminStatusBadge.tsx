import React from 'react';
import { getStatusMeta } from '../lib/applicationUtils';

interface AdminStatusBadgeProps {
  status?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({
  status,
  className = '',
  size = 'sm',
}) => {
  const meta = getStatusMeta(status);
  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${meta.textColor} ${meta.bgColor} ${meta.borderColor} ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {meta.label}
    </span>
  );
};
