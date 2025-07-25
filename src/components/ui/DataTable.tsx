'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import Input from './Input';
import Button from './Button';

export interface Column<T = any> {
  key: string;
  header: string;
  accessor?: keyof T | ((item: T) => any);
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;
  showSelection?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  sortable = true,
  pagination = true,
  itemsPerPage = 10,
  loading = false,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  selectedRows = [],
  onSelectionChange,
  showSelection = false
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Search filtering
    if (searchTerm && searchable) {
      filtered = filtered.filter(item =>
        columns.some(column => {
          if (!column.searchable) return false;
          
          const value = column.accessor 
            ? typeof column.accessor === 'function'
              ? column.accessor(item)
              : item[column.accessor]
            : item[column.key];
            
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Sorting
    if (sortField && sortable) {
      const column = columns.find(col => col.key === sortField);
      if (column) {
        filtered.sort((a, b) => {
          const aValue = column.accessor 
            ? typeof column.accessor === 'function'
              ? column.accessor(a)
              : a[column.accessor]
            : a[column.key];
            
          const bValue = column.accessor 
            ? typeof column.accessor === 'function'
              ? column.accessor(b)
              : b[column.accessor]
            : b[column.key];

          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    return filtered;
  }, [data, columns, searchTerm, sortField, sortDirection, searchable, sortable]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage, pagination]);

  // Sorting handlers
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortField === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(columnKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortField !== columnKey) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-400" />
      : <ArrowDown className="w-4 h-4 text-blue-400" />;
  };

  // Selection handlers
  const isSelected = (item: T) => {
    return selectedRows.some(selected => 
      JSON.stringify(selected) === JSON.stringify(item)
    );
  };

  const handleSelectRow = (item: T) => {
    if (!onSelectionChange) return;
    
    const newSelection = isSelected(item)
      ? selectedRows.filter(selected => JSON.stringify(selected) !== JSON.stringify(item))
      : [...selectedRows, item];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    const allSelected = paginatedData.every(item => isSelected(item));
    const newSelection = allSelected
      ? selectedRows.filter(selected => 
          !paginatedData.some(item => JSON.stringify(item) === JSON.stringify(selected))
        )
      : [...selectedRows, ...paginatedData.filter(item => !isSelected(item))];
    
    onSelectionChange(newSelection);
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-700 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      {searchable && (
        <div className="flex items-center gap-4">
          <Input
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          {selectedRows.length > 0 && (
            <div className="text-sm text-gray-400">
              {selectedRows.length} selected
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                {showSelection && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={paginatedData.length > 0 && paginatedData.every(item => isSelected(item))}
                      onChange={handleSelectAll}
                      className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sortable && 'cursor-pointer hover:bg-slate-600/50 transition-colors'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-700/50">
              {paginatedData.map((item, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    'hover:bg-slate-700/30 transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected(item) && 'bg-blue-500/10'
                  )}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {showSelection && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected(item)}
                        onChange={() => handleSelectRow(item)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  
                  {columns.map((column) => {
                    const value = column.accessor 
                      ? typeof column.accessor === 'function'
                        ? column.accessor(item)
                        : item[column.accessor]
                      : item[column.key];

                    return (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3 text-sm text-gray-300',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.render ? column.render(value, item, index) : String(value)}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, processedData.length)} to{' '}
            {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}