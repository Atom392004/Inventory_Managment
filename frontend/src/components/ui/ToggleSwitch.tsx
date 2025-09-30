import React from 'react';
import { clsx } from 'clsx';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function ToggleSwitch({ checked, onChange, disabled = false, className, label }: ToggleSwitchProps) {
  return (
    <label className={clsx('inline-flex items-center cursor-pointer', disabled && 'cursor-not-allowed', className)}>
      {label && (
        <span className={clsx('mr-3 text-sm font-medium', disabled ? 'text-gray-400' : 'text-gray-700')}>
          {label}
        </span>
      )}
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={clsx(
            'block w-10 h-6 rounded-full transition-colors',
            checked ? 'bg-blue-600' : 'bg-gray-300',
            disabled && 'bg-gray-200'
          )}
        />
        <div
          className={clsx(
            'absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </div>
    </label>
  );
}
