'use client';
import React,{useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {Breadcrumb} from '@/components/layout/Breadcrumb';
import {apiRequest} from '@/lib/api/client';
import {API_ENDPOINTS} from '@/lib/api/endpoints';
import {Users,GraduationCap,Building2,BookOpen,RotateCcw,ArrowRight,AlertCircle} from 'lucide-react';
interface Summary{
 totalStudents:number;totalTeachers:number|null;totalDepartments:number|null;totalStudentClasses:number;
 studentsByStatus:{active:number;suspended:number;transferred:number};
 studentClasses:Array<{id:string;classCode:string;className:string;majorName:string;departmentName:string;intakeYear:number;studentCount:number}>;
 recentStudents:Array<{id:string;studentCode:string;fullName:string;className:string;createdAt:string}>;
}
export default function DashboardPage(){
 const [data,setData]=useState<Summary|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{setData(await apiRequest<Summary>(API_ENDPOINTS.dashboard))}catch(e){setError(e instanceof Error?e.message:'Không thể tải dữ liệu tổng quan.')}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 const cards=[{label:'Sinh viên',value:data?.totalStudents,icon:GraduationCap},{label:'Giảng viên',value:data?.totalTeachers,icon:Users},{label:'Lớp sinh viên',value:data?.totalStudentClasses,icon:Building2},{label:'Khoa',value:data?.totalDepartments,icon:BookOpen}];
 const date=(s:string)=>s?new Intl.DateTimeFormat('vi-VN',{dateStyle:'medium'}).format(new Date(s)):'—';
 return <div className="flex flex-col gap-6">
 <div className="flex flex-wrap items-end justify-between gap-3"><div><Breadcrumb items={[{label:'Bảng điều khiển',href:'/dashboard'},{label:'Tổng quan',isCurrent:true}]}/><h1 className="text-2xl sm:text-3xl font-bold text-primary mt-2">Tổng quan quản lý sinh viên</h1><p className="text-sm text-on-surface-variant mt-1">Thống kê sinh viên, giảng viên và lớp sinh viên.</p></div><button onClick={()=>void load()} disabled={loading} className="px-4 py-2.5 rounded-xl bg-surface-container text-sm flex items-center gap-2 disabled:opacity-50"><RotateCcw className="w-4 h-4"/>{loading?'Đang tải...':'Làm mới'}</button></div>
 {error&&<p role="alert" className="p-3 rounded-xl bg-error-container text-error text-sm flex gap-2"><AlertCircle className="w-4 h-4"/>{error}</p>}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(({label,value,icon:Icon})=><div key={label} className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20"><div className="flex justify-between items-center"><span className="text-xs font-semibold text-on-surface-variant uppercase">{label}</span><Icon className="w-5 h-5 text-primary"/></div><p className="text-3xl font-bold mt-3">{value==null?'—':value.toLocaleString('vi-VN')}</p></div>)}</div>
 {data&&<><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><section className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20"><h2 className="font-bold mb-4">Tình trạng sinh viên</h2>{[{label:'Đang học',value:data.studentsByStatus.active},{label:'Tạm dừng',value:data.studentsByStatus.suspended},{label:'Đã chuyển trường',value:data.studentsByStatus.transferred}].map(x=><div key={x.label} className="flex justify-between py-2 border-b border-outline-variant/10 text-sm"><span>{x.label}</span><strong>{x.value}</strong></div>)}</section>
 <section className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20"><div className="flex justify-between items-center mb-3"><h2 className="font-bold">Lớp sinh viên</h2><Link href="/classes" className="text-xs text-primary flex items-center gap-1">Quản lý <ArrowRight className="w-3 h-3"/></Link></div>{data.studentClasses.length===0?<p className="text-sm text-on-surface-variant">Chưa có dữ liệu lớp sinh viên.</p>:data.studentClasses.map(c=><div key={c.id} className="flex justify-between gap-3 py-2 border-b border-outline-variant/10"><div><p className="text-sm font-semibold">{c.classCode} · {c.className}</p><p className="text-xs text-on-surface-variant">{c.majorName} · {c.intakeYear}</p></div><span className="text-sm font-semibold whitespace-nowrap">{c.studentCount} SV</span></div>)}</section></div>
 <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 overflow-hidden"><div className="p-5 flex justify-between items-center"><h2 className="font-bold">Sinh viên mới cập nhật</h2><Link href="/students" className="text-xs text-primary flex items-center gap-1">Danh sách sinh viên <ArrowRight className="w-3 h-3"/></Link></div>{!data.recentStudents.length?<p className="p-5 text-sm text-on-surface-variant">Chưa có dữ liệu sinh viên.</p>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-surface-container-low"><tr><th className="p-3 text-left">Mã sinh viên</th><th className="p-3 text-left">Họ và tên</th><th className="p-3 text-left">Lớp sinh viên</th><th className="p-3 text-left">Ngày tạo</th></tr></thead><tbody>{data.recentStudents.map(s=><tr key={s.id} className="border-t border-outline-variant/10"><td className="p-3 font-mono">{s.studentCode}</td><td className="p-3 font-medium">{s.fullName}</td><td className="p-3">{s.className||'—'}</td><td className="p-3">{date(s.createdAt)}</td></tr>)}</tbody></table></div>}</section></>}
 {!data&&!error&&<p className="p-8 text-center text-sm text-on-surface-variant">Đang tải dữ liệu...</p>}
 </div>;
}
