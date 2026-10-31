import React, { useState, useEffect } from 'react';
import { Student, StudentFormData } from '../types';
import { GRADE_LEVELS } from '../constants';
import { useClassOptions } from '@/modules/class/hooks/useClassOptions';
import { X, Save, ChevronDown } from 'lucide-react';

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<void>;
  initialData?: Student | null;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: '',
    dateOfBirth: '2007-05-14',
    gender: 'male',
    gradeLevel: 10,
    className: '',
    parentEmail: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

    const { options: classOptions, isLoading: isLoadingClasses } = useClassOptions();
  const classesForGrade = classOptions.filter(
    (c) => c.gradeLevel === Number(formData.gradeLevel),
  );

  // Chỉ khi THÊM MỚI: chọn sẵn lớp đầu tiên của khối khi danh sách lớp tải xong.
  useEffect(() => {
    if (!isOpen || initialData || classOptions.length === 0) return;
    const valid = classOptions.filter((c) => c.gradeLevel === Number(formData.gradeLevel));
    if (!valid.some((c) => c.value === formData.className)) {
      setFormData((prev) => ({ ...prev, className: valid[0]?.value ?? '' }));
    }
  }, [isOpen, initialData, classOptions, formData.gradeLevel, formData.className]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName,
        dateOfBirth: initialData.dateOfBirth.includes('/')
          ? initialData.dateOfBirth.split('/').reverse().join('-')
          : initialData.dateOfBirth,
        gender: initialData.gender,
        gradeLevel: initialData.gradeLevel,
        className: initialData.className,
        parentEmail: initialData.parentEmail,
        phone: initialData.phone,
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        fullName: '',
        dateOfBirth: '2008-01-15',
        gender: 'male',
        gradeLevel: 10,
        className: '',
        parentEmail: '',
        phone: '',
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-right duration-300 h-full border-l border-outline-variant/30">
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Drawer Header */}
          <div className="p-6 pb-5 flex items-center justify-between bg-surface-container-low border-b border-outline-variant/20">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-primary">
                {initialData ? 'Chỉnh Sửa Hồ Sơ Học Sinh' : 'Thêm Học Sinh Mới'}
              </h2>
              <span className="text-xs text-on-surface-variant">
                {initialData
                  ? `Mã hồ sơ: ${initialData.studentCode} • Cập nhật dữ liệu`
                  : 'Nhập thông tin hồ sơ cơ bản của học sinh để lập mã số.'}
              </span>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form id="student-drawer-form" onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 flex-1">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">
                Họ và tên học sinh <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ví dụ: Hoàng Tuấn Kiệt"
                className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl outline-none text-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all border border-transparent focus:border-secondary"
              />
            </div>

            {/* Birthday & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  Ngày sinh <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl outline-none text-sm text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all border border-transparent focus:border-secondary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  Giới tính <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as StudentFormData['gender'] })
                    }
                    className="w-full appearance-none px-3.5 py-2.5 bg-surface-container-low rounded-xl outline-none text-sm text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer border border-transparent focus:border-secondary"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <ChevronDown className="w-4 h-4 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
                </div>
              </div>
            </div>

            {/* Grade level & Class */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  Khối lớp <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => {
                      const grade = Number(e.target.value);
                      const first = classOptions.find((c) => c.gradeLevel === grade);
                      setFormData({ ...formData, gradeLevel: grade, className: first?.value ?? '' });
                    }}
                    className="w-full appearance-none px-3.5 py-2.5 bg-surface-container-low rounded-xl outline-none text-sm text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer border border-transparent focus:border-secondary"
                  >
                    {GRADE_LEVELS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline w-[18px] h-[18px]" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Lớp học phân bổ</label>
                <div className="relative">
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full appearance-none px-3.5 py-2.5 bg-surface-container-low rounded-xl outline-none text-sm text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer border border-transparent focus:border-secondary"
                  >
                                        {formData.className && !classesForGrade.some((c) => c.value === formData.className) && (
                      <option value={formData.className}>{formData.className}</option>
                    )}
                    {classesForGrade.length === 0 && !formData.className && (
                      <option value="">
                        {isLoadingClasses ? 'Đang tải danh sách lớp...' : 'Chưa có lớp nào ở khối này'}
                      </option>
                    )}
                    {classesForGrade.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline w-[18px] h-[18px]" />
                </div>
              </div>
            </div>

            {/* Parent Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">
                Địa chỉ Email phụ huynh / liên hệ
              </label>
              <input
                type="email"
                value={formData.parentEmail}
                onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                placeholder="phuhuynh@example.com"
                className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl outline-none text-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all border border-transparent focus:border-secondary"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Số điện thoại liên lạc</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl outline-none text-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all border border-transparent focus:border-secondary"
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">
                Ghi chú tình trạng nhập học
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Nhập ghi chú hạnh kiểm hoặc giấy tờ bổ sung..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl outline-none text-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/20 transition-all resize-none border border-transparent focus:border-secondary"
              />
            </div>
          </form>

          {/* Drawer Actions Footer */}
          <div className="p-4 px-6 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-surface-container text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="student-drawer-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:bg-primary-container shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu hồ sơ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
