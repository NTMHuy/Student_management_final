'use client';

import React from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

import { useRouter } from 'next/navigation';
import { useClasses } from '@/modules/class/hooks/useClasses';
import { Save, ArrowLeft } from 'lucide-react';

export default function NewClassPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: '',
    gradeLevel: '10',
    academicYear: '2024 - 2025',
    room: '',
    stream: 'KHTN',
    homeroomTeacher: 'ThS. Vũ Hoàng Minh',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên lớp.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/classes');
    }, 400);
  };

  return (
    
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex flex-col gap-1">
          <Breadcrumb
            items={[
              { label: 'Lớp học', href: '/classes' },
              { label: 'Tạo lớp học mới', isCurrent: true },
            ]}
          />
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">
              Thiết lập Lớp học mới
            </h1>
            <button
              type="button"
              onClick={() => router.push('/classes')}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-xl bg-surface-container"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Tên lớp học <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 10A3"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Khối <span className="text-error">*</span>
              </label>
              <select
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-secondary"
              >
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Phòng học
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Phòng A-204"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Tổ hợp môn học / Ban
              </label>
              <select
                value={formData.stream}
                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-secondary"
              >
                <option value="KHTN">Khoa học Tự nhiên (Lý - Hóa - Sinh)</option>
                <option value="KHXH">Khoa học Xã hội (Sử - Địa - KT&PL)</option>
                <option value="Quốc tế">Lớp Quốc tế / D1</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Phân công Giáo viên chủ nhiệm
              </label>
              <select
                value={formData.homeroomTeacher}
                onChange={(e) => setFormData({ ...formData, homeroomTeacher: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-secondary"
              >
                <option value="ThS. Vũ Hoàng Minh">ThS. Vũ Hoàng Minh (Toán - Tin học)</option>
                <option value="Cô Lê Mai Hương">Cô Lê Mai Hương (Ngữ văn)</option>
                <option value="Thầy Phạm Hoàng Nam">Thầy Phạm Hoàng Nam (Vật lý)</option>
                <option value="ThS. Nguyễn Thị Thu Hà">ThS. Nguyễn Thị Thu Hà (Hóa học)</option>
                <option value="Thầy Vũ Đức Thắng">Thầy Vũ Đức Thắng (Sinh học)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => router.push('/classes')}
              className="px-5 py-2.5 rounded-xl bg-surface-container text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container shadow transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Tạo lớp học'}</span>
            </button>
          </div>
        </form>
      </div>
    
  );
}
