import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-[#717171]" />
      </div>
      <h3 className="text-xl font-bold text-[#191919] mb-2">{title}</h3>
      <p className="text-[#717171] max-w-sm mb-8">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
