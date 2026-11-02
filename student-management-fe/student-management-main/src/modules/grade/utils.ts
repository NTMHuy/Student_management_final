export function initialsOf(fullName:string):string {
 const parts=fullName.trim().split(/\s+/).filter(Boolean);
 if(!parts.length)return "?";
 return parts.length===1?parts[0][0].toUpperCase():(parts[parts.length-2][0]+parts[parts.length-1][0]).toUpperCase();
}
