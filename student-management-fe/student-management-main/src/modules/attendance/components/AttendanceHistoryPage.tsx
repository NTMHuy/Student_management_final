'use client';

import React, { useState } from 'react';
import { AttendanceHistoryFilters } from '@/modules/attendance/components/AttendanceHistoryFilters';
import { AttendanceHistoryTable } from '@/modules/attendance/components/AttendanceHistoryTable';
import { initialAttendanceHistory } from '@/modules/attendance/mocks/attendance.mock';
import { AttendanceHistoryFiltersState } from '@/modules/attendance/types';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import {
  Download,
  CalendarCheck,
  ChevronLeft,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';

export default function AttendanceHistoryPage() {
  const [items, setItems] = useState(initialAttendanceHistory);
  const [filters, setFilters] = useState<AttendanceHistoryFiltersState>({
    search: '',
    className: '10A1',
    dateRange: '01/05/2024 - 17/05/2024',
    status: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (newFilters: Partial<AttendanceHistoryFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleReset = () => {
    setFilters({
      search: '',
      className: '10A1',
      dateRange: '01/05/2024 - 17/05/2024',
      status: 'all',
    });
  };

  const handleExport = () => {
    alert('Đang trích xuất lịch sử điểm danh định dạng Excel (.xlsx)...');
  };

  return (
    
      <div className="flex flex-col gap-6">
        {/* Header Section with Navigation Back */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <Link
                href="/attendance"
                className="flex items-center gap-1 text-secondary hover:underline font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Quay lại Điểm danh hôm nay
              </Link>
              <span className="w-1 h-1 rounded-full bg-outline" />
              <span>Thống kê Chuyên cần</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Lịch sử &amp; Thống kê Điểm danh
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold text-xs">
                Toàn trường
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Truy cứu nhật ký điểm danh theo ngày, theo lớp và theo từng học sinh. Theo dõi tỷ lệ chuyên cần và xuất báo cáo cho ban giám hiệu.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-colors text-xs sm:text-sm font-semibold cursor-pointer border border-outline-variant/20"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất sổ tổng hợp (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <AttendanceHistoryFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Tabular History Ledger */}
        <div className="flex flex-col">
          <AttendanceHistoryTable items={items} />
          <Pagination
            currentPage={currentPage}
            totalPages={4}
            totalItems={36}
            pageSize={10}
            onPageChange={setCurrentPage}
            itemLabel="lượt điểm danh"
          />
        </div>
      </div>
    
  );
}
