import { useState, useEffect, useCallback, useMemo } from "react";
import { StudentGradeRecord, GradeFiltersState, GradeField } from "../types";
import { gradeService } from "../services/grade.service";
import { calculateWeightedAverage, defaultSemester, rankOf } from "../utils";
import { useTeachingOptions } from "@/modules/teaching/hooks/useTeachingOptions";

export const useGrades = () => {
  const { options, isLoading: optionsLoading, error: optionsError } = useTeachingOptions();
  const [records, setRecords] = useState<StudentGradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GradeFiltersState>({
    classId: "", subjectId: "", semester: defaultSemester(), viewType: "all",
  });

  const classOptions = useMemo(() => {
    if (!options.restricted) return options.classes;
    const allowed = new Set(options.pairs.map((p) => p.classId));
    return options.classes.filter((c) => allowed.has(c.id));
  }, [options]);

  const subjectOptions = useMemo(() => {
    if (!options.restricted) return options.subjects;
    const classId = Number(filters.classId);
    const allowed = new Set(options.pairs.filter((p) => p.classId === classId).map((p) => p.subjectId));
    return options.subjects.filter((s) => allowed.has(s.id));
  }, [options, filters.classId]);

  useEffect(() => {
    if (optionsLoading) return;
    setFilters((prev) => {
      const classId = classOptions.some((c) => String(c.id) === prev.classId)
        ? prev.classId : classOptions[0] ? String(classOptions[0].id) : "";
      const subjects = options.restricted
        ? options.subjects.filter((s) => options.pairs.some((p) => p.classId === Number(classId) && p.subjectId === s.id))
        : options.subjects;
      const subjectId = subjects.some((s) => String(s.id) === prev.subjectId)
        ? prev.subjectId : subjects[0] ? String(subjects[0].id) : "";
      return classId === prev.classId && subjectId === prev.subjectId ? prev : { ...prev, classId, subjectId };
    });
  }, [optionsLoading, classOptions, options]);

  const fetchRecords = useCallback(async () => {
    if (!filters.classId || !filters.subjectId) { setRecords([]); return; }
    setIsLoading(true); setError(null);
    try {
      setRecords(await gradeService.getGradeRecords(filters));
      setIsDirty(false);
    } catch (e) {
      setRecords([]);
      setError(e instanceof Error ? e.message : "Không thể tải bảng điểm.");
    } finally { setIsLoading(false); }
  }, [filters.classId, filters.subjectId, filters.semester]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const updateRecord = (id: string, update: (record: StudentGradeRecord) => StudentGradeRecord) => {
    setIsDirty(true);
    setRecords((prev) => prev.map((record) => record.id === id ? update(record) : record));
  };

  const handleCellChange = (id: string, field: GradeField, valStr: string) => {
    const clean = valStr.replace(",", ".").trim();
    const value = clean === "" ? null : Number(clean);
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 10 || clean.split(".")[1]?.length > 2)) return;
    updateRecord(id, (record) => {
      let updated = { ...record };
      if (field === "midterm") updated.midtermScore = value;
      else if (field === "final") updated.finalScore = value;
      else {
        const number = Number(field.split(":")[1]);
        updated.processScores = updated.processScores.map((item) =>
          item.assessmentNumber === number ? { ...item, score: value } : item);
      }
      const valid = updated.processScores.filter((item) => item.score !== null);
      updated.processAverage = valid.length
        ? Math.round(valid.reduce((sum, item) => sum + (item.score ?? 0), 0) / valid.length * 100) / 100
        : null;
      if (updated.processWeight !== null && updated.midtermWeight !== null && updated.finalWeight !== null) {
        updated.avgScore = calculateWeightedAverage(updated.processAverage, updated.midtermScore,
          updated.finalScore, updated.processWeight, updated.midtermWeight, updated.finalWeight);
        updated.rank = rankOf(updated.avgScore);
      } else {
        updated.avgScore = null; updated.rank = null;
      }
      return updated;
    });
  };

  const addProcessAssessment = (id: string) => updateRecord(id, (record) => ({
    ...record,
    processScores: [...record.processScores, {
      assessmentNumber: Math.max(0, ...record.processScores.map((item) => item.assessmentNumber)) + 1,
      score: null,
    }],
  }));

  const saveGrades = async () => {
    setIsSaving(true);
    try {
      await gradeService.saveAllGrades(filters, records);
      await fetchRecords();
      setIsDirty(false);
    } finally { setIsSaving(false); }
  };

  const totalStudents = records.length;
  const completedCount = records.filter((r) => r.avgScore !== null).length;
  const validAvgs = records.map((r) => r.avgScore).filter((s): s is number => s !== null);
  const classAverage = validAvgs.length
    ? (validAvgs.reduce((a,b) => a+b,0) / validAvgs.length).toFixed(2) : "--";

  return {
    options, classOptions, subjectOptions, optionsLoading, optionsError,
    records, isLoading, isSaving, isDirty, error, filters, setFilters,
    handleCellChange, addProcessAssessment, saveGrades, refresh: fetchRecords,
    totalStudents, completedCount, classAverage,
  };
};
