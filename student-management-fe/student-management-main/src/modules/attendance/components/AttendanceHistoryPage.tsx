'use client';
import React,{useEffect,useState} from 'react';
import Link from 'next/link';
import {ChevronLeft,Download} from 'lucide-react';
import {Pagination} from '@/components/ui/Pagination';
import {AttendanceHistoryFilters} from '@/modules/attendance/components/AttendanceHistoryFilters';
import {AttendanceHistoryTable} from '@/modules/attendance/components/AttendanceHistoryTable';
import {useAttendanceHistory} from '@/modules/attendance/hooks/useAttendance';
const STATUS_TEXT={present:'Có mặt',excused:'Vắng có phép',unexcused:'Vắng không phép',late:'Đi muộn'} as const;
export default function AttendanceHistoryPage(){
 const {sectionOptions,optionsError,items,isLoading,error,filters,setFilters,reset}=useAttendanceHistory();
 const [currentPage,setCurrentPage]=useState(1);
 const pageSize=15,totalPages=Math.max(1,Math.ceil(items.length/pageSize));
 const pageItems=items.slice((currentPage-1)*pageSize,currentPage*pageSize);
 useEffect(()=>setCurrentPage(1),[filters.courseSectionId,filters.from,filters.to,filters.status,filters.search]);
 const exportCsv=()=>{const header=['Ngày','Thời gian','Lớp học phần','Môn học','Mã sinh viên','Họ và tên','Trạng thái','Người ghi nhận','Ghi chú'];const rows=items.map(i=>[i.dateStr,i.timeStr,i.sectionCode,i.subjectName,i.studentCode,i.fullName,STATUS_TEXT[i.status],i.teacherName,i.note]);const csv=[header,...rows].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='attendance-history-'+filters.from+'-'+filters.to+'.csv';a.click();URL.revokeObjectURL(url)};
 return <div className="flex flex-col gap-6"><div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4"><div><Link href="/attendance" className="flex items-center gap-1 text-secondary text-xs font-semibold"><ChevronLeft className="w-3.5 h-3.5"/>Quay lại điểm danh</Link><h1 className="text-2xl sm:text-3xl font-bold text-primary mt-2">Lịch sử điểm danh</h1><p className="text-sm text-on-surface-variant mt-1">Tra cứu theo lớp học phần, thời gian và trạng thái.</p></div><button type="button" onClick={exportCsv} disabled={!items.length} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container rounded-xl text-sm font-semibold disabled:opacity-50"><Download className="w-4 h-4"/>Xuất CSV</button></div>
 <AttendanceHistoryFilters filters={filters} sections={sectionOptions} onChange={patch=>setFilters(prev=>({...prev,...patch}))} onReset={reset}/>
 {(error||optionsError)&&<p role="alert" className="text-sm text-error">{error??optionsError}</p>}
 <AttendanceHistoryTable items={pageItems} isLoading={isLoading}/>
 <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={items.length} pageSize={pageSize} onPageChange={setCurrentPage} itemLabel="lượt điểm danh"/>
 {items.length>=500&&<p className="text-xs text-on-surface-variant">Chỉ hiển thị 500 bản ghi mới nhất. Hãy thu hẹp bộ lọc.</p>}</div>;
}
