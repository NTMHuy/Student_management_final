'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { apiRequest } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import Link from 'next/link';
import {
  School,
  Users,
  Building,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Download,
  AlertTriangle,
  Send,
  Calendar,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface DashboardSummary {
  totalStudents: number;
  totalTeachers: number | null;
  totalDepartments: number | null;
  totalClasses: number;
  classesByGrade: { grade10: number; grade11: number; grade12: number };
  studentsByStatus: { active: number; suspended: number; transferred: number };
  classes: Array<{ id: string; name: string; gradeLevel: number; homeroomTeacher: string; currentStudents: number; maxStudents: number }>;
  recentStudents: Array<{ id: string; studentCode: string; fullName: string; className: string; avatarInitials: string; createdAt: string }>;
}

export default function DashboardPage() {
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('2023 - 2024 (Học kỳ II)');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState('');

  const loadSummary = useCallback(async () => {
    setIsRefreshing(true);
    setSummaryError('');
    try {
      const data = await apiRequest<DashboardSummary>(API_ENDPOINTS.dashboard);
      setSummary(data);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : 'Không thể tải số liệu tổng quan.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handleRefresh = () => {
    void loadSummary();
  };

  const handleSendReminder = () => {
    setReminderSent(true);
    setTimeout(() => {
      setReminderSent(false);
    }, 3000);
  };

  return (
    
      <div className="flex flex-col gap-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Breadcrumb items={[{ label: 'Bảng điều khiển', href: '/dashboard' }, { label: 'Giám sát tổng thể', isCurrent: true }]} />
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-1">
              Tổng quan hệ thống
            </h1>
            <p className="text-xs text-on-surface-variant">
              {summaryError ? <span className="text-error">{summaryError}</span> : 'Số liệu được tải từ máy chủ khi có phiên đăng nhập hợp lệ.'}
            </p>
          </div>

          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* School Year Selector */}
            <div className="flex items-center bg-surface-container-lowest px-3 py-2 rounded-xl shadow-sm border border-outline-variant/20">
              <Calendar className="w-4 h-4 text-outline mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline mr-2">
                Năm học
              </span>
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="2023 - 2024 (Học kỳ II)">2023 - 2024 (Học kỳ II)</option>
                <option value="2023 - 2024 (Học kỳ I)">2023 - 2024 (Học kỳ I)</option>
                <option value="2022 - 2023 (Cả năm)">2022 - 2023 (Cả năm)</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface font-semibold text-xs sm:text-sm shadow-sm hover:bg-surface-container transition-all cursor-pointer border border-outline-variant/20"
            >
              <RotateCcw className={`w-4 h-4 text-outline ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
            </button>

            {/* Export */}
            <button
              type="button"
              onClick={() => alert('Đang xuất Báo cáo Giám sát Tổng thể định dạng Excel...')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs sm:text-sm shadow hover:bg-primary-container transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất báo cáo</span>
            </button>
          </div>
        </div>

        {/* 4 Overview Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Students */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Tổng học sinh
                </span>
                <div className="text-3xl font-bold text-on-surface tracking-tight mt-1 font-mono">
                  {summary ? summary.totalStudents.toLocaleString('vi-VN') : '—'}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <School className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 pt-2 border-t border-outline-variant/10">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-container-high text-secondary">
                <TrendingUp className="w-3 h-3" />
                +3.2%
              </span>
              <span className="text-xs text-on-surface-variant">so với kỳ trước</span>
            </div>
          </div>

          {/* Card 2: Teachers */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Tổng giáo viên
                </span>
                <div className="text-3xl font-bold text-on-surface tracking-tight mt-1 font-mono">
                  {summary?.totalTeachers == null ? '—' : summary.totalTeachers.toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 pt-2 border-t border-outline-variant/10 text-xs text-on-surface-variant font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>{summary?.totalDepartments == null ? '—' : summary.totalDepartments} tổ bộ môn</span>
            </div>
          </div>

          {/* Card 3: Classes */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Tổng lớp học
                </span>
                <div className="text-3xl font-bold text-on-surface tracking-tight mt-1 font-mono">
                  {summary ? summary.totalClasses.toLocaleString('vi-VN') : '—'}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary-container group-hover:bg-tertiary-container group-hover:text-on-tertiary transition-colors">
                <Building className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-outline-variant/10 text-xs font-mono text-on-surface-variant">
              <span className="bg-surface-container-low px-2 py-0.5 rounded">K10: {summary?.classesByGrade.grade10 ?? '—'}</span>
              <span className="bg-surface-container-low px-2 py-0.5 rounded">K11: {summary?.classesByGrade.grade11 ?? '—'}</span>
              <span className="bg-surface-container-low px-2 py-0.5 rounded">K12: {summary?.classesByGrade.grade12 ?? '—'}</span>
            </div>
          </div>

          {/* Card 4: Attendance */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 flex flex-col justify-between group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Chuyên cần hôm nay
                </span>
                <div className="text-3xl font-bold text-secondary tracking-tight mt-1 font-mono">
                  98.4%
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed group-hover:bg-secondary-container group-hover:text-on-secondary-container transition-colors">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-outline-variant/10 text-xs text-on-surface-variant">
              <span><b className="font-semibold text-on-surface">14</b> vắng phép</span>
              <span className="text-error font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                <b className="font-bold">2</b> không phép
              </span>
            </div>
          </div>
        </div>

        {/* Main Administrative Grid (60% / 40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Approx 60% = 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Academic Performance Section */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/20">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full" />
                  <h2 className="font-bold text-base sm:text-lg text-on-surface">
                    Tình hình học tập &amp; Xếp loại học lực
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider bg-surface-container-low px-2.5 py-1 rounded-lg">
                  Kỳ II Hiện tại
                </span>
              </div>

              {/* Segmented Visual Progress Bar */}
              <div className="w-full flex h-3.5 rounded-full overflow-hidden bg-surface-container-high mb-5">
                <div className="bg-primary hover:opacity-90 transition-opacity" style={{ width: '34%' }} title="Giỏi: 34%" />
                <div className="bg-secondary hover:opacity-90 transition-opacity" style={{ width: '48%' }} title="Khá: 48%" />
                <div className="bg-tertiary-fixed-dim hover:opacity-90 transition-opacity" style={{ width: '16%' }} title="Đạt: 16%" />
                <div className="bg-error hover:opacity-90 transition-opacity" style={{ width: '2%' }} title="Chưa đạt: 2%" />
              </div>

              {/* Metric Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                    <span className="text-xs font-semibold">Giỏi</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-on-surface">34%</span>
                    <span className="text-xs font-mono text-on-surface-variant">483 hs</span>
                  </div>
                  <span className="text-[11px] text-secondary font-medium mt-1">↑ 2.1% cùng kỳ</span>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" />
                    <span className="text-xs font-semibold">Khá</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-on-surface">48%</span>
                    <span className="text-xs font-mono text-on-surface-variant">681 hs</span>
                  </div>
                  <span className="text-[11px] text-outline font-medium mt-1">→ Ổn định</span>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim inline-block" />
                    <span className="text-xs font-semibold">Đạt (TB)</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-on-surface">16%</span>
                    <span className="text-xs font-mono text-on-surface-variant">228 hs</span>
                  </div>
                  <span className="text-[11px] text-secondary font-medium mt-1">↓ 1.5% tích cực</span>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-error inline-block" />
                    <span className="text-xs font-semibold">Chưa đạt</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-error">2%</span>
                    <span className="text-xs font-mono text-on-surface-variant">28 hs</span>
                  </div>
                  <span className="text-[11px] text-error font-medium mt-1">Cần phụ đạo</span>
                </div>
              </div>
            </div>

            {/* Featured Classes & Roster Summary Table */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-outline-variant/15">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full" />
                  <h2 className="font-bold text-base sm:text-lg text-on-surface">
                    Danh sách lớp học tiêu biểu &amp; Sĩ số
                  </h2>
                </div>
                <Link
                  href="/classes"
                  className="text-secondary font-semibold text-xs sm:text-sm flex items-center gap-1 hover:underline"
                >
                  <span>Xem toàn bộ 38 lớp</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-5">Lớp</th>
                      <th className="py-3 px-4">Khối</th>
                      <th className="py-3 px-4">Giáo viên chủ nhiệm</th>
                      <th className="py-3 px-4 text-right">Sĩ số</th>
                      <th className="py-3 px-5 text-right">Chuyên cần hôm nay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-xs sm:text-sm">
                    <tr className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3 px-5 font-bold text-on-surface">12A1</td>
                      <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">Khối 12</td>
                      <td className="py-3 px-4 text-on-surface font-medium">ThS. Trần Quang Vinh</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">38 / 38</td>
                      <td className="py-3 px-5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-surface-container-high text-secondary font-bold">
                          100%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3 px-5 font-bold text-on-surface">12A2</td>
                      <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">Khối 12</td>
                      <td className="py-3 px-4 text-on-surface font-medium">Cô Lê Mai Hương</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">37 / 38</td>
                      <td className="py-3 px-5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-surface-container text-on-surface font-semibold">
                          97.4%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3 px-5 font-bold text-on-surface">11B1</td>
                      <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">Khối 11</td>
                      <td className="py-3 px-4 text-on-surface font-medium">Thầy Phạm Hoàng Nam</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">36 / 36</td>
                      <td className="py-3 px-5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-surface-container-high text-secondary font-bold">
                          100%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3 px-5 font-bold text-on-surface">11B4</td>
                      <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">Khối 11</td>
                      <td className="py-3 px-4 text-on-surface font-medium">Cô Đặng Thu Hà</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">35 / 37</td>
                      <td className="py-3 px-5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-surface-container text-on-surface font-semibold">
                          94.6%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3 px-5 font-bold text-on-surface">10C1</td>
                      <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">Khối 10</td>
                      <td className="py-3 px-4 text-on-surface font-medium">Thầy Vũ Đức Thắng</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">40 / 40</td>
                      <td className="py-3 px-5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-surface-container-high text-secondary font-bold">
                          100%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (Approx 40% = 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Today's Attendance Operations Status */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/20">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-secondary rounded-full" />
                  <h2 className="font-bold text-base sm:text-lg text-on-surface">
                    Tiến độ điểm danh
                  </h2>
                </div>
                <span className="text-xs font-mono font-semibold text-on-surface bg-surface-container px-2.5 py-1 rounded-lg">
                  36/38 lớp
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-4">
                Cập nhật lúc 08:30 sáng theo thời gian thực.
              </p>

              {/* Progress bar */}
              <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden mb-4">
                <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: '94.7%' }} />
              </div>

              {/* Warning Alert for Missing Classes */}
              <div className="bg-error-container/30 border border-error/20 p-4 rounded-xl flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-error-container">
                    2 lớp chưa nộp danh sách
                  </span>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Giáo viên quản nhiệm chưa gửi báo cáo buổi sáng:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 font-mono text-xs">
                    <span className="px-2 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-semibold shadow-sm border border-outline-variant/20">
                      10C3 • Thầy Hoàng Long
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-semibold shadow-sm border border-outline-variant/20">
                      11B5 • Cô Mỹ Linh
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendReminder}
                className="w-full py-2.5 px-4 rounded-xl bg-surface-container text-on-surface font-semibold text-xs sm:text-sm hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-secondary" />
                <span>
                  {reminderSent ? '✓ Đã gửi tin nhắn nhắc nhở GV' : 'Gửi nhắc nhở GV chủ nhiệm (2)'}
                </span>
              </button>
            </div>

            {/* Internal Notices & Academic Schedule */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/20">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-tertiary-container rounded-full" />
                  <h2 className="font-bold text-base sm:text-lg text-on-surface">
                    Thông báo &amp; Lịch công tác
                  </h2>
                </div>
                <span className="text-xs text-secondary font-semibold uppercase tracking-wider cursor-pointer hover:underline">
                  Tất cả
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {/* Item 1 */}
                <div className="flex gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all border border-outline-variant/15">
                  <div className="flex flex-col items-center justify-center bg-primary-container text-on-primary rounded-xl w-12 h-12 shrink-0">
                    <span className="text-[10px] uppercase font-mono font-medium leading-none">Th.5</span>
                    <span className="text-base font-bold leading-none mt-1">20</span>
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-error-container text-on-error-container">
                        Quan trọng
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-mono">Hạn chót 17:00</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-on-surface truncate mt-0.5">
                      Khóa sổ điểm kiểm tra giữa kỳ II
                    </h3>
                    <p className="text-xs text-on-surface-variant truncate">
                      Toàn bộ giáo viên bộ môn hoàn thành cập nhật điểm học phần theo công văn 14/GDĐT.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all border border-outline-variant/15">
                  <div className="flex flex-col items-center justify-center bg-surface-container-highest text-on-surface rounded-xl w-12 h-12 shrink-0">
                    <span className="text-[10px] uppercase font-mono font-medium leading-none">Th.5</span>
                    <span className="text-base font-bold leading-none mt-1">26</span>
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-container text-on-surface-variant">
                        Sự kiện
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-mono">08:00 - 11:30</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-on-surface truncate mt-0.5">
                      Họp Hội nghị phụ huynh khối 12
                    </h3>
                    <p className="text-xs text-on-surface-variant truncate">
                      Phổ biến phương án ôn tập thi tốt nghiệp THPT Quốc gia 2024 tại Hội trường A.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all border border-outline-variant/15">
                  <div className="flex flex-col items-center justify-center bg-surface-container-highest text-on-surface rounded-xl w-12 h-12 shrink-0">
                    <span className="text-[10px] uppercase font-mono font-medium leading-none">Th.6</span>
                    <span className="text-base font-bold leading-none mt-1">02</span>
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-container text-on-surface-variant">
                        Kế hoạch
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-mono">Toàn trường</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-on-surface truncate mt-0.5">
                      Kiểm tra chuyên đề tổ Toán - Tin
                    </h3>
                    <p className="text-xs text-on-surface-variant truncate">
                      Dự giờ đánh giá đổi mới phương pháp giảng dạy ứng dụng CNTT trực tuyến.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Operational Action Banner */}
            <div className="bg-primary text-on-primary rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-bold text-sm">Cần trợ giúp dữ liệu?</span>
                <span className="text-xs opacity-80 mt-0.5">
                  Xem sổ tay hướng dẫn quản trị niên giám điện tử
                </span>
              </div>
              <button
                type="button"
                onClick={() => alert('Mở tài liệu Hướng dẫn sử dụng EduManage OS v2.4.0')}
                className="px-4 py-2 rounded-xl bg-surface-container-lowest text-primary font-semibold text-xs hover:bg-surface-container transition-all whitespace-nowrap shadow-sm cursor-pointer"
              >
                Tài liệu HDSD
              </button>
            </div>
          </div>
        </div>
      </div>
    
  );
}
