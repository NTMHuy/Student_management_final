import { useState, useEffect, useCallback } from 'react';
import {
  DailyAttendanceItem,
  AttendanceHistoryItem,
  AttendanceEarlyWarning,
  AttendanceStatus,
  AttendanceFiltersState,
  AttendanceHistoryFiltersState,
} from '../types';
import { attendanceService } from '../services/attendance.service';

export const useAttendance = (initialDailyFilters?: Partial<AttendanceFiltersState>) => {
  const [dailyItems, setDailyItems] = useState<DailyAttendanceItem[]>([]);
  const [historyItems, setHistoryItems] = useState<AttendanceHistoryItem[]>([]);
  const [earlyWarnings, setEarlyWarnings] = useState<AttendanceEarlyWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dailyFilters, setDailyFilters] = useState<AttendanceFiltersState>({
    className: initialDailyFilters?.className || '10a1',
    date: initialDailyFilters?.date || '2024-05-17',
    subjectSlot: initialDailyFilters?.subjectSlot || 't2-math',
  });

  const [historyFilters, setHistoryFilters] = useState<AttendanceHistoryFiltersState>({
    search: '',
    className: '10A1',
    dateRange: '01/05/2024 - 17/05/2024',
    status: 'all',
  });

  const fetchDaily = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await attendanceService.getDailyAttendance(dailyFilters);
      setDailyItems(items);
    } finally {
      setIsLoading(false);
    }
  }, [dailyFilters]);

  const fetchHistoryAndWarnings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hist, warns] = await Promise.all([
        attendanceService.getAttendanceHistory(historyFilters),
        attendanceService.getEarlyWarnings(),
      ]);
      setHistoryItems(hist);
      setEarlyWarnings(warns);
    } finally {
      setIsLoading(false);
    }
  }, [historyFilters]);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  const setStudentStatus = async (id: string, status: AttendanceStatus, note?: string) => {
    setDailyItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, ...(note ? { note } : {}) } : item))
    );
    await attendanceService.updateDailyStatus(id, status, note);
  };

  const markAllPresent = async () => {
    const updated = await attendanceService.markAllPresent();
    setDailyItems(updated);
  };

  const saveDaily = async () => {
    return await attendanceService.saveDailyAttendance();
  };

  // Metrics
  const total = dailyItems.length;
  const presentCount = dailyItems.filter((i) => i.status === 'present').length;
  const excusedCount = dailyItems.filter((i) => i.status === 'excused').length;
  const unexcusedCount = dailyItems.filter((i) => i.status === 'unexcused').length;
  const lateCount = dailyItems.filter((i) => i.status === 'late').length;
  const attendanceRate = total ? ((presentCount / total) * 100).toFixed(1) : '0.0';

  return {
    dailyItems,
    historyItems,
    earlyWarnings,
    isLoading,
    dailyFilters,
    setDailyFilters,
    historyFilters,
    setHistoryFilters,
    fetchHistoryAndWarnings,
    setStudentStatus,
    markAllPresent,
    saveDaily,
    total,
    presentCount,
    excusedCount,
    unexcusedCount,
    lateCount,
    attendanceRate,
  };
};
