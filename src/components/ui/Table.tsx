import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export interface ColumnDefinition<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T extends { id: string | number }> {
  columns: ColumnDefinition<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc';
}

export function Table<T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  className = '',
}: TableProps<T>) {
  const isDark = useThemeStore((state) => state.isDark);
  const [sort, setSort] = useState<SortState>({ key: null, direction: 'asc' });

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;

    if (sort.key === key) {
      setSort({
        key,
        direction: sort.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSort({ key, direction: 'asc' });
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sort.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.key as keyof T];
      const bVal = b[sort.key as keyof T];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [data, sort]);

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center p-8 rounded-lg ${
          isDark ? 'bg-navy-800 border-slate-700' : 'bg-white border-gray-200'
        } border`}
      >
        <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto rounded-lg border ${
        isDark ? 'bg-navy-800 border-slate-700' : 'bg-white border-gray-200'
      } ${className}`}
    >
      <table className="w-full">
        <thead>
          <tr
            className={`${
              isDark ? 'bg-navy-700 border-slate-700' : 'bg-gray-50 border-gray-200'
            } border-b`}
          >
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-6 py-3 text-left text-sm font-semibold ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                } ${column.width || ''} ${column.sortable ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
                onClick={() => handleSort(String(column.key), column.sortable)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <div className="flex items-center">
                      {sort.key === String(column.key) && sort.direction === 'asc' && (
                        <ChevronUp size={16} className="text-cyan-500" />
                      )}
                      {sort.key === String(column.key) && sort.direction === 'desc' && (
                        <ChevronDown size={16} className="text-cyan-500" />
                      )}
                      {sort.key !== String(column.key) && (
                        <div className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
                      )}
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              } ${
                isDark
                  ? `border-slate-700 ${onRowClick ? 'hover:bg-navy-700' : ''}`
                  : `border-gray-200 ${onRowClick ? 'hover:bg-gray-50' : ''}`
              } ${rowIndex !== sortedData.length - 1 ? 'border-b' : ''}`}
            >
              {columns.map((column) => (
                <td
                  key={`${row.id}-${String(column.key)}`}
                  className={`px-6 py-4 text-sm ${
                    isDark ? 'text-slate-300' : 'text-gray-600'
                  }`}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : (row[column.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
