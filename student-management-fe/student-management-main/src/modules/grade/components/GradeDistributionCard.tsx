import React from "react";
import {StudentGradeRecord} from "../types";
export const GradeDistributionCard:React.FC<{records:StudentGradeRecord[]}>=({records})=>{
 const scored=records.filter(r=>r.totalScore!==null);
 const groups=[scored.filter(r=>(r.totalScore??0)<5).length,scored.filter(r=>(r.totalScore??0)>=5&&(r.totalScore??0)<6.5).length,scored.filter(r=>(r.totalScore??0)>=6.5&&(r.totalScore??0)<8).length,scored.filter(r=>(r.totalScore??0)>=8).length];
 return <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20"><h3 className="font-semibold text-sm">Phổ điểm lớp học phần</h3><div className="grid grid-cols-4 gap-3 mt-4 text-center">{["Dưới 5","5–6.49","6.5–7.99","8–10"].map((label,i)=><div key={label} className="p-3 rounded-xl bg-surface-container-low"><p className="text-xl font-bold">{groups[i]}</p><p className="text-xs text-on-surface-variant">{label}</p></div>)}</div><p className="text-xs text-on-surface-variant mt-3">{scored.length}/{records.length} sinh viên đã đủ điểm tổng kết.</p></div>;
};
