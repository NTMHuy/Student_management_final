import React from 'react';
import {AttendanceEarlyWarning} from '../types';
import {Info} from 'lucide-react';
export const EarlyWarningWidget:React.FC<{warnings:AttendanceEarlyWarning[]}>=({warnings})=><div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 flex flex-col gap-4">
 <div className="flex items-center justify-between"><span className="font-bold text-sm">Cảnh báo vắng nhiều</span><span className="px-2 py-0.5 rounded text-[11px] font-bold bg-error-container text-error">Từ 3 buổi / 30 ngày</span></div>
 {!warnings.length?<p className="text-xs text-on-surface-variant">Chưa có sinh viên nào vắng từ 3 buổi trở lên trong 30 ngày gần nhất.</p>:<div className="flex flex-col gap-3"><p className="text-xs text-on-surface-variant">Danh sách sinh viên có số buổi vắng cao trong thời gian gần đây.</p>{warnings.map(w=><div key={w.id} className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between gap-3"><div><div className="font-semibold text-sm">{w.fullName}</div><div className="text-xs text-outline">{w.studentClassName} · {w.studentCode}</div><div className="text-xs text-on-surface-variant mt-1">Có phép: {w.excused} · Không phép: {w.unexcused}</div></div><span className="text-sm font-bold text-error whitespace-nowrap">{w.totalMissed} buổi</span></div>)}</div>}
 <div className="flex gap-2 items-start border-t border-outline-variant/20 pt-3 text-xs text-on-surface-variant"><Info className="w-4 h-4 shrink-0"/><span>Chỉ tính vắng có phép và không phép; đi muộn không tính là vắng.</span></div>
</div>;
