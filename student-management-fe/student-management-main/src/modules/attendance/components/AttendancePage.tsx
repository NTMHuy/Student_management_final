'use client';
import React,{useEffect,useState} from 'react';
import Link from 'next/link';
import {useAttendance} from '@/modules/attendance/hooks/useAttendance';
import {AttendanceDailyTable} from '@/modules/attendance/components/AttendanceDailyTable';
import {EarlyWarningWidget} from '@/modules/attendance/components/EarlyWarningWidget';
import {Pagination} from '@/components/ui/Pagination';
import {CheckCircle2,History,Save,CheckCircle,AlertCircle,X,Users,AlertTriangle,Clock,UserCheck} from 'lucide-react';

export default function AttendancePage(){
 const {sections,sessions,optionsLoading,optionsError,dailyItems,earlyWarnings,isLoading,isSaving,isDirty,error,filters,setFilters,setStudentStatus,setStudentNote,markAllPresent,saveDaily,total,presentCount,excusedCount,unexcusedCount,lateCount,pendingCount,attendanceRate}=useAttendance();
 const [toast,setToast]=useState<{kind:'success'|'error';message:string}|null>(null);
 const [currentPage,setCurrentPage]=useState(1);
 useEffect(()=>{if(!isDirty)return;const h=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener('beforeunload',h);return()=>window.removeEventListener('beforeunload',h)},[isDirty]);
 const change=(patch:Partial<typeof filters>)=>{if(isDirty&&!window.confirm('Bạn có thay đổi điểm danh chưa lưu. Thay đổi lựa chọn sẽ làm mất thay đổi này. Tiếp tục?'))return;setFilters(p=>({...p,...patch}))};
 const section=sections.find(s=>String(s.id)===filters.courseSectionId);
 const session=sessions.find(s=>s.id===filters.courseSessionId);
 const save=async()=>{try{await saveDaily();setToast({kind:'success',message:'Đã lưu điểm danh cho buổi học phần.'})}catch(e){setToast({kind:'error',message:e instanceof Error?e.message:'Không thể lưu điểm danh.'})}window.setTimeout(()=>setToast(null),4000)};
 const size=15,pages=Math.max(1,Math.ceil(dailyItems.length/size)),items=dailyItems.slice((currentPage-1)*size,currentPage*size);
 useEffect(()=>setCurrentPage(1),[filters.courseSectionId,filters.courseSessionId]);
 useEffect(()=>{if(currentPage>pages)setCurrentPage(pages)},[currentPage,pages]);
 return <div className="flex flex-col gap-6 relative">
 {toast&&<div role="status" className="fixed top-20 right-6 z-50 flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl shadow-xl">{toast.kind==='success'?<CheckCircle className="text-secondary"/>:<AlertCircle className="text-error"/>}<span className="text-sm">{toast.message}</span><button onClick={()=>setToast(null)} aria-label="Đóng"><X className="w-4 h-4"/></button></div>}
 <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4"><div><h1 className="text-2xl sm:text-3xl font-bold text-primary">Điểm danh sinh viên</h1><p className="text-sm text-on-surface-variant mt-1">Chọn lớp học phần và buổi học để ghi nhận tình trạng tham dự.</p>{section&&<p className="text-xs text-secondary font-semibold mt-1">{section.sectionCode} · {section.subjectName} · {section.semesterName}</p>}{session&&<p className="text-xs text-on-surface-variant">{session.sessionDate} · {session.startTime}–{session.endTime} · {session.room||'Chưa có phòng'}</p>}</div>
 <div className="flex flex-wrap gap-2"><Link href="/attendance/history" className="flex items-center gap-2 px-4 py-2.5 bg-surface-container rounded-xl text-sm"><History className="w-4 h-4"/>Lịch sử</Link><button disabled={!total} onClick={markAllPresent} className="flex items-center gap-2 px-4 py-2.5 bg-secondary-fixed/40 text-secondary rounded-xl text-sm disabled:opacity-50"><UserCheck className="w-4 h-4"/>Tất cả có mặt</button><button onClick={save} disabled={isSaving||isLoading||!total||(!isDirty&&pendingCount===0)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm disabled:opacity-50"><Save className="w-4 h-4"/>{isSaving?'Đang lưu...':'Lưu điểm danh'}</button></div></div>
 {optionsError&&<p role="alert" className="text-sm text-error">{optionsError}</p>}
 {optionsLoading?<p className="text-sm">Đang tải lớp học phần...</p>:sections.length===0?<p className="rounded-xl bg-surface-container-low p-4 text-sm">Chưa có lớp học phần được phân công hoặc chưa có lớp học phần.</p>:
 <div className="p-4 bg-surface-container-lowest rounded-2xl flex flex-wrap gap-4 items-end">
 <div className="flex flex-col gap-1 min-w-[240px]"><label htmlFor="att-section" className="text-xs font-semibold">Lớp học phần</label><select id="att-section" value={filters.courseSectionId} onChange={e=>change({courseSectionId:e.target.value,courseSessionId:''})} className="px-3 py-2 rounded-xl bg-surface-container-low text-sm">{sections.map(s=><option key={s.id} value={s.id}>{s.sectionCode} · {s.subjectName} ({s.semesterName})</option>)}</select></div>
 <div className="flex flex-col gap-1 min-w-[260px]"><label htmlFor="att-session" className="text-xs font-semibold">Buổi học</label><select id="att-session" value={filters.courseSessionId} onChange={e=>change({courseSessionId:e.target.value})} className="px-3 py-2 rounded-xl bg-surface-container-low text-sm">{sessions.length===0&&<option value="">Chưa có lịch học</option>}{sessions.map(s=><option key={s.id} value={s.id}>{s.sessionDate} · {s.startTime}–{s.endTime} {s.room?'· '+s.room:''}</option>)}</select></div>{isDirty&&<span className="text-xs text-amber-700">Có thay đổi chưa lưu</span>}</div>}
 {error&&<p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <Stat label="Sinh viên" value={total} hint={pendingCount?pendingCount+' chưa điểm danh':''} icon={<Users className="w-5 h-5"/>}/>
 <Stat label="Có mặt" value={presentCount} hint={attendanceRate+'% đã ghi nhận'} icon={<CheckCircle2 className="w-5 h-5"/>}/>
 <Stat label="Đi muộn" value={lateCount} icon={<Clock className="w-5 h-5"/>}/>
 <Stat label="Vắng mặt" value={excusedCount+unexcusedCount} hint={unexcusedCount+' không phép'} icon={<AlertTriangle className="w-5 h-5"/>}/>
 </div>
 <div className="flex flex-col"><AttendanceDailyTable items={items} isLoading={isLoading} startIndex={(currentPage-1)*size} onStatusChange={setStudentStatus} onNoteChange={setStudentNote}/><Pagination currentPage={currentPage} totalPages={pages} totalItems={dailyItems.length} pageSize={size} onPageChange={setCurrentPage} itemLabel="sinh viên"/></div>
 <EarlyWarningWidget warnings={earlyWarnings}/>
 </div>;
}
function Stat({label,value,hint,icon}:{label:string;value:number;hint?:string;icon:React.ReactNode}){return <div className="p-4 bg-surface-container-lowest rounded-2xl border flex items-center justify-between"><div><span className="text-[11px] font-semibold text-outline uppercase">{label}</span><p className="text-2xl font-bold mt-1">{value}</p>{hint&&<span className="text-xs text-on-surface-variant">{hint}</span>}</div><div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">{icon}</div></div>}
