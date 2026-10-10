'use client';

import React, { useEffect, useState } from 'react';
import { AttendanceHistoryFilters } from '@/modules/attendance/components/AttendanceHistoryFilters';
import { AttendanceHistoryTable } from '@/modules/attendance/components/AttendanceHistoryTable';
import { useAttendanceHistory } from '@/modules/attendance/hooks/useAttendance';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { ChevronLeft, Download } from 'lucide-react';

const STATUS_TEXT = { present: 'Có mặt', excused: 'Vắng có phép', unexcused: 'Vắng không phép', late: 'Đi muộn' } as const;

export default function AttendanceHistoryPage() {
  const { classOptions, optionsError, items, isLoading, error, filters, setFilters, reset } = useAttendanceHistory();
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.classId, filters.from, filters.to, filters.status, filters.search]);

  const handleExport = () => {
    const header = ['Ngày', 'Buổi', 'Lớp', 'Môn', 'Mã HS', 'Họ và tên', 'Trạng thái', 'GV điểm danh', 'Ghi chú'];
    const rows = items.map((i) => [
      i.dateStr, i.session, i.className, i.subjectName, i.studentCode, i.fullName,
      STATUS_TEXT[i.status], i.teacherName, i.note,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `lich-su-diem-danh-${filters.from}_${filters.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <Link href="/attendance" className="flex items-center gap-1 text-secondary hover:underline font-semibold">
              <ChevronLeft className="w-3.5 h-3.5" />
              Quay lại Điểm danh
            </Link>
            <span className="w-1 h-1 rounded-full bg-outline" />
            <span>Thống kê Chuyên cần</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Lịch sử &amp; Thống kê Điểm danh</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            Tra cứu nhật ký điểm danh theo lớp, khoảng ngày và trạng thái. Giáo viên chỉ xem được các lớp mình chủ nhiệm hoặc được phân công.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={items.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-colors text-xs sm:text-sm font-semibold cursor-pointer border border-outline-variant/20 disabled:opacity-50 self-start"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Xuất CSV</span>
        </button>
      </div>

      <AttendanceHistoryFilters
        filters={filters}
        classes={classOptions}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={reset}
      />

      {(error || optionsError) && (
        <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error ?? optionsError}</p>
      )}

      <div className="flex flex-col">
        <AttendanceHistoryTable items={pageItems} isLoading={isLoading} startIndex={(currentPage - 1) * pageSize} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={items.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="lượt điểm danh"
        />
      </div>
      {items.length >= 500 && (
        <p className="text-xs text-on-surface-variant">Chỉ hiển thị 500 bản ghi mới nhất. Hãy thu hẹp bộ lọc để xem đầy đủ.</p>
      )}
    </div>
  );
}
