import React from 'react';
import { AttendanceEarlyWarning } from '../types';
import { Info } from 'lucide-react';

interface EarlyWarningWidgetProps {
  warnings: AttendanceEarlyWarning[];
}

export const EarlyWarningWidget: React.FC<EarlyWarningWidgetProps> = ({ warnings }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 flex flex-col gap-4" id="early-warning-box">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${warnings.length > 0 ? 'bg-error animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-bold text-sm text-on-surface">Cảnh báo vắng nhiều</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-error-container text-error">
            &ge; 3 buổi / 30 ngày
          </span>
        </div>

        {warnings.length === 0 ? (
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Hiện chưa có học sinh nào vắng từ 3 buổi trở lên trong 30 ngày gần nhất.
          </p>
        ) : (
          <>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Học sinh vắng từ 3 buổi trở lên trong 30 ngày gần nhất, cần giáo viên chủ nhiệm theo dõi và liên hệ phụ huynh:
            </p>
            <div className="flex flex-col gap-3">
              {warnings.map((w, index) => {
                const isHighest = index === 0;
                return (
                  <div
                    key={w.id}
                    className={`p-3.5 rounded-xl flex flex-col gap-2 border ${
                      isHighest ? 'bg-error-container/20 border-error/30' : 'bg-surface-container-low border-outline-variant/15'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                            isHighest ? 'bg-error-container text-error' : 'bg-surface-container text-on-surface'
                          }`}
                        >
                          {w.avatarInitials}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-on-surface">{w.fullName}</h4>
                          <span className="text-[10px] text-outline font-mono">
                            {w.className} · {w.studentCode}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isHighest ? 'bg-error text-on-error' : 'bg-surface-container text-on-surface'
                        }`}
                      >
                        {w.totalMissed} buổi
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant/10">
                      <span>
                        Không phép: <strong className="text-error font-bold">{w.unexcused} buổi</strong>
                      </span>
                      <span>Có phép: {w.excused} buổi</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-secondary font-semibold text-xs sm:text-sm">
          <Info className="w-4 h-4" />
          <span>Cách tính</span>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Mỗi buổi sáng/chiều được điểm danh là một lượt. &quot;Vắng&quot; gồm vắng có phép và vắng không phép; đi muộn không tính là vắng.
        </p>
      </div>
    </div>
  );
};
