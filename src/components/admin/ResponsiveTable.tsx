'use client'

import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ResponsiveTableProps {
  headers: string[]
  children: ReactNode
  className?: string
}

interface ResponsiveTableRowProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

interface ResponsiveTableCellProps {
  children: ReactNode
  label?: string // For mobile view
  className?: string
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  children,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="text-left py-3 px-4 text-gray-300 font-medium text-sm uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {children}
      </div>
    </div>
  )
}

const ResponsiveTableRow: React.FC<ResponsiveTableRowProps> = ({
  children,
  onClick,
  className = ''
}) => {
  return (
    <>
      {/* Desktop Row */}
      <motion.tr
        onClick={onClick}
        className={`
          hidden md:table-row border-b border-white/5 hover:bg-white/5 transition-colors
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        whileHover={onClick ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
      >
        {children}
      </motion.tr>

      {/* Mobile Card */}
      <motion.div
        onClick={onClick}
        className={`
          md:hidden bg-white/5 border border-white/10 rounded-lg p-4 
          ${onClick ? 'cursor-pointer hover:bg-white/10' : ''}
          ${className}
        `}
        whileHover={onClick ? { scale: 1.01 } : {}}
        whileTap={onClick ? { scale: 0.99 } : {}}
      >
        <div className="space-y-3">
          {children}
        </div>
      </motion.div>
    </>
  )
}

const ResponsiveTableCell: React.FC<ResponsiveTableCellProps> = ({
  children,
  label,
  className = ''
}) => {
  return (
    <>
      {/* Desktop Cell */}
      <td className={`hidden md:table-cell py-3 px-4 ${className}`}>
        {children}
      </td>

      {/* Mobile Cell */}
      <div className="md:hidden flex justify-between items-center">
        {label && (
          <span className="text-gray-400 text-sm font-medium min-w-0 flex-shrink-0 mr-3">
            {label}:
          </span>
        )}
        <div className={`flex-1 text-right ${className}`}>
          {children}
        </div>
      </div>
    </>
  )
}

export { ResponsiveTable, ResponsiveTableRow, ResponsiveTableCell }