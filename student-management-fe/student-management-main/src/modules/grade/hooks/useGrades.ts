import { useState,useEffect,useCallback } from "react";
import { GradeComponent,GradeFiltersState,GradeScore,StudentGradeRecord } from "../types";
import { gradeService } from "../services/grade.service";
import { useTeachingOptions } from "@/modules/teaching/hooks/useTeachingOptions";
export const useGrades=()=>{
 const {options,isLoading:optionsLoading,error:optionsError}=useTeachingOptions();
 const sectionOptions=options.courseSections;
 const [records,setRecords]=useState<StudentGradeRecord[]>([]);
 const [filters,setFilters]=useState<GradeFiltersState>({courseSectionId:""});
 const [isLoading,setIsLoading]=useState(false),[isSaving,setIsSaving]=useState(false),[isDirty,setIsDirty]=useState(false),[error,setError]=useState<string|null>(null);
 useEffect(()=>{if(optionsLoading)return;setFilters(p=>sectionOptions.some(s=>String(s.id)===p.courseSectionId)?p:{courseSectionId:sectionOptions[0]?String(sectionOptions[0].id):""})},[optionsLoading,sectionOptions]);
 const fetchRecords=useCallback(async()=>{
  if(!filters.courseSectionId){setRecords([]);return}
  setIsLoading(true);setError(null);
  try{setRecords(await gradeService.getGradeRecords(filters));setIsDirty(false)}
  catch(e){setRecords([]);setError(e instanceof Error?e.message:"Không thể tải bảng điểm.")}
  finally{setIsLoading(false)}
 },[filters.courseSectionId]);
 useEffect(()=>{fetchRecords()},[fetchRecords]);
 const updateScore=(enrollmentId:number,type:GradeComponent,attempt:number,value:string)=>{
  const clean=value.replace(",",".").trim(),score=clean===""?null:Number(clean);
  if(score!==null&&(!Number.isFinite(score)||score<0||score>10))return;
  setIsDirty(true);
  setRecords(prev=>prev.map(r=>{
   if(r.enrollmentId!==enrollmentId)return r;
   const found=r.scores.some(s=>s.componentType===type&&s.attemptNumber===attempt);
   const scores:GradeScore[]=found?r.scores.map(s=>s.componentType===type&&s.attemptNumber===attempt?{...s,score}:s):[...r.scores,{id:null,componentType:type,attemptNumber:attempt,score,note:null}];
   const process=scores.filter(s=>s.componentType==="PROCESS"&&s.score!==null).map(s=>s.score as number);
   return {...r,scores,totalScore:null,processAverage:process.length?Math.round(process.reduce((a,b)=>a+b,0)/process.length*100)/100:null,
    midtermScore:scores.find(s=>s.componentType==="MIDTERM")?.score??null,
    finalScore:scores.find(s=>s.componentType==="FINAL")?.score??null};
  }));
 };
 const addProcessAttempt=(enrollmentId:number)=>{
  setIsDirty(true);setRecords(prev=>prev.map(r=>r.enrollmentId!==enrollmentId?r:{...r,scores:[...r.scores,{id:null,componentType:"PROCESS" as const,attemptNumber:Math.max(0,...r.scores.filter(s=>s.componentType==="PROCESS").map(s=>s.attemptNumber))+1,score:null,note:null}]}));
 };
 const saveGrades=async()=>{setIsSaving(true);try{await gradeService.saveAllGrades(filters,records);setIsDirty(false);await fetchRecords()}finally{setIsSaving(false)}};
 const completedCount=records.filter(r=>r.totalScore!==null).length;
 const valid=records.map(r=>r.totalScore).filter((n):n is number=>n!==null);
 const classAverage=valid.length?(valid.reduce((a,b)=>a+b,0)/valid.length).toFixed(2):"--";
 return {sectionOptions,optionsLoading,optionsError,records,isLoading,isSaving,isDirty,error,filters,setFilters,updateScore,addProcessAttempt,saveGrades,refresh:fetchRecords,totalStudents:records.length,completedCount,classAverage};
};
