'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { apiRequest } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { teacherService } from '@/modules/teacher/services/teacher.service';
import { classService } from '@/modules/class/services/class.service';
import { subjectService } from '@/modules/subject/services/subject.service';
import type { Teacher } from '@/modules/teacher/types';
import type { SchoolClass } from '@/modules/class/types';
import type { Subject } from '@/modules/subject/types';
import { BookOpen, ClipboardList, Loader2, Plus, RefreshCw, Trash2, UserRound } from 'lucide-react';

interface TeachingAssignment {
  id: number;
  teacherId: number;
  teacherName: string;
  classId: number;
  className: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
}

export default function TeachingAssignmentsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [teacherRows, classRows, subjectRows, assignmentRows] = await Promise.all([
        teacherService.getTeachers(),
        classService.getClasses(),
        subjectService.getSubjects(),
        apiRequest<TeachingAssignment[]>(API_ENDPOINTS.assignments),
      ]);
      setTeachers(teacherRows);
      setClasses(classRows);
      setSubjects(subjectRows);
      setAssignments(assignmentRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu phân công.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!teacherId || !classId || !subjectId) {
      setError('Vui lòng chọn đầy đủ giáo viên, lớp và môn học.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await apiRequest<TeachingAssignment>(API_ENDPOINTS.assignments, {
        method: 'POST',
        body: {
          teacherId: Number(teacherId),
          classId: Number(classId),
          subjectId: Number(subjectId),
        },
      });
      setAssignments((current) => [...current, created].sort((a, b) =>
        a.teacherName.localeCompare(b.teacherName, 'vi') ||
        a.className.localeCompare(b.className, 'vi') ||
        a.subjectName.localeCompare(b.subjectName, 'vi'),
      ));
      setTeacherId('');
      setClassId('');
      setSubjectId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo phân công.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignment: TeachingAssignment) => {
    if (!window.confirm(`Xóa phân công ${assignment.teacherName} – ${assignment.className} – ${assignment.subjectName}?`)) return;
    setDeletingId(assignment.id);
    setError('');
    try {
      await apiRequest<void>(`${API_ENDPOINTS.assignments}/${assignment.id}`, { method: 'DELETE' });
      setAssignments((current) => current.filter((item) => item.id !== assignment.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa phân công.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb items={[
          { label: 'Quản lý', href: '/teachers' },
          { label: 'Phân công giảng dạy', isCurrent: true },
        ]} />
        <div className="mt-2 flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">Phân công giảng dạy</h1>
          <p className="text-sm text-on-surface-variant">
            Gán giáo viên phụ trách từng lớp và môn học. Phân công này được dùng để kiểm soát quyền truy cập điểm số và nghiệp vụ lớp học.
          </p>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}

      <form onSubmit={handleCreate} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-on-surface">Tạo phân công mới</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Giáo viên
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required className="rounded-xl border border-outline-variant bg-background px-3 py-2.5 font-normal">
              <option value="">Chọn giáo viên</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.teacherCode} – {teacher.fullName}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Lớp học
            <select value={classId} onChange={(e) => setClassId(e.target.value)} required className="rounded-xl border border-outline-variant bg-background px-3 py-2.5 font-normal">
              <option value="">Chọn lớp</option>
              {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.className}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Môn học
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required className="rounded-xl border border-outline-variant bg-background px-3 py-2.5 font-normal">
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.subjectCode} – {subject.name}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={saving || loading} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Lưu phân công
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-on-surface">Danh sách phân công</h2>
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-semibold text-on-surface-variant">{assignments.length}</span>
          </div>
          <button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-on-surface-variant"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu...</div>
        ) : assignments.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-on-surface-variant">Chưa có phân công giảng dạy nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 font-semibold">Giáo viên</th>
                  <th className="px-5 py-3 font-semibold">Lớp</th>
                  <th className="px-5 py-3 font-semibold">Môn học</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-surface-container-low/60">
                    <td className="px-5 py-3.5"><span className="flex items-center gap-2 font-medium text-on-surface"><UserRound className="h-4 w-4 text-outline" />{assignment.teacherName}</span></td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{assignment.className}</td>
                    <td className="px-5 py-3.5"><span className="inline-flex items-center gap-1.5 text-on-surface-variant"><BookOpen className="h-4 w-4 text-outline" />{assignment.subjectCode} – {assignment.subjectName}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" onClick={() => void handleDelete(assignment)} disabled={deletingId === assignment.id} aria-label="Xóa phân công" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-50">
                        {deletingId === assignment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
