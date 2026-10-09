import { useState, useEffect, useCallback } from 'react';
import { SchoolClass, ClassFiltersState, ClassLeader } from '../types';
import { classService } from '../services/class.service';

export const useClasses = (initialFilters?: Partial<ClassFiltersState>) => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClassFiltersState>({
    search: initialFilters?.search || '',
    gradeLevel: initialFilters?.gradeLevel || '',
    stream: initialFilters?.stream || '',
    capacity: initialFilters?.capacity || '',
  });

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await classService.getClasses(filters);
      setClasses(data);
    } catch {
      setError('Không thể tải danh sách lớp học.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const updateFilters = (newFilters: Partial<ClassFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      gradeLevel: '',
      stream: '',
      capacity: '',
    });
  };

  const assignTeacher = async (classId: string, teacher: SchoolClass['homeroomTeacher']) => {
    const updated = await classService.assignTeacher(classId, teacher);
    await fetchClasses();
    return updated;
  };

  const addStudent = async (
    classId: string,
    student: { fullName: string; studentCode: string; dateOfBirth: string }
  ) => {
    const updated = await classService.addStudent(classId, student);
    await fetchClasses();
    return updated;
  };

  const removeStudent = async (classId: string, studentId: string) => {
    const updated = await classService.removeStudent(classId, studentId);
    await fetchClasses();
    return updated;
  };

  const updateLeaders = async (classId: string, leaders: ClassLeader[]) => {
    const updated = await classService.updateLeaders(classId, leaders);
    await fetchClasses();
    return updated;
  };

  return {
    classes,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh: fetchClasses,
    assignTeacher,
    addStudent,
    removeStudent,
    updateLeaders,
  };
};
