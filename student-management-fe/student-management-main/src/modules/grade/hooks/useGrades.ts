import { useState, useEffect, useCallback } from "react";
import { StudentGradeRecord, GradeFiltersState } from "../types";
import { gradeService } from "../services/grade.service";
import { calculateAverage } from "../mocks/grade.mock";

export const useGrades = (initialFilters?: Partial<GradeFiltersState>) => {
  const [records, setRecords] = useState<StudentGradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [filters, setFilters] = useState<GradeFiltersState>({
    className: initialFilters?.className || "10A1",
    subject: initialFilters?.subject || "math",
    semester: initialFilters?.semester || "sem2-2023-2024",
    viewType: initialFilters?.viewType || "all",
  });

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await gradeService.getGradeRecords(filters);
      setRecords(data);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCellChange = (
    id: string,
    field: "tx1" | "tx2" | "tx3" | "gk" | "ck",
    valStr: string,
  ) => {
    const cleanStr = valStr.replace(",", ".").trim();
    const num = cleanStr === "" ? null : parseFloat(cleanStr);

    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: isNaN(num as number) ? null : num };
        const { avg, rank } = calculateAverage(
          updated.tx1,
          updated.tx2,
          updated.tx3,
          updated.gk,
          updated.ck,
        );
        updated.avgScore = avg;
        updated.rank = rank;
        return updated;
      }),
    );
  };

  const saveGrades = async () => {
    return await gradeService.saveAllGrades(records);
  };

  // Aggregates
  const totalStudents = records.length;
  const completedCount = records.filter(
    (r) =>
      r.tx1 !== null &&
      r.tx2 !== null &&
      r.tx3 !== null &&
      r.gk !== null &&
      r.ck !== null,
  ).length;

  const validAvgs = records
    .map((r) => r.avgScore)
    .filter((s): s is number => s !== null);
  const classAverage = validAvgs.length
    ? (validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length).toFixed(2)
    : "0.00";

  return {
    records,
    isLoading,
    isLocked,
    setIsLocked,
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
