import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isToday, isYesterday, isValid } from 'date-fns';
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to Indian Rupee currency format (e.g., ₹ 1,25,000)
 */
export function formatCurrency(amount: number | null | undefined, showSymbol: boolean = true): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  // Format to 2 decimal places or clean integers
  const isInteger = Math.round(num * 100) % 100 === 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);

  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Formats an ISO date string to a user-friendly date (e.g., "27 Aug 2026")
 */
export function formatDate(dateString: string | null | undefined, formatTemplate: string = 'dd MMM yyyy'): string {
  if (!dateString) return '-';
  try {
    const parsed = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(parsed)) return dateString;
    return format(parsed, formatTemplate);
  } catch {
    return dateString;
  }
}

/**
 * Returns today's ISO date string YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates the next sequential unique bill number e.g. BILL-2026-0001
 */
export function generateNextBillNumber(existingBillsCount: number, prefix: string = 'BILL'): string {
  const year = new Date().getFullYear();
  const sequence = String(existingBillsCount + 1).padStart(4, '0');
  return `${prefix}-${year}-${sequence}`;
}

/**
 * Exports tabular data to standard CSV
 */
export function exportToCSV(filename: string, rows: Record<string, any>[], columnHeaders?: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) return;

  const headers = columnHeaders || Object.keys(rows[0]).map(key => ({ key, label: key }));
  
  const csvContent = [
    headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => 
      headers.map(h => {
        const val = row[h.key];
        if (val === null || val === undefined) return '""';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports data to an Excel (.xlsx) file
 */
export function exportToExcel(filename: string, sheetName: string, data: Record<string, any>[]) {
  if (!data || data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Report');
  
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Validates mobile number (10 digits)
 */
export function isValidIndianMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/[^0-9]/g, '');
  return cleaned.length === 10;
}

/**
 * Exports all shop data as a single multi-sheet Excel workbook for weekly backup.
 * Filename: backup_YYYY-WNN.xlsx  (ISO week number)
 */
export function exportWeeklyBackup(data: {
  bills: Record<string, any>[];
  payments: Record<string, any>[];
  customers: Record<string, any>[];
  withdrawals: Record<string, any>[];
}) {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const week = Math.ceil(((today.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  const filename = `shriramwar_backup_${today.getFullYear()}-W${String(week).padStart(2, '0')}.xlsx`;

  const wb = XLSX.utils.book_new();

  const addSheet = (sheetName: string, rows: Record<string, any>[]) => {
    if (rows.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([['No data']]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    } else {
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  };

  addSheet('Bills', data.bills);
  addSheet('Payments', data.payments);
  addSheet('Customers', data.customers);
  addSheet('Withdrawals', data.withdrawals);

  XLSX.writeFile(wb, filename);
}

