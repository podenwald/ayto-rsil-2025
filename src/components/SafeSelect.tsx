import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ErrorBoundary from './ErrorBoundary';

interface SafeSelectItem {
  id: string | number;
  name: string;
  value?: string;
  disabled?: boolean;
  className?: string;
}

interface SafeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  items: SafeSelectItem[];
  className?: string;
  disabled?: boolean;
}

const SafeSelect: React.FC<SafeSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Auswählen...",
  items = [],
  className = "",
  disabled = false
}) => {
  // Validate and sanitize items
  const safeItems = React.useMemo(() => {
    return items
      .filter(item => item && (item.id !== null && item.id !== undefined))
      .map(item => ({
        id: String(item.id),
        name: String(item.name || 'Unbekannt'),
        value: String(item.value || item.name || ''),
        disabled: Boolean(item.disabled),
        className: String(item.className || '')
      }));
  }, [items]);

  const handleValueChange = React.useCallback((newValue: string) => {
    try {
      onValueChange(newValue);
    } catch (error) {
      console.error('Error in SafeSelect onValueChange:', error);
    }
  }, [onValueChange]);

  return (
    <ErrorBoundary
      fallback={
        <div className="h-14 bg-gray-100 border-2 border-gray-300 rounded-xl flex items-center px-3 text-gray-500">
          Fehler beim Laden der Auswahl
        </div>
      }
    >
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={`h-14 bg-white/90 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {safeItems.map((item) => (
            <SelectItem 
              key={item.id} 
              value={item.value}
              disabled={item.disabled}
              className={item.className}
            >
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ErrorBoundary>
  );
};

export default SafeSelect;
