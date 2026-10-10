'use client';

import React, { useEffect, useState } from 'react';
import { useAttendance } from '@/modules/attendance/hooks/useAttendance';
import { AttendanceDailyTable } from '@/modules/attendance/components/AttendanceDailyTable';
import { EarlyWarningWidget } from '@/modules/attendance/components/EarlyWarningWidget';
import { Pagination } from '@/components/ui/Pagination';
import { todayStr } from '@/modules/attendance/utils';
import Link from 'next/link';
import {
  Calendar,
  Save,
  CheckCircle2,
  History,
  CheckCircle,
  AlertCircle,
  X,
  Users,
  AlertTriangle,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function AttendancePage() {
  const {
    classOptions,
    subjectOptions,
    optionsLoading,
    optionsError,
    dailyItems,
    earlyWarnings,
    isLoading,
    isSaving,
    isDirty,
    error,
    dailyFilters,
    setDailyFilters,
    setStudentStatus,
    setStudentNote,
    markAllPresent,
    saveDaily,
    total,
    presentCount,
    excusedCount,
    unexcusedCount,
    lateCount,
    pendingCount,
    attendanceRate,
  } = useAttendance();

  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const showToast = (t: { kind: 'success' | 'error'; message: string }) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  };

  const changeFilters = (patch: Partial<typeof dailyFilters>) => {
    if (isDirty && !window.confirm('Bạn có thay đổi điểm danh chưa lưu. Đổi bộ lọc sẽ làm mất các thay đổi này. Tiếp tục?')) {
      return;
    }
    setDailyFilters((prev) => ({ ...prev, ...patch }));
  };

  const selectedClass = classOptions.find((c) => String(c.id) === dailyFilters.classId);

  const handleSave = async () => {
    try {
      await saveDaily();
      showToast({ kind: 'success', message: `Đã lưu điểm danh lớp ${selectedClass?.name ?? ''} ngày ${dailyFilters.date}.` });
    } catch (e) {
      showToast({ kind: 'error', message: e instanceof Error ? e.message : 'Không thể lưu điểm danh.' });
    }
  };

  const pageSize = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(dailyItems.length / pageSize));
  const pageItems = dailyItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  useEffect(() => {
    setCurrentPage(1);
  }, [dailyFilters.classId, dailyFilters.date, dailyFilters.session, dailyFilters.subjectId]);

  const noClass = !optionsLoading && !optionsError && classOptions.length === 0;

  return (
    
      <div className="flex flex-col gap-6 relative">
        {toast && (
          <div role="status" className="fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-surface-container-lowest text-on-surface rounded-2xl shadow-xl border border-outline-variant/30">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.kind === 'success' ? 'bg-secondary-container/20 text-secondary-container' : 'bg-error-container text-error'}`}>
              {toast.kind === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex flex-col pr-4">
              <span className="font-semibold text-xs sm:text-sm text-on-surface">Điểm danh</span>
              <span className="text-xs text-on-surface-variant">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="p-1 text-outline hover:text-on-surface transition-colors cursor-pointer" aria-label="Đóng">
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
              <span>Ngày {dailyFilters.date}</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Điểm danh Hàng ngày
              </h1>
              {selectedClass && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold text-xs">
                  Lớp {selectedClass.name} • {dailyFilters.session === 'MORNING' ? 'Buổi sáng' : 'Buổi chiều'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Chọn lớp, ngày và buổi, đánh dấu từng học sinh có mặt, vắng có phép, vắng không phép hoặc đi muộn rồi bấm &quot;Lưu điểm danh&quot;. Học sinh vắng nhiều được cảnh báo ở bên dưới.
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
              disabled={total === 0}
              onClick={markAllPresent}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary-fixed/40 text-secondary rounded-xl hover:bg-secondary-fixed transition-colors text-xs sm:text-sm font-semibold cursor-pointer border border-secondary/20"
            >
              <UserCheck className="w-4 h-4" />
              <span>Đánh dấu cả lớp Có mặt</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || total === 0 || (!isDirty && pendingCount === 0)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary-container shadow hover:shadow-md transition-all text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu điểm danh'}</span>
            </button>
          </div>
        </div>

        {optionsError && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{optionsError}</p>}
        {noClass && (
          <p className="rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 text-sm text-on-surface-variant">
            Bạn chưa chủ nhiệm hoặc được phân công lớp nào nên chưa thể điểm danh. Hãy nhờ quản trị viên phân công.
          </p>
        )}

        <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="att-date" className="text-xs font-semibold text-on-surface-variant">Ngày</label>
            <input
              id="att-date"
              type="date"
              value={dailyFilters.date}
              max={todayStr()}
              onChange={(e) => e.target.value && changeFilters({ date: e.target.value })}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 font-medium"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="att-session" className="text-xs font-semibold text-on-surface-variant">Buổi</label>
            <select
              id="att-session"
              value={dailyFilters.session}
              onChange={(e) => changeFilters({ session: e.target.value as 'MORNING' | 'AFTERNOON' })}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 font-medium"
            >
              <option value="MORNING">Buổi sáng</option>
              <option value="AFTERNOON">Buổi chiều</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="att-class" className="text-xs font-semibold text-on-surface-variant">Lớp học</label>
            <select
              id="att-class"
              value={dailyFilters.classId}
              onChange={(e) => changeFilters({ classId: e.target.value, subjectId: '' })}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 font-medium"
            >
              {classOptions.length === 0 && <option value="">Chưa có lớp</option>}
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (Khối {c.gradeLevel})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="att-subject" className="text-xs font-semibold text-on-surface-variant">Môn học (tùy chọn)</label>
            <select
              id="att-subject"
              value={dailyFilters.subjectId}
              onChange={(e) => changeFilters({ subjectId: e.target.value })}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 font-medium"
            >
              <option value="">Không theo môn</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {isDirty && <span className="text-xs font-semibold text-amber-700 pb-2.5">Có thay đổi chưa lưu</span>}
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}

        {/* Realtime Attendance Stat Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                Sĩ số lớp
              </span>
              <p className="text-2xl font-bold font-mono text-on-surface mt-0.5">
                {total} {pendingCount > 0 && <span className="text-xs font-normal text-outline">({pendingCount} chưa điểm danh)</span>}
              </p>
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

        <div className="flex flex-col">
          <AttendanceDailyTable
            items={pageItems}
            isLoading={isLoading}
            startIndex={(currentPage - 1) * pageSize}
            onStatusChange={setStudentStatus}
            onNoteChange={setStudentNote}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={dailyItems.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="học sinh"
          />
        </div>

        {/* Early Warning Widget for At-Risk Students */}
        <EarlyWarningWidget warnings={earlyWarnings} />
      </div>
    
  );
}
