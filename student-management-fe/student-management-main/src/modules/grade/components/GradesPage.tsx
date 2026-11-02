'use client';
import React,{useEffect,useState} from "react";
import {useGrades} from "@/modules/grade/hooks/useGrades";
import {GradeFilters} from "@/modules/grade/components/GradeFilters";
import {GradeTable} from "@/modules/grade/components/GradeTable";
import {Save,RotateCcw,Download} from "lucide-react";
import {Pagination} from "@/components/ui/Pagination";
export default function GradesPage(){
 const g=useGrades();const [page,setPage]=useState(1);
 const size=15,pages=Math.max(1,Math.ceil(g.records.length/size)),items=g.records.slice((page-1)*size,page*size);
 useEffect(()=>setPage(1),[g.filters.courseSectionId]);
 useEffect(()=>{if(page>pages)setPage(pages)},[page,pages]);
 const selected=g.sectionOptions.find(s=>String(s.id)===g.filters.courseSectionId);
 const save=async()=>{try{await g.saveGrades();alert("Đã lưu bảng điểm.")}catch(e){alert(e instanceof Error?e.message:"Không thể lưu bảng điểm.")}};
 const exportCsv=()=>{const rows=[["Mã sinh viên","Họ tên","Điểm quá trình","Giữa kỳ","Cuối kỳ","Tổng kết"],...g.records.map(r=>[r.studentCode,r.fullName,r.processAverage??"",r.midtermScore??"",r.finalScore??"",r.totalScore??""])];const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="bang-diem-"+(selected?.sectionCode??"lop-hoc-phan")+".csv";a.click();URL.revokeObjectURL(url)};
 return <div className="flex flex-col gap-5">
 <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl sm:text-3xl font-bold text-primary">Quản lý điểm</h1><p className="text-sm text-on-surface-variant mt-1">Nhập điểm quá trình, giữa kỳ và cuối kỳ theo lớp học phần.</p>{selected&&<p className="text-xs text-secondary mt-1">{selected.sectionCode} · {selected.subjectName} · {selected.semesterName}</p>}</div>
 <div className="flex gap-2"><button onClick={exportCsv} disabled={!g.records.length} className="px-3 py-2 rounded-xl bg-surface-container text-sm flex gap-2 items-center disabled:opacity-40"><Download className="w-4 h-4"/>Xuất CSV</button><button onClick={()=>g.refresh()} disabled={g.isLoading} className="px-3 py-2 rounded-xl bg-surface-container text-sm flex gap-2 items-center"><RotateCcw className="w-4 h-4"/>Tải lại</button><button onClick={save} disabled={!g.isDirty||g.isSaving||g.isLoading} className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm flex gap-2 items-center disabled:opacity-40"><Save className="w-4 h-4"/>{g.isSaving?"Đang lưu":"Lưu điểm"}</button></div></div>
 {g.optionsError&&<p role="alert" className="text-sm text-error">{g.optionsError}</p>}{g.error&&<p role="alert" className="text-sm text-error">{g.error}</p>}
 {g.optionsLoading?<p>Đang tải lớp học phần...</p>:g.sectionOptions.length===0?<p className="p-4 rounded-xl bg-surface-container-low text-sm">Chưa có lớp học phần hoặc bạn chưa được phân công giảng dạy.</p>:<GradeFilters filters={g.filters} sections={g.sectionOptions} onChange={p=>{if(g.isDirty&&!window.confirm("Có điểm chưa lưu. Tiếp tục thay đổi?"))return;g.setFilters(x=>({...x,...p}))}}/>}
 {g.isDirty&&<p className="text-xs text-amber-700">Có thay đổi chưa lưu.</p>}
 <GradeTable records={items} onScoreChange={g.updateScore} onAddProcess={g.addProcessAttempt} isLoading={g.isLoading}/>
 <Pagination currentPage={page} totalPages={pages} totalItems={g.records.length} pageSize={size} onPageChange={setPage} itemLabel="sinh viên"/>
 <div className="grid grid-cols-3 gap-3"><Stat label="Sĩ số" value={g.totalStudents}/><Stat label="Đã đủ điểm" value={g.completedCount+"/"+g.totalStudents}/><Stat label="Điểm trung bình" value={g.classAverage}/></div>
 </div>;
}
function Stat({label,value}:{label:string;value:string|number}){return <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20"><p className="text-xs text-on-surface-variant">{label}</p><p className="text-xl font-bold mt-1">{value}</p></div>}
