import { useState, useEffect, useCallback } from 'react';
import {
  DailyAttendanceItem, AttendanceHistoryItem, AttendanceEarlyWarning,
  AttendanceStatus, AttendanceFiltersState, AttendanceHistoryFiltersState, CourseSessionOption,
} from '../types';
import { attendanceService } from '../services/attendance.service';
import { daysAgoStr, todayStr } from '../utils';
import { useTeachingOptions } from '@/modules/teaching/hooks/useTeachingOptions';

const message = (e: unknown, fallback: string) => e instanceof Error ? e.message : fallback;

export const useAttendance = () => {
  const { options, isLoading: optionsLoading, error: optionsError } = useTeachingOptions();
  const [sessions, setSessions] = useState<CourseSessionOption[]>([]);
  const [dailyItems, setDailyItems] = useState<DailyAttendanceItem[]>([]);
  const [earlyWarnings, setEarlyWarnings] = useState<AttendanceEarlyWarning[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AttendanceFiltersState>({ courseSectionId: '', courseSessionId: '' });

  const sections = options.courseSections;
  useEffect(() => {
    if (optionsLoading) return;
    setFilters(prev => {
      const sectionId = sections.some(s => String(s.id) === prev.courseSectionId)
        ? prev.courseSectionId : sections[0] ? String(sections[0].id) : '';
      return sectionId === prev.courseSectionId ? prev : { courseSectionId: sectionId, courseSessionId: '' };
    });
  }, [optionsLoading, sections]);

  useEffect(() => {
    let active = true;
    setSessions([]);
    if (!filters.courseSectionId) return;
    attendanceService.getCourseSessions(filters.courseSectionId)
      .then(data => { if (active) setSessions(data.filter(s => s.status !== 'cancelled')); })
      .catch(e => { if (active) setError(message(e, 'Không thể tải lịch học.')); });
    return () => { active = false; };
  }, [filters.courseSectionId]);

  useEffect(() => {
    if (!sessions.length) return;
    setFilters(prev => sessions.some(s => s.id === prev.courseSessionId)
      ? prev : { ...prev, courseSessionId: sessions[0].id });
  }, [sessions]);

  const fetchDaily = useCallback(async () => {
    if (!filters.courseSessionId) { setDailyItems([]); return; }
    setIsLoading(true); setError(null);
    try { setDailyItems(await attendanceService.getDailyAttendance(filters.courseSessionId)); setIsDirty(false); }
    catch (e) { setDailyItems([]); setError(message(e, 'Không thể tải danh sách điểm danh.')); }
    finally { setIsLoading(false); }
  }, [filters.courseSessionId]);

  const fetchWarnings = useCallback(async () => {
    try { setEarlyWarnings(await attendanceService.getEarlyWarnings()); } catch { setEarlyWarnings([]); }
  }, []);
  useEffect(() => { fetchDaily(); }, [fetchDaily]);
  useEffect(() => { fetchWarnings(); }, [fetchWarnings]);

  const setStudentStatus = (id: string, status: AttendanceStatus) => {
    setIsDirty(true); setDailyItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };
  const setStudentNote = (id: string, note: string) => {
    setIsDirty(true); setDailyItems(prev => prev.map(i => i.id === id ? { ...i, note } : i));
  };
  const markAllPresent = () => {
    setIsDirty(true); setDailyItems(prev => prev.map(i => ({ ...i, status: 'present' })));
  };
  const saveDaily = async () => {
    if (!filters.courseSessionId) return;
    setIsSaving(true);
    try {
      const saved = await attendanceService.saveDailyAttendance(filters.courseSessionId, dailyItems);
      setDailyItems(saved); setIsDirty(false); await fetchWarnings();
    } finally { setIsSaving(false); }
  };

  const total = dailyItems.length;
  const presentCount = dailyItems.filter(i => i.status === 'present').length;
  const excusedCount = dailyItems.filter(i => i.status === 'excused').length;
  const unexcusedCount = dailyItems.filter(i => i.status === 'unexcused').length;
  const lateCount = dailyItems.filter(i => i.status === 'late').length;
  const pendingCount = dailyItems.filter(i => i.status === null).length;
  const recorded = total - pendingCount;
  const attendanceRate = recorded ? (((presentCount + lateCount) / recorded) * 100).toFixed(1) : '0.0';

  return {
    sections, sessions, optionsLoading, optionsError, dailyItems, earlyWarnings,
    isLoading, isSaving, isDirty, error, filters, setFilters, setStudentStatus,
    setStudentNote, markAllPresent, saveDaily, refresh: fetchDaily, total,
    presentCount, excusedCount, unexcusedCount, lateCount, pendingCount, attendanceRate,
  };
};

const defaultHistoryFilters = (): AttendanceHistoryFiltersState => ({
  search: '', courseSectionId: '', from: daysAgoStr(30), to: todayStr(), status: 'all',
});

export const useAttendanceHistory = () => {
  const { options, isLoading: optionsLoading, error: optionsError } = useTeachingOptions();
  const [items, setItems] = useState<AttendanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AttendanceHistoryFiltersState>(defaultHistoryFilters);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);
  useEffect(() => {
    let active = true; setIsLoading(true); setError(null);
    attendanceService.getAttendanceHistory({ ...filters, search: debouncedSearch })
      .then(data => { if (active) setItems(data); })
      .catch(e => { if (active) { setItems([]); setError(message(e, 'Không thể tải lịch sử điểm danh.')); } })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters.courseSectionId, filters.from, filters.to, filters.status, debouncedSearch]);
  return {
    sectionOptions: options.courseSections, optionsLoading, optionsError, items, isLoading,
    error, filters, setFilters, reset: () => setFilters(defaultHistoryFilters()),
  };
};
