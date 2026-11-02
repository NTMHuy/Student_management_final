'use client';
import React,{useEffect,useMemo,useState} from 'react';
import {apiRequest} from '@/lib/api/client';
import {Search,RotateCcw,GraduationCap} from 'lucide-react';
interface StudentClass {id:string;classCode:string;className:string;intakeYear:number;status:string;majorCode:string;majorName:string;departmentName:string}
export default function ClassesPage(){
 const [items,setItems]=useState<StudentClass[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[search,setSearch]=useState('');
 const load=async()=>{setLoading(true);setError('');try{setItems(await apiRequest<StudentClass[]>('/api/student-classes'))}catch(e){setError(e instanceof Error?e.message:'Không thể tải lớp sinh viên.')}finally{setLoading(false)}};
 useEffect(()=>{void load()},[]);
 const filtered=useMemo(()=>items.filter(x=>[x.classCode,x.className,x.majorName,x.departmentName].join(' ').toLowerCase().includes(search.toLowerCase())),[items,search]);
 return <div className="flex flex-col gap-5"><div className="flex flex-wrap justify-between items-end gap-3"><div><h1 className="text-2xl sm:text-3xl font-bold text-primary">Quản lý lớp sinh viên</h1><p className="text-sm text-on-surface-variant mt-1">Danh sách lớp theo ngành và năm tuyển sinh.</p></div><button onClick={()=>void load()} className="px-4 py-2.5 rounded-xl bg-surface-container text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4"/>Làm mới</button></div>
 <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20"><div className="relative max-w-lg"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm mã lớp, tên lớp hoặc ngành..." className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-container-low text-sm"/></div><p className="text-xs text-on-surface-variant mt-2">{filtered.length} lớp sinh viên</p></div>
 {error&&<p role="alert" className="text-sm text-error">{error}</p>}
 <div className="overflow-x-auto rounded-2xl bg-surface-container-lowest border border-outline-variant/20"><table className="w-full text-sm"><thead className="bg-surface-container-low"><tr>{['Mã lớp','Tên lớp','Ngành','Khoa','Năm tuyển sinh','Trạng thái'].map(x=><th key={x} className="p-3 text-left whitespace-nowrap">{x}</th>)}</tr></thead><tbody>{loading?<tr><td colSpan={6} className="p-8 text-center">Đang tải...</td></tr>:!filtered.length?<tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">Chưa có lớp sinh viên phù hợp.</td></tr>:filtered.map(x=><tr key={x.id} className="border-t border-outline-variant/10"><td className="p-3 font-mono font-semibold">{x.classCode}</td><td className="p-3">{x.className}</td><td className="p-3">{x.majorCode} · {x.majorName}</td><td className="p-3">{x.departmentName}</td><td className="p-3">{x.intakeYear}</td><td className="p-3"><span className="px-2 py-1 rounded-lg bg-surface-container text-xs">{x.status==='active'?'Đang hoạt động':'Đã lưu trữ'}</span></td></tr>)}</tbody></table></div>
 </div>;
}
