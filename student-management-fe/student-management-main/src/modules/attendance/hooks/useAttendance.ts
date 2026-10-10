import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DailyAttendanceItem,
  AttendanceHistoryItem,
  AttendanceEarlyWarning,
  AttendanceStatus,
  AttendanceFiltersState,
  AttendanceHistoryFiltersState,
} from '../types';
import { attendanceService } from '../services/attendance.service';
import { daysAgoStr, todayStr } from '../utils';
import { useTeachingOptions } from '@/modules/teaching/hooks/useTeachingOptions';

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export const useAttendance = () => {
  const { options, isLoading: optionsLoading, error: optionsError } = useTeachingOptions();

  const [dailyItems, setDailyItems] = useState<DailyAttendanceItem[]>([]);
  const [earlyWarnings, setEarlyWarnings] = useState<AttendanceEarlyWarning[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyFilters, setDailyFilters] = useState<AttendanceFiltersState>({
    classId: '',
    date: todayStr(),
    session: 'MORNING',
    subjectId: '',
  });

  const classOptions = options.classes;

  // Môn gợi ý (tùy chọn): giáo viên chỉ thấy môn được phân công ở lớp đã chọn.
  const subjectOptions = useMemo(() => {
    if (!options.restricted) return options.subjects;
    const classId = Number(dailyFilters.classId);
    const allowed = new Set(options.pairs.filter((p) => p.classId === classId).map((p) => p.subjectId));
    return options.subjects.filter((s) => allowed.has(s.id));
  }, [options, dailyFilters.classId]);

  useEffect(() => {
    if (optionsLoading) return;
    setDailyFilters((prev) => {
      const classId = classOptions.some((c) => String(c.id) === prev.classId)
        ? prev.classId
        : classOptions[0]
          ? String(classOptions[0].id)
          : '';
      const subjectId = subjectOptions.some((s) => String(s.id) === prev.subjectId) ? prev.subjectId : '';
      return classId === prev.classId && subjectId === prev.subjectId ? prev : { ...prev, classId, subjectId };
    });
  }, [optionsLoading, classOptions, subjectOptions]);

  const fetchDaily = useCallback(async () => {
    if (!dailyFilters.classId || !dailyFilters.date) {
      setDailyItems([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setDailyItems(await attendanceService.getDailyAttendance(dailyFilters));
      setIsDirty(false);
    } catch (e) {
      setDailyItems([]);
      setError(message(e, 'Không thể tải danh sách điểm danh.'));
    } finally {
      setIsLoading(false);
    }
  }, [dailyFilters]);

  const fetchWarnings = useCallback(async () => {
    try {
      setEarlyWarnings(await attendanceService.getEarlyWarnings());
    } catch {
      setEarlyWarnings([]);
    }
  }, []);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  useEffect(() => {
    fetchWarnings();
  }, [fetchWarnings]);

  const setStudentStatus = (id: string, status: AttendanceStatus) => {
    setIsDirty(true);
    setDailyItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const setStudentNote = (id: string, note: string) => {
    setIsDirty(true);
    setDailyItems((prev) => prev.map((item) => (item.id === id ? { ...item, note } : item)));
  };

  const markAllPresent = () => {
    setIsDirty(true);
    setDailyItems((prev) => prev.map((item) => ({ ...item, status: 'present' as const })));
  };

  const saveDaily = async () => {
    setIsSaving(true);
    try {
      const saved = await attendanceService.saveDailyAttendance(dailyFilters, dailyItems);
      setDailyItems(saved);
      setIsDirty(false);
      fetchWarnings();
    } finally {
      setIsSaving(false);
    }
  };

  const total = dailyItems.length;
  const presentCount = dailyItems.filter((i) => i.status === 'present').length;
  const excusedCount = dailyItems.filter((i) => i.status === 'excused').length;
  const unexcusedCount = dailyItems.filter((i) => i.status === 'unexcused').length;
  const lateCount = dailyItems.filter((i) => i.status === 'late').length;
  const pendingCount = dailyItems.filter((i) => i.status === null).length;
  const recorded = total - pendingCount;
  const attendanceRate = recorded ? (((presentCount + lateCount) / recorded) * 100).toFixed(1) : '0.0';

  return {
    options,
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
    refresh: fetchDaily,
    total,
    presentCount,
    excusedCount,
    unexcusedCount,
    lateCount,
    pendingCount,
    attendanceRate,
  };
};

const defaultHistoryFilters = (): AttendanceHistoryFiltersState => ({
  search: '',
  classId: '',
  from: daysAgoStr(30),
  to: todayStr(),
  status: 'all',
});

export const useAttendanceHistory = () => {
  const { options, isLoading: optionsLoading, error: optionsError } = useTeachingOptions();
  const [items, setItems] = useState<AttendanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AttendanceHistoryFiltersState>(defaultHistoryFilters);

  // Tìm kiếm có trễ nhẹ để không gọi API sau mỗi phím gõ.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    attendanceService
      .getAttendanceHistory({ ...filters, search: debouncedSearch })
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((e: unknown) => {
        if (active) {
          setItems([]);
          setError(message(e, 'Không thể tải lịch sử điểm danh.'));
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters.classId, filters.from, filters.to, filters.status, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    classOptions: options.classes,
    optionsLoading,
    optionsError,
    items,
    isLoading,
    error,
    filters,
    setFilters,
    reset: () => setFilters(defaultHistoryFilters()),
  };
};
