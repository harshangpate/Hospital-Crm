'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  width?: string;
}

interface AnimatedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
  loading?: boolean;
}

export default function AnimatedTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  className = '',
  loading = false,
}: AnimatedTableProps<T>) {
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm">
            <tr>
              {columns.map((column, index) => (
                <motion.th
                  key={String(column.key)}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.header}
                </motion.th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence mode="popLayout">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <motion.tr
                    key={`skeleton-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-6 py-4">
                        <motion.div
                          className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                          animate={{
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: index * 0.1,
                          }}
                        />
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : data.length === 0 ? (
                // Empty state
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No data available
                  </td>
                </motion.tr>
              ) : (
                // Data rows
                data.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      delay: index * 0.03,
                      duration: 0.3,
                    }}
                    whileHover={{
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      scale: 1.01,
                    }}
                    onClick={() => onRowClick?.(item)}
                    className={`
                      transition-colors
                      ${onRowClick ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10' : ''}
                    `}
                  >
                    {columns.map((column) => (
                      <motion.td
                        key={String(column.key)}
                        className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 + 0.1 }}
                      >
                        {column.render
                          ? column.render(item)
                          : String(item[column.key as keyof T] || '-')}
                      </motion.td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
