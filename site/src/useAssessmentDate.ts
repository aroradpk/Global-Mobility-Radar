import { useEffect, useState } from "react";
const utcDate = () => new Date().toISOString().slice(0,10);
// Re-evaluate displayed scenarios after the calendar date changes, including
// when a suspended/background browser tab becomes visible again.
export function useAssessmentDate():string {
  const [today,setToday] = useState(utcDate);
  useEffect(()=>{
    const refresh=()=>setToday(utcDate());
    const timer=window.setInterval(refresh,60_000);
    document.addEventListener("visibilitychange",refresh);
    window.addEventListener("focus",refresh);
    refresh();
    return ()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);window.removeEventListener("focus",refresh);};
  },[]);
  return today;
}
