import React, { useRef } from 'react';
import { StudentGradeRecord } from '../types';

interface GradeTableProps {
  records: StudentGradeRecord[];
  onCellChange: (id: string, field: 'tx1' | 'tx2' | 'tx3' | 'gk' | 'ck', val: string) => void;
  isLocked?: boolean;
}

export const GradeTable: React.FC<GradeTableProps> = ({
  records,
  onCellChange,
  isLocked,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);

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
      if (colIndex < 4) {
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
              <th className="py-3 px-2 text-center w-28 font-semibold">Miệng (TX1)</th>
              <th className="py-3 px-2 text-center w-28 font-semibold">15 Phút (TX2)</th>
              <th className="py-3 px-2 text-center w-28 font-semibold">1 Tiết (TX3)</th>
              <th className="py-3 px-2 text-center w-28 font-bold text-primary">Giữa Kỳ (x2)</th>
              <th className="py-3 px-2 text-center w-28 font-bold text-primary">Cuối Kỳ (x3)</th>
              <th className="py-3 px-4 text-right w-28 font-semibold text-secondary">ĐTB Môn</th>
              <th className="py-3 px-6 text-center w-32 font-semibold">Xếp Loại</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 text-sm text-on-surface font-sans">
            {records.map((r, rowIndex) => {
              const indexStr = (rowIndex + 1).toString().padStart(2, '0');

              return (
                <tr
                  key={r.id}
                  className="hover:bg-surface-container-low/60 transition-colors"
                >
                  <td className="py-2.5 px-4 text-center font-mono text-xs text-outline">
                    {indexStr}
                  </td>

                  <td className="py-2.5 px-4 font-mono text-xs font-semibold text-on-surface">
                    {r.studentCode}
                  </td>

                  <td className="py-2.5 px-6 font-medium">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-[11px] shrink-0">
                        {r.avatarInitials}
                      </div>
                      <span className="truncate">{r.fullName}</span>
                    </div>
                  </td>

                  {/* TX1 */}
                  <td className="py-2.5 px-1 text-center">
                    <input
                      type="text"
                      disabled={isLocked}
                      data-row={rowIndex}
                      data-col={0}
                      value={r.tx1 ?? ''}
                      onChange={(e) => onCellChange(r.id, 'tx1', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                      className="w-20 h-10 text-center font-mono text-xs rounded-xl bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none font-semibold transition-all disabled:opacity-50"
                    />
                  </td>

                  {/* TX2 */}
                  <td className="py-2.5 px-1 text-center">
                    <input
                      type="text"
                      disabled={isLocked}
                      data-row={rowIndex}
                      data-col={1}
                      value={r.tx2 ?? ''}
                      onChange={(e) => onCellChange(r.id, 'tx2', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
                      className="w-20 h-10 text-center font-mono text-xs rounded-xl bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none font-semibold transition-all disabled:opacity-50"
                    />
                  </td>

                  {/* TX3 */}
                  <td className="py-2.5 px-1 text-center">
                    <input
                      type="text"
                      disabled={isLocked}
                      data-row={rowIndex}
                      data-col={2}
                      value={r.tx3 ?? ''}
                      onChange={(e) => onCellChange(r.id, 'tx3', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 2)}
                      className="w-20 h-10 text-center font-mono text-xs rounded-xl bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none font-semibold transition-all disabled:opacity-50"
                    />
                  </td>

                  {/* GK (x2) */}
                  <td className="py-2.5 px-1 text-center">
                    <input
                      type="text"
                      disabled={isLocked}
                      data-row={rowIndex}
                      data-col={3}
                      value={r.gk ?? ''}
                      onChange={(e) => onCellChange(r.id, 'gk', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 3)}
                      className="w-20 h-10 text-center font-mono text-xs rounded-xl bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-primary transition-all disabled:opacity-50"
                    />
                  </td>

                  {/* CK (x3) */}
                  <td className="py-2.5 px-1 text-center">
                    <input
                      type="text"
                      disabled={isLocked}
                      data-row={rowIndex}
                      data-col={4}
                      value={r.ck ?? ''}
                      onChange={(e) => onCellChange(r.id, 'ck', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 4)}
                      className="w-20 h-10 text-center font-mono text-xs rounded-xl bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-primary transition-all disabled:opacity-50"
                    />
                  </td>

                  {/* ĐTB */}
                  <td className="py-2.5 px-4 text-right font-mono text-sm font-bold text-secondary">
                    {r.avgScore !== null ? r.avgScore.toFixed(1) : '--'}
                  </td>

                  {/* Xếp Loại */}
                  <td className="py-2.5 px-6 text-center">
                    {getRankBadge(r.rank)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
