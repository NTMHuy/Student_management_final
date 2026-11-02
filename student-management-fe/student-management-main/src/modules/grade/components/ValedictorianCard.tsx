import React from "react";
import {StudentGradeRecord} from "../types";
export const ValedictorianCard:React.FC<{records:StudentGradeRecord[];className:string}>=({records,className})=>{
 const top=records.filter(r=>r.totalScore!==null).sort((a,b)=>(b.totalScore??0)-(a.totalScore??0))[0];
 return <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20"><h3 className="font-semibold text-sm">Điểm tổng kết cao nhất</h3>{top?<div className="mt-3"><p className="font-semibold">{top.fullName}</p><p className="text-xs text-on-surface-variant">{top.studentCode} · {className}</p><p className="text-2xl font-bold text-primary mt-2">{top.totalScore?.toFixed(2)}</p></div>:<p className="text-sm text-on-surface-variant mt-3">Chưa có kết quả tổng kết.</p>}</div>;
};
