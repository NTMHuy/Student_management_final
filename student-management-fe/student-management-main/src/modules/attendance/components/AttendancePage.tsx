'use client';

import React, { useState } from 'react';
import { useAttendance } from '@/modules/attendance/hooks/useAttendance';
import { AttendanceDailyTable } from '@/modules/attendance/components/AttendanceDailyTable';
import { EarlyWarningWidget } from '@/modules/attendance/components/EarlyWarningWidget';
import { AttendanceStatus } from '@/modules/attendance/types';
import Link from 'next/link';
import {
  Calendar,
  Save,
  CheckCircle2,
  History,
  CheckCircle,
  X,
  Users,
  AlertTriangle,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function AttendancePage() {
  const {
    dailyItems,
    earlyWarnings,
    isLoading,
    dailyFilters,
    setDailyFilters,
    setStudentStatus,
    markAllPresent,
    saveDaily,
    total,
    presentCount,
    excusedCount,
    unexcusedCount,
    lateCount,
    attendanceRate,
  } = useAttendance();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async () => {
    await saveDaily();
    showToast(
      `Đã lưu kết quả điểm danh lớp ${dailyFilters.className.toUpperCase()} ngày ${dailyFilters.date}. Hệ thống đã gửi SMS cho phụ huynh học sinh vắng mặt.`
    );
  };

  return (
    
      <div className="flex flex-col gap-6 relative">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-surface-container-lowest text-on-surface rounded-2xl shadow-xl border border-outline-variant/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-full bg-secondary-container/20 text-secondary-container flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex flex-col pr-4">
              <span className="font-semibold text-xs sm:text-sm text-on-surface">
                Điểm danh hàng ngày
              </span>
              <span className="text-xs text-on-surface-variant">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 text-outline hover:text-on-surface transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <span className="font-mono text-secondary uppercase font-semibold">
                SỔ THEO DÕI NỀ NẾP &amp; CHUYÊN CẦN
              </span>
              <span className="w-1 h-1 rounded-full bg-outline" />
              <span>Học kỳ II (2024-2025)</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Điểm danh Hàng ngày
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold text-xs">
                Lớp {dailyFilters.className.toUpperCase()} • Ngày {dailyFilters.date}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Thực hiện điểm danh tiết đầu, cập nhật trạng thái có mặt, vắng có phép, vắng không phép hoặc đi muộn. Tự động cảnh báo học sinh vắng quá quy định.
            </p>
          </div>

          {/* Action Ribbon */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              href="/attendance/history"
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-colors text-xs sm:text-sm font-semibold cursor-pointer border border-outline-variant/20"
            >
              <History className="w-4 h-4 text-outline" />
              <span>Lịch sử điểm danh</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                markAllPresent();
                showToast('Đã đánh dấu tất cả học sinh là Có Mặt.');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary-fixed/40 text-secondary rounded-xl hover:bg-secondary-fixed transition-colors text-xs sm:text-sm font-semibold cursor-pointer border border-secondary/20"
            >
              <UserCheck className="w-4 h-4" />
              <span>Đánh dấu cả lớp Có mặt</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary-container shadow hover:shadow-md transition-all text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu điểm danh</span>
            </button>
          </div>
        </div>

        {/* Date & Class Filter Ribbon */}
        <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                Chọn Ngày:
              </span>
              <input
                type="date"
                value={dailyFilters.date}
                onChange={(e) => setDailyFilters((prev) => ({ ...prev, date: e.target.value }))}
                className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                Lớp học:
              </span>
              <select
                value={dailyFilters.className}
                onChange={(e) => setDailyFilters((prev) => ({ ...prev, className: e.target.value }))}
                className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 font-medium"
              >
                <option value="10a1">10A1 (Khối 10)</option>
                <option value="10a2">10A2 (Khối 10)</option>
                <option value="11b1">11B1 (Khối 11)</option>
                <option value="11b2">11B2 (Khối 11)</option>
                <option value="12c1">12C1 (Khối 12)</option>
                <option value="12c2">12C2 (Khối 12)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đang đồng bộ trực tiếp với sổ điện tử</span>
          </div>
        </div>

        {/* Realtime Attendance Stat Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                Sĩ số lớp
              </span>
              <p className="text-2xl font-bold font-mono text-on-surface mt-0.5">{total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200/50 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Có mặt
              </span>
              <p className="text-2xl font-bold font-mono text-emerald-900 mt-0.5">
                {presentCount} <span className="text-xs font-normal">({attendanceRate}%)</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                Đi muộn
              </span>
              <p className="text-2xl font-bold font-mono text-amber-900 mt-0.5">{lateCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-rose-50/70 border border-rose-200/50 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                Vắng mặt
              </span>
              <p className="text-2xl font-bold font-mono text-rose-900 mt-0.5">
                {excusedCount + unexcusedCount}{' '}
                <span className="text-xs font-normal text-rose-700">({unexcusedCount} K.Phép)</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Daily Attendance Sheet */}
        <AttendanceDailyTable
          items={dailyItems}
          isLoading={isLoading}
          onStatusChange={(id, status) => setStudentStatus(id, status)}
          onNoteChange={(id, note) => {
            const currentItem = dailyItems.find((i) => i.id === id);
            if (currentItem) {
              setStudentStatus(id, currentItem.status, note);
            }
          }}
        />

        {/* Early Warning Widget for At-Risk Students */}
        <EarlyWarningWidget warnings={earlyWarnings} />
      </div>
    
  );
}
