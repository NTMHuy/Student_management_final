'use client';

import React, { useEffect, useState } from 'react';
import { useGrades } from '@/modules/grade/hooks/useGrades';
import { GradeFilters } from '@/modules/grade/components/GradeFilters';
import { GradeTable } from '@/modules/grade/components/GradeTable';
import { GradeDistributionCard } from '@/modules/grade/components/GradeDistributionCard';
import { ValedictorianCard } from '@/modules/grade/components/ValedictorianCard';
import { parseSemester } from '@/modules/grade/utils';
import { GradeFiltersState } from '@/modules/grade/types';
import { Pagination } from '@/components/ui/Pagination';
import { Download, RotateCcw, Save, CheckCircle, AlertCircle, X } from 'lucide-react';

type Toast = { kind: 'success' | 'error'; message: string };

export default function GradesPage() {
  const {
    classOptions,
    subjectOptions,
    optionsLoading,
    optionsError,
    records,
    isLoading,
    isSaving,
    isDirty,
    error,
    filters,
    setFilters,
    handleCellChange,
    addProcessAssessment,
    saveGrades,
    refresh,
    totalStudents,
    completedCount,
    classAverage,
  } = useGrades();

  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<Toast | null>(null);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const pageRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.classId, filters.subjectId, filters.semester]);

  // Cảnh báo khi đóng/tải lại trang lúc còn điểm chưa lưu.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  };

  const handleFilterChange = (patch: Partial<GradeFiltersState>) => {
    if (isDirty && !window.confirm('Bạn có điểm chưa lưu. Đổi bộ lọc sẽ làm mất các thay đổi này. Tiếp tục?')) {
      return;
    }
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    try {
      await saveGrades();
      showToast({ kind: 'success', message: 'Đã lưu bảng điểm.' });
    } catch (e) {
      showToast({ kind: 'error', message: e instanceof Error ? e.message : 'Không thể lưu bảng điểm.' });
    }
  };

  const handleReload = () => {
    if (isDirty && !window.confirm('Tải lại sẽ bỏ các thay đổi chưa lưu. Tiếp tục?')) return;
    refresh();
  };

  const selectedClass = classOptions.find((c) => String(c.id) === filters.classId);
  const selectedSubject = subjectOptions.find((s) => String(s.id) === filters.subjectId);
  const { schoolYear, semester } = parseSemester(filters.semester);

  const handleExport = () => {
    const maxProcessCount = Math.max(0, ...records.map((r) => r.processScores.length));
    const processHeaders = Array.from({ length: maxProcessCount }, (_, i) => `Quá trình lần ${i + 1}`);
    const header = ['STT', 'Mã SV', 'Họ và tên', ...processHeaders, 'Điểm giữa kỳ', 'Điểm cuối kỳ', 'ĐTB quá trình', 'Điểm tổng kết', 'Xếp loại'];
    const rows = records.map((r, i) => [
      i + 1, r.studentCode, r.fullName,
      ...Array.from({ length: maxProcessCount }, (_, index) => r.processScores[index]?.score ?? ''),
      r.midtermScore ?? '', r.finalScore ?? '', r.processAverage ?? '', r.avgScore ?? '', r.rank ?? '',
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bang-diem-${selectedClass?.name ?? 'lop'}-${selectedSubject?.code ?? 'mon'}-${schoolYear}-HK${semester}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const noAssignment = !optionsLoading && !optionsError && classOptions.length === 0;
  const canEdit = !!filters.classId && !!filters.subjectId;

  return (
    <div className="flex flex-col gap-6 relative">
      {toast && (
        <div role="status" className="fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-surface-container-lowest text-on-surface rounded-2xl shadow-xl border border-outline-variant/30">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.kind === 'success' ? 'bg-secondary-container/20 text-secondary-container' : 'bg-error-container text-error'}`}>
            {toast.kind === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div className="flex flex-col pr-4">
            <span className="font-semibold text-xs sm:text-sm text-on-surface">Sổ điểm điện tử</span>
            <span className="text-xs text-on-surface-variant">{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 text-outline hover:text-on-surface transition-colors cursor-pointer" aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <span className="font-mono text-secondary uppercase font-semibold">SỔ ĐIỂM ĐIỆN TỬ</span>
            <span className="w-1 h-1 rounded-full bg-outline" />
            <span>Học kỳ {semester === 1 ? 'I' : 'II'} ({schoolYear})</span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Quản lý &amp; Nhập Điểm</h1>
            {selectedClass && selectedSubject && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold text-xs">
                Lớp {selectedClass.name} • Môn {selectedSubject.name}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            Nhập nhiều lần điểm quá trình, điểm giữa kỳ và điểm cuối kỳ (thang 0–10). Dùng Enter/mũi tên để di chuyển giữa các ô. Điểm chỉ được ghi vào hệ thống sau khi bấm &quot;Lưu bảng điểm&quot;.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button type="button" onClick={handleExport} disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-colors text-xs sm:text-sm font-semibold cursor-pointer border border-outline-variant/20 disabled:opacity-50">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất CSV</span>
          </button>
          <button type="button" onClick={handleReload} disabled={!canEdit || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-colors text-xs sm:text-sm font-semibold cursor-pointer border border-outline-variant/20 disabled:opacity-50">
            <RotateCcw className="w-4 h-4" />
            <span>Tải lại</span>
          </button>
          <button type="button" onClick={handleSave} disabled={!canEdit || isSaving || isLoading || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary-container shadow hover:shadow-md transition-all text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : isDirty ? 'Lưu bảng điểm' : 'Đã lưu'}</span>
          </button>
        </div>
      </div>

      {optionsError && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{optionsError}</p>}
      {noAssignment && (
        <p className="rounded-xl bg-surface-container-low border border-outline-variant/30 px-4 py-3 text-sm text-on-surface-variant">
          Bạn chưa được phân công dạy môn nào ở lớp nào. Hãy nhờ quản trị viên phân công (giáo viên – lớp – môn) để bắt đầu nhập điểm.
        </p>
      )}

      <GradeFilters filters={filters} classes={classOptions} subjects={subjectOptions} onChange={handleFilterChange} />

      {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col">
        {isLoading ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 text-center text-sm text-on-surface-variant border border-outline-variant/20">
            Đang tải bảng điểm...
          </div>
        ) : (
          <GradeTable
            records={pageRecords}
            onCellChange={handleCellChange}
            viewType={filters.viewType}
            startIndex={(currentPage - 1) * pageSize}
          />
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalStudents}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="sinh viên"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider">Sĩ số</span>
          <p className="text-2xl font-bold font-mono text-on-surface mt-1">{totalStudents}</p>
        </div>
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider">Đã đủ điểm</span>
          <p className="text-2xl font-bold font-mono text-on-surface mt-1">{completedCount} / {totalStudents}</p>
        </div>
        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider">ĐTB lớp</span>
          <p className="text-2xl font-bold font-mono text-secondary mt-1">{classAverage}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GradeDistributionCard records={records} />
        </div>
        <div>
          <ValedictorianCard records={records} className={selectedClass?.name ?? ''} />
        </div>
      </div>
    </div>
  );
}
