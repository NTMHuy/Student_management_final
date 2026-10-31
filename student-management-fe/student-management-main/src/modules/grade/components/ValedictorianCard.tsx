import React from 'react';
import { Award, Info } from 'lucide-react';
import { StudentGradeRecord } from '../types';

interface ValedictorianCardProps {
  records: StudentGradeRecord[];
  className: string;
}

/** Sinh viên có điểm tổng kết cao nhất của lớp/môn đang xem. */
export const ValedictorianCard: React.FC<ValedictorianCardProps> = ({ records, className }) => {
  const ranked = records.filter((r) => r.avgScore !== null);
  const top = ranked.reduce<StudentGradeRecord | null>(
    (best, r) => (best === null || (r.avgScore ?? 0) > (best.avgScore ?? 0) ? r : best),
    null,
  );

  return (
    <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col justify-between gap-3 h-full">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold shadow-sm shrink-0">
          <Award className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase text-outline tracking-wider">Sinh viên có điểm cao nhất</span>
          {top ? (
            <>
              <span className="font-bold text-sm text-on-surface">
                {top.fullName}{className ? ` (${className})` : ''}
              </span>
              <span className="font-mono text-xs text-secondary font-bold">
                Điểm tổng kết: {top.avgScore?.toFixed(2)} • {top.rank}
              </span>
            </>
          ) : (
            <span className="text-sm text-on-surface-variant">Chưa có sinh viên nào đủ điểm</span>
          )}
        </div>
      </div>
      <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-outline" />
        <span>Điểm tổng kết = trung bình quá trình × trọng số quá trình + giữa kỳ × trọng số giữa kỳ + cuối kỳ × trọng số cuối kỳ.</span>
      </div>
    </div>
  );
};
