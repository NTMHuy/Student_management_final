import React from 'react';
import { GradeField, StudentGradeRecord } from '../types';

interface GradeTableProps {
  records: StudentGradeRecord[];
  onCellChange: (id: string, field: GradeField, val: string) => void;
  onAddProcess: (id: string) => void;
  viewType?: 'all' | 'process' | 'exam';
  startIndex?: number;
  isLocked?: boolean;
}

const ScoreInput: React.FC<{
  value: number | null;
  label: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}> = ({ value, label, disabled, onChange }) => (
  <input
    type="number" min="0" max="10" step="0.01" inputMode="decimal"
    aria-label={label} disabled={disabled} value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-20 h-10 text-center font-mono text-xs rounded-xl bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none font-semibold disabled:opacity-50"
  />
);

export const GradeTable: React.FC<GradeTableProps> = ({
  records, onCellChange, onAddProcess, viewType = 'all', startIndex = 0, isLocked,
}) => {
  const showProcess = viewType === 'all' || viewType === 'process';
  const showExam = viewType === 'all' || viewType === 'exam';
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container text-xs text-on-surface-variant uppercase tracking-wider h-11">
              <th className="py-3 px-4 text-center w-12">STT</th>
              <th className="py-3 px-4 w-28">Mã SV</th>
              <th className="py-3 px-6 min-w-[190px]">Họ và tên</th>
              {showProcess && <th className="py-3 px-3 min-w-[240px] text-center">Điểm quá trình</th>}
              {showExam && <th className="py-3 px-3 text-center">Giữa kỳ</th>}
              {showExam && <th className="py-3 px-3 text-center">Cuối kỳ</th>}
              <th className="py-3 px-3 text-center">ĐTB quá trình</th>
              <th className="py-3 px-3 text-center">Điểm tổng kết</th>
              <th className="py-3 px-4 text-center">Xếp loại</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 text-sm text-on-surface">
            {records.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-sm text-on-surface-variant">Lớp chưa có sinh viên đang theo học.</td></tr>}
            {records.map((record, index) => (
              <tr key={record.id} className="hover:bg-surface-container-low/60">
                <td className="py-3 px-4 text-center font-mono text-xs text-outline">{(startIndex + index + 1).toString().padStart(2,'0')}</td>
                <td className="py-3 px-4 font-mono text-xs font-semibold">{record.studentCode}</td>
                <td className="py-3 px-6 font-medium">{record.fullName}</td>
                {showProcess && (
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {record.processScores.map((item) => (
                        <div key={item.assessmentNumber} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-outline">Lần {item.assessmentNumber}</span>
                          <ScoreInput value={item.score} disabled={isLocked}
                            label={`Điểm quá trình lần ${item.assessmentNumber} - ${record.fullName}`}
                            onChange={(value) => onCellChange(record.id, `process:${item.assessmentNumber}`, value)} />
                        </div>
                      ))}
                      <button type="button" disabled={isLocked} onClick={() => onAddProcess(record.id)}
                        className="h-9 px-3 rounded-lg border border-dashed border-outline-variant text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-40">
                        + Thêm lần
                      </button>
                    </div>
                  </td>
                )}
                {showExam && <td className="py-3 px-3 text-center">
                  <ScoreInput value={record.midtermScore} disabled={isLocked} label={`Điểm giữa kỳ - ${record.fullName}`}
                    onChange={(value) => onCellChange(record.id, 'midterm', value)} />
                </td>}
                {showExam && <td className="py-3 px-3 text-center">
                  <ScoreInput value={record.finalScore} disabled={isLocked} label={`Điểm cuối kỳ - ${record.fullName}`}
                    onChange={(value) => onCellChange(record.id, 'final', value)} />
                </td>}
                <td className="py-3 px-3 text-center font-mono">{record.processAverage?.toFixed(2) ?? '--'}</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-secondary">{record.avgScore?.toFixed(2) ?? '--'}</td>
                <td className="py-3 px-4 text-center text-xs font-semibold">{record.rank ?? 'Chưa đủ điểm'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
