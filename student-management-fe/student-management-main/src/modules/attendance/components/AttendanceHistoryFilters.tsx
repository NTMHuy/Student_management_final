import React from 'react';
import { AttendanceHistoryFiltersState } from '../types';
import { Search, RotateCcw, Calendar, ChevronDown, Filter, X } from 'lucide-react';

interface AttendanceHistoryFiltersProps {
  filters: AttendanceHistoryFiltersState;
  onChange: (filters: Partial<AttendanceHistoryFiltersState>) => void;
  onReset: () => void;
}

export const AttendanceHistoryFilters: React.FC<AttendanceHistoryFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        {/* Search */}
        <div className="lg:col-span-4 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Tìm kiếm học sinh</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Nhập tên học sinh hoặc Mã HS..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface placeholder:text-outline text-xs sm:text-sm rounded-xl focus:outline-none focus:bg-surface-container-lowest transition-all border border-transparent focus:border-secondary"
            />
          </div>
        </div>

        {/* Class */}
        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Lớp học</label>
          <div className="relative">
            <select
              value={filters.className}
              onChange={(e) => onChange({ className: e.target.value })}
              className="w-full pl-3 pr-8 py-2 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl appearance-none focus:outline-none focus:bg-surface-container-lowest transition-all cursor-pointer border border-transparent focus:border-secondary"
            >
              <option value="10A1">Lớp 10A1 (Sĩ số: 38)</option>
              <option value="10A2">Lớp 10A2 (Sĩ số: 40)</option>
              <option value="10A3">Lớp 10A3 (Sĩ số: 36)</option>
              <option value="11B1">Lớp 11B1 (Sĩ số: 42)</option>
              <option value="12C1">Lớp 12C1 (Sĩ số: 39)</option>
            </select>
            <ChevronDown className="w-4 h-4 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
          </div>
        </div>

        {/* Date Range */}
        <div className="lg:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Khoảng thời gian</label>
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 absolute left-3 text-outline pointer-events-none" />
            <input
              type="text"
              readOnly
              value={filters.dateRange}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl cursor-pointer focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Status */}
        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface">Trạng thái</label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onChange({ status: e.target.value })}
              className="w-full pl-3 pr-8 py-2 bg-surface-container-low text-on-surface text-xs sm:text-sm rounded-xl appearance-none focus:outline-none focus:bg-surface-container-lowest transition-all cursor-pointer border border-transparent focus:border-secondary"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="present">Có mặt (Đúng giờ)</option>
              <option value="excused">Vắng có phép</option>
              <option value="unexcused">Vắng không phép</option>
              <option value="late">Đi muộn</option>
            </select>
            <ChevronDown className="w-4 h-4 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="lg:col-span-1 flex items-center gap-1.5">
          <button
            type="button"
            className="w-full py-2 px-3 rounded-xl bg-secondary text-on-secondary hover:bg-secondary-container transition-colors flex items-center justify-center shadow-sm cursor-pointer"
            title="Lọc"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            className="py-2 px-2.5 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center cursor-pointer"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Filter Tags Display */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-outline-variant/15">
        <span className="text-xs text-outline font-medium">Đang áp dụng:</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-primary text-xs font-semibold">
          <span>Lớp: {filters.className}</span>
          <button
            type="button"
            onClick={() => onChange({ className: '10A1' })}
            className="text-outline hover:text-on-surface"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-primary text-xs font-semibold">
          <span>{filters.dateRange}</span>
          <button
            type="button"
            onClick={() => onChange({ dateRange: '01/05/2024 - 17/05/2024' })}
            className="text-outline hover:text-on-surface"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-secondary hover:underline cursor-pointer ml-1 font-medium"
        >
          Xóa tất cả
        </button>
      </div>
    </div>
  );
};
