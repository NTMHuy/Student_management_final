import { useState, useEffect, useCallback, useMemo } from "react";
import { StudentGradeRecord, GradeFiltersState, GradeField } from "../types";
import { gradeService } from "../services/grade.service";
import { calculateAverage, defaultSemester } from "../utils";
import { useTeachingOptions } from "@/modules/teaching/hooks/useTeachingOptions";

export const useGrades = () => {
  const { options, isLoading: optionsLoading, error: optionsError } = useTeachingOptions();

  const [records, setRecords] = useState<StudentGradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GradeFiltersState>({
    classId: "",
    subjectId: "",
    semester: defaultSemester(),
    viewType: "all",
  });

  // Giáo viên chỉ nhập điểm ở lớp/môn đã được phân công; admin chọn bất kỳ.
  const classOptions = useMemo(() => {
    if (!options.restricted) return options.classes;
    const allowed = new Set(options.pairs.map((p) => p.classId));
    return options.classes.filter((c) => allowed.has(c.id));
  }, [options]);

  const subjectOptions = useMemo(() => {
    if (!options.restricted) return options.subjects;
    const classId = Number(filters.classId);
    const allowed = new Set(
      options.pairs.filter((p) => p.classId === classId).map((p) => p.subjectId),
    );
    return options.subjects.filter((s) => allowed.has(s.id));
  }, [options, filters.classId]);

  // Giữ lựa chọn lớp/môn hợp lệ (chọn mục đầu tiên khi chưa có hoặc không còn hợp lệ).
  useEffect(() => {
    if (optionsLoading) return;
    setFilters((prev) => {
      const classId = classOptions.some((c) => String(c.id) === prev.classId)
        ? prev.classId
        : classOptions[0]
          ? String(classOptions[0].id)
          : "";
      const subjects = options.restricted
        ? options.subjects.filter((s) =>
            options.pairs.some((p) => p.classId === Number(classId) && p.subjectId === s.id),
          )
        : options.subjects;
      const subjectId = subjects.some((s) => String(s.id) === prev.subjectId)
        ? prev.subjectId
        : subjects[0]
          ? String(subjects[0].id)
          : "";
      return classId === prev.classId && subjectId === prev.subjectId
        ? prev
        : { ...prev, classId, subjectId };
    });
  }, [optionsLoading, classOptions, options]);

  const fetchRecords = useCallback(async () => {
    if (!filters.classId || !filters.subjectId) {
      setRecords([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setRecords(await gradeService.getGradeRecords(filters));
      setIsDirty(false);
    } catch (e) {
      setRecords([]);
      setError(e instanceof Error ? e.message : "Không thể tải bảng điểm.");
    } finally {
      setIsLoading(false);
    }
  }, [filters.classId, filters.subjectId, filters.semester]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCellChange = (id: string, field: GradeField, valStr: string) => {
    const clean = valStr.replace(",", ".").trim();
    let num: number | null = null;
    if (clean !== "") {
      num = Number(clean);
      // Bỏ qua ký tự không phải số hoặc ngoài thang 0-10 (giữ nguyên giá trị cũ).
      if (Number.isNaN(num) || num < 0 || num > 10) return;
    }
    setIsDirty(true);
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: num };
        const { avg, rank } = calculateAverage(updated.tx1, updated.tx2, updated.tx3, updated.gk, updated.ck);
        return { ...updated, avgScore: avg, rank };
      }),
    );
  };

  const saveGrades = async () => {
    setIsSaving(true);
    try {
      await gradeService.saveAllGrades(filters, records);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const totalStudents = records.length;
  const completedCount = records.filter((r) => r.avgScore !== null).length;
  const validAvgs = records.map((r) => r.avgScore).filter((s): s is number => s !== null);
  const classAverage = validAvgs.length
    ? (validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length).toFixed(2)
    : "--";

  return {
    options,
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
    saveGrades,
    refresh: fetchRecords,
    totalStudents,
    completedCount,
    classAverage,
  };
};
