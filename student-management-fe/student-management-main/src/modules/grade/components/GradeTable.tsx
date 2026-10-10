import React, { useRef, useState } from 'react';
import { GradeField, StudentGradeRecord } from '../types';
import { GRADE_COLUMNS } from '../utils';

interface GradeTableProps {
  records: StudentGradeRecord[];
  onCellChange: (id: string, field: GradeField, val: string) => void;
  viewType?: 'all' | 'tx' | 'exam';
  /** Số thứ tự của dòng đầu tiên (dùng khi phân trang) */
  startIndex?: number;
  isLocked?: boolean;
}

const formatCell = (value: number | null) => (value === null ? '' : String(value));
const parseCell = (text: string): number | null => {
  const clean = text.replace(',', '.').trim();
  if (clean === '') return null;
  const n = Number(clean);
  return Number.isNaN(n) ? null : n;
};

/** Ô nhập điểm giữ văn bản đang gõ (vd "8.") để người dùng nhập được số thập phân. */
const CellInput: React.FC<{
  value: number | null;
  onChange: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  row: number;
  col: number;
  disabled?: boolean;
  accent?: boolean;
  label: string;
}> = ({ value, onChange, onKeyDown, row, col, disabled, accent, label }) => {
  const [text, setText] = useState(formatCell(value));
  if (parseCell(text) !== value) {
    setText(formatCell(value));
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      disabled={disabled}
      data-row={row}
      data-col={col}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value);
      }}
      onKeyDown={onKeyDown}
      className={`w-20 h-10 text-center font-mono text-xs rounded-xl bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none font-semibold transition-all disabled:opacity-50 ${accent ? 'text-primary' : ''}`}
    />
  );
};

export const GradeTable: React.FC<GradeTableProps> = ({
  records,
  onCellChange,
  viewType = 'all',
  startIndex = 0,
  isLocked,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const columns = GRADE_COLUMNS.filter((c) => viewType === 'all' || c.group === viewType);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      targetRow = rowIndex + 1;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      targetRow = rowIndex - 1;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (colIndex < columns.length - 1) {
        targetCol = colIndex + 1;
      } else {
        targetRow = rowIndex + 1;
        targetCol = 0;
      }
    }

    if (targetRow !== rowIndex || targetCol !== colIndex) {
      const nextInput = tableRef.current?.querySelector<HTMLInputElement>(
        `input[data-row="${targetRow}"][data-col="${targetCol}"]`
      );
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const getRankBadge = (rank: StudentGradeRecord['rank']) => {
    switch (rank) {
      case 'Giỏi':
        return (
          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-surface-container-highest text-secondary">
            Giỏi
          </span>
        );
      case 'Khá':
        return (
          <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-primary">
            Khá
          </span>
        );
      case 'Đạt':
        return (
          <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant">
            Đạt
          </span>
        );
      case 'Chưa đạt':
        return (
          <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container">
            Chưa đạt
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-surface-container text-outline">
            Chưa hoàn tất
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <table ref={tableRef} className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container text-xs text-on-surface-variant uppercase tracking-wider select-none h-11">
              <th className="py-3 px-4 text-center w-12 font-semibold">STT</th>
              <th className="py-3 px-4 w-28 font-semibold">Mã HS</th>
              <th className="py-3 px-6 min-w-[200px] font-semibold">Họ và Tên</th>
              {columns.map((c) => (
                <th key={c.field} className={`py-3 px-2 text-center w-28 ${c.group === 'exam' ? 'font-bold text-primary' : 'font-semibold'}`}>
                  {c.label}
                </th>
              ))}
              <th className="py-3 px-4 text-right w-28 font-semibold text-secondary">ĐTB Môn</th>
              <th className="py-3 px-6 text-center w-32 font-semibold">Xếp Loại</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 text-sm text-on-surface font-sans">
            {records.length === 0 && (
              <tr>
                <td colSpan={5 + columns.length} className="py-10 text-center text-sm text-on-surface-variant">
                  Lớp này chưa có học sinh đang theo học.
                </td>
              </tr>
            )}
            {records.map((r, rowIndex) => (
              <tr key={r.id} className="hover:bg-surface-container-low/60 transition-colors">
                <td className="py-2.5 px-4 text-center font-mono text-xs text-outline">
                  {(startIndex + rowIndex + 1).toString().padStart(2, '0')}
                </td>
                <td className="py-2.5 px-4 font-mono text-xs font-semibold text-on-surface">{r.studentCode}</td>
                <td className="py-2.5 px-6 font-medium">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-[11px] shrink-0">
                      {r.avatarInitials}
                    </div>
                    <span className="truncate">{r.fullName}</span>
                  </div>
                </td>
                {columns.map((c, colIndex) => (
                  <td key={c.field} className="py-2.5 px-1 text-center">
                    <CellInput
                      value={r[c.field]}
                      label={`${c.label} - ${r.fullName}`}
                      row={rowIndex}
                      col={colIndex}
                      disabled={isLocked}
                      accent={c.group === 'exam'}
                      onChange={(text) => onCellChange(r.id, c.field, text)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    />
                  </td>
                ))}
                <td className="py-2.5 px-4 text-right font-mono text-sm font-bold text-secondary">
                  {r.avgScore !== null ? r.avgScore.toFixed(1) : '--'}
                </td>
                <td className="py-2.5 px-6 text-center">{getRankBadge(r.rank)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
