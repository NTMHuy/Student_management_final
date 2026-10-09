'use client';

import React, { useState } from 'react';
import { useGrades } from '@/modules/grade/hooks/useGrades';
import { GradeFilters } from '@/modules/grade/components/GradeFilters';
import { GradeTable } from '@/modules/grade/components/GradeTable';
import { GradeDistributionCard } from '@/modules/grade/components/GradeDistributionCard';
import { ValedictorianCard } from '@/modules/grade/components/ValedictorianCard';
import { Pagination } from '@/components/ui/Pagination';
import {
  Download,
  Lock,
  RotateCcw,
  Sparkles,
  Save,
  CheckCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function GradesPage() {
  const {
    records,
    isLoading,
    isLocked,
    setIsLocked,
    filters,
    setFilters,
    handleCellChange,
    saveGrades,
    refresh,
    totalStudents,
    completedCount,
    classAverage,
  } = useGrades();

  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveAll = async () => {
    await saveGrades();
    showToast('Tất cả điểm số đã được tự động lưu và tính lại điểm TB.');
  };

  const handleLockGrades = () => {
    setIsLocked(!isLocked);
    showToast(
      isLocked
        ? 'Đã mở khóa sổ điểm, giáo viên có thể chỉnh sửa.'
        : 'Đã khóa sổ điểm. Dữ liệu đã được chốt và bảo mật.'
    );
  };

  const handleCalculateAll = () => {
    refresh();
    showToast('Đã tính toán lại toàn bộ điểm trung bình và xếp loại học lực.');
  };

  const handleExport = () => {
    showToast('Đang kết xuất bảng điểm lớp ' + filters.className + ' ra file Excel (.xlsx)...');
  };

  const pageSize = 10;
  const totalPages = Math.ceil((records.length || totalStudents || 10) / pageSize);

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
                Sổ điểm điện tử
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

        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <span className="font-mono text-secondary uppercase font-semibold">
                SỔ ĐIỂM ĐIỆN TỬ
              </span>
              <span className="w-1 h-1 rounded-full bg-outline" />
              <span>Học kỳ II (2024-2025)</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Quản lý &amp; Nhập Điểm
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold text-xs">
                Lớp {filters.className} • Môn {filters.subject.toUpperCase()}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Nhập điểm kiểm tra thường xuyên, điểm giữa kỳ, cuối kỳ với công thức tính điểm tự động chuẩn Bộ Giáo Dục &amp; Đào Tạo. Hỗ trợ phím Enter/Mũi tên để di chuyển nhanh giữa các ô.
            </p>
          </div>

          {/* Action Ribbon */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-colors text-xs sm:text-sm font-semibold cursor-pointer border border-outline-variant/20"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={handleCalculateAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary-fixed/50 text-secondary rounded-xl hover:bg-secondary-fixed transition-colors text-xs sm:text-sm font-semibold cursor-pointer border border-secondary/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tính lại ĐTB</span>
            </button>
            <button
              type="button"
              onClick={handleLockGrades}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors text-xs sm:text-sm font-semibold cursor-pointer border ${
                isLocked
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-surface-container text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{isLocked ? 'Đã khóa sổ' : 'Khóa sổ điểm'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary-container shadow hover:shadow-md transition-all text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu bảng điểm</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <GradeFilters
          filters={filters}
          onChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        />

        {/* Grade Ledger Table with Inline Editing */}
        <div className="flex flex-col">
          <GradeTable
            records={records}
            onCellChange={handleCellChange}
            isLocked={isLocked}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalStudents}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="học sinh"
          />
        </div>

        {/* Bottom Analytics & Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GradeDistributionCard records={records} />
          </div>
          <div>
            <ValedictorianCard />
          </div>
        </div>
      </div>
    
  );
}
