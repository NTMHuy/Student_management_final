import React from "react";
import { GradeComponent,StudentGradeRecord } from "../types";
interface Props { records:StudentGradeRecord[]; onScoreChange:(id:number,type:GradeComponent,attempt:number,value:string)=>void; onAddProcess:(id:number)=>void; isLoading?:boolean }
const input="w-20 h-9 px-2 text-center rounded-lg bg-surface-container-low text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary";
export const GradeTable:React.FC<Props>=({records,onScoreChange,onAddProcess,isLoading})=>{
 if(isLoading)return <div className="p-8 text-center">Đang tải bảng điểm...</div>;
 return <div className="overflow-x-auto rounded-2xl bg-surface-container-lowest border border-outline-variant/20"><table className="w-full text-sm">
 <thead className="bg-surface-container-low"><tr>{["Mã sinh viên","Họ và tên","Điểm quá trình","Giữa kỳ","Cuối kỳ","Điểm tổng kết"].map(x=><th key={x} className="p-3 text-left whitespace-nowrap">{x}</th>)}</tr></thead>
 <tbody className="divide-y divide-outline-variant/20">{!records.length&&<tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">Lớp học phần chưa có sinh viên đăng ký.</td></tr>}
 {records.map(r=><tr key={r.enrollmentId}><td className="p-3 font-mono text-xs">{r.studentCode}</td><td className="p-3 font-medium whitespace-nowrap">{r.fullName}</td>
 <td className="p-3 min-w-[280px]"><div className="flex flex-wrap gap-2 items-center">{r.scores.filter(s=>s.componentType==="PROCESS").sort((a,b)=>a.attemptNumber-b.attemptNumber).map(s=><label key={s.attemptNumber} className="flex flex-col gap-1 text-[10px] text-on-surface-variant">Lần {s.attemptNumber}<input className={input} type="number" min="0" max="10" step="0.01" value={s.score??""} onChange={e=>onScoreChange(r.enrollmentId,"PROCESS",s.attemptNumber,e.target.value)}/></label>)}<button type="button" onClick={()=>onAddProcess(r.enrollmentId)} className="px-2 py-2 rounded-lg bg-surface-container text-xs">+ Lần</button></div><p className="text-xs text-on-surface-variant mt-1">TB quá trình: {r.processAverage??"—"}</p></td>
 {(["MIDTERM","FINAL"] as const).map(type=><td key={type} className="p-3"><input aria-label={type==="MIDTERM"?"Điểm giữa kỳ":"Điểm cuối kỳ"} className={input} type="number" min="0" max="10" step="0.01" value={r.scores.find(s=>s.componentType===type)?.score??""} onChange={e=>onScoreChange(r.enrollmentId,type,1,e.target.value)}/></td>)}
 <td className="p-3 font-bold text-primary">{r.totalScore??"Chưa đủ điểm"}</td></tr>)}</tbody></table></div>;
};
