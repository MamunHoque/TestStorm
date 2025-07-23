import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportGenerator } from '../../utils/reportGenerator';

interface ExportButtonProps {
  data: any;
  filename: string;
  className?: string;
  disabled?: boolean;
}

type ExportFormat = 'json' | 'csv' | 'pdf';

export function ExportButton({ data, filename, className = '', disabled = false }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      format: 'json' as ExportFormat,
      label: 'JSON',
      icon: File,
      description: 'Structured data format',
      mimeType: 'application/json',
    },
    {
      format: 'csv' as ExportFormat,
      label: 'CSV',
      icon: FileSpreadsheet,
      description: 'Spreadsheet format',
      mimeType: 'text/csv',
    },
    {
      format: 'pdf' as ExportFormat,
      label: 'PDF',
      icon: FileText,
      description: 'Professional report',
      mimeType: 'application/pdf',
    },
  ];

  const convertToCSV = (data: any): string => {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );
      
      return [csvHeaders, ...csvRows].join('\n');
    } else {
      // Convert single object to CSV
      const headers = Object.keys(data);
      const values = Object.values(data);
      return `${headers.join(',')}\n${values.join(',')}`;
    }
  };

  const generatePDF = async (data: any): Promise<Blob> => {
    // Simple PDF generation - in a real app, you'd use a library like jsPDF
    const content = `
      Load Test Report
      ================
      
      Generated: ${new Date().toLocaleString()}
      
      ${JSON.stringify(data, null, 2)}
    `;
    
    return new Blob([content], { type: 'application/pdf' });
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      await ReportGenerator.downloadReport(
        Array.isArray(data) ? data : [data],
        format,
        filename,
        (progress) => {
          // Could show progress indicator here
          console.log(`Export progress: ${progress}%`);
        }
      );
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        whileHover={!disabled && !isExporting ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isExporting ? { scale: 0.98 } : {}}
      >
        {isExporting ? (
          <>
            <motion.div
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-2">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2 px-2">
                Choose export format:
              </div>
              {exportFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <motion.button
                    key={format.format}
                    onClick={() => handleExport(format.format)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {format.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}