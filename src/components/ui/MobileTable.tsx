'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, MoreVertical, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import MobileCard from './MobileCard';

interface MobileTableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  primary?: boolean; // Show in compact view
  secondary?: boolean; // Show when expanded
}

interface MobileTableProps<T = any> {
  data: T[];
  columns: MobileTableColumn<T>[];
  title?: string;
  searchable?: boolean;
  sortable?: boolean;
  expandable?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export default function MobileTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchable = true,
  sortable = true,
  expandable = true,
  onRowClick,
  emptyMessage = 'No data available',
  className
}: MobileTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (!sortable) return;
    
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const primaryColumns = columns.filter(col => col.primary);
  const secondaryColumns = columns.filter(col => col.secondary);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {(title || searchable) && (
        <div className="flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          )}
          
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Table Content */}
      <div className="space-y-2">
        {sortedData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">{emptyMessage}</p>
          </div>
        ) : (
          sortedData.map((item, index) => {
            const isExpanded = expandedRows.has(index);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <MobileCard
                  clickable={!!onRowClick}
                  onClick={() => onRowClick?.(item)}
                  className="p-0 overflow-hidden"
                >
                  {/* Primary Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        {primaryColumns.map(column => {
                          const value = item[column.key];
                          return (
                            <div key={column.key} className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">{column.label}</span>
                              <div className="text-white font-medium">
                                {column.render ? column.render(value, item) : String(value)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {(expandable && secondaryColumns.length > 0) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(index);
                          }}
                          className="ml-3 p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Content */}
                  <AnimatePresence>
                    {isExpanded && secondaryColumns.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-700/50"
                      >
                        <div className="p-4 space-y-2">
                          {secondaryColumns.map(column => {
                            const value = item[column.key];
                            return (
                              <div key={column.key} className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">{column.label}</span>
                                <div className="text-white text-sm">
                                  {column.render ? column.render(value, item) : String(value)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </MobileCard>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Sort Controls */}
      {sortable && sortedData.length > 0 && (
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-2">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <select
              value={sortField || ''}
              onChange={(e) => setSortField(e.target.value || null)}
              className="bg-slate-700 border border-slate-600 rounded text-white text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Default</option>
              {columns.filter(col => col.sortable).map(column => (
                <option key={column.key} value={column.key}>
                  {column.label}
                </option>
              ))}
            </select>
            
            {sortField && (
              <button
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                {sortDirection === 'asc' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized mobile market table
interface MobileMarketTableProps {
  data: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    marketCap?: number;
  }>;
  title?: string;
  type?: 'stocks' | 'crypto';
}

export function MobileMarketTable({ 
  data, 
  title = 'Markets', 
  type = 'stocks' 
}: MobileMarketTableProps) {
  const columns: MobileTableColumn[] = [
    {
      key: 'symbol',
      label: 'Symbol',
      primary: true,
      render: (value, item) => (
        <div>
          <div className="font-semibold">{value}</div>
          <div className="text-xs text-gray-400 truncate">{item.name}</div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      primary: true,
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      key: 'change',
      label: 'Change',
      primary: true,
      sortable: true,
      render: (value, item) => (
        <div className={`text-right ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <div className="font-semibold">
            {value >= 0 ? '+' : ''}${value.toFixed(2)}
          </div>
          <div className="text-xs">
            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
          </div>
        </div>
      )
    },
    {
      key: 'volume',
      label: 'Volume',
      secondary: true,
      render: (value) => value ? `${(value / 1000000).toFixed(1)}M` : 'N/A'
    },
    {
      key: 'marketCap',
      label: 'Market Cap',
      secondary: true,
      render: (value) => value ? `$${(value / 1000000000).toFixed(1)}B` : 'N/A'
    }
  ];

  return (
    <MobileTable
      data={data}
      columns={columns}
      title={title}
      searchable={true}
      sortable={true}
      expandable={true}
      emptyMessage={`No ${type} data available`}
    />
  );
}