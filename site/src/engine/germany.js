// Germany 2026 self-reported screening. See docs/germany-rules.md.
export const DE_THRESHOLDS = Object.freeze({"standard":50700,"reduced":45934.2,"monthlyFunds":1091});
function validGermanyDate(value) {
  return typeof value==="string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+"T00:00:00Z")) && new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
}
export function assessGermany(input,today) {
  const stale=!validGermanyDate(today)||today<"2026-11-26"||today>"2026-12-26";
  const routes=[["opportunity","Opportunity Card — job search"],["blue","EU Blue Card — qualified employment"],["settlement","Settlement permit — permanent residence"]];
  if(stale)return routes.map(([id,label])=>({id,label,status:"review_required",missing:["Current rule review required"],failed:[],details:{}}));
  function evaluate(id,label,run){
    const missing=[],failed=[],details={};
    const choice=(key,choices,description)=>{
      if(!choices.includes(input[key])){missing.push(description);return null;}
      return input[key];
    };
    const requireYes=(key,description)=>{
      const answer=choice(key,["yes","no"],description);
      if(answer==="no")failed.push(description);
      return answer;
    };
    const int=(key,max,description,min=0)=>{
      const raw=input[key];
      if(typeof raw!=="string"||!/^\d{1,3}$/.test(raw)||Number(raw)<min||Number(raw)>max){missing.push(description);return null;}
      return Number(raw);
    };
    const cents=(key,description)=>{
      const raw=input[key];
      if(typeof raw!=="string"||!/^\d{1,9}(?:\.\d{1,2})?$/.test(raw)){missing.push(description);return null;}
      return Math.round(Number(raw)*100);
    };
    const german=(key,description)=>choice(key,["none","A1","A2","B1","B2+"],description);
    const general=()=>requireYes(id+"General","Other applicable residence/visa conditions and evidence reviewed");
    run({missing,failed,details,choice,requireYes,int,cents,german,general});
    return {id,label,status:failed.length?"requirements_not_met":missing.length?"review_required":"meets_self_reported_screen",missing:[...new Set(missing)],failed:[...new Set(failed)],details};
  }
  const opportunity=evaluate(...routes[0],({missing,failed,details,choice,requireYes,int,cents,german,general})=>{
    const qualification=choice("opQualification",["recognised","partial","foreign","none"],"Qualification recognition status");
    if(qualification==="none")failed.push("A qualifying formal credential or recognition notice is required");
    const duration=int("opMonths",12,"Planned job-search months",1);
    const method=choice("opFunding",["blocked","commitment","mixed","none"],"Funding evidence type");
    if(duration!==null)details.blockedAccountRequiredEUR=duration*DE_THRESHOLDS.monthlyFunds;
    if(method==="blocked"){
      const amount=cents("opBlocked","Confirmed available blocked-account funds in EUR");
      if(amount!==null&&duration!==null&&amount<duration*DE_THRESHOLDS.monthlyFunds*100)failed.push("Blocked-account amount below planned stay requirement");
      requireYes("opFundingConfirmed","Blocked-account evidence meets official requirements");
    } else if(method==="commitment"||method==="mixed")requireYes("opFundingConfirmed","Officially acceptable funding covers whole planned stay (commitment or accepted mixed funding)");
    else if(method==="none")failed.push("Sufficient livelihood funding required");
    if(qualification==="recognised"){
      details.path="Recognised qualification — points not required";
    }else if(qualification==="partial"||qualification==="foreign"){
      details.path="Points route";
      if(qualification==="foreign")requireYes("opForeignProof","State-recognised foreign credential with required documentation; vocational training at least two years");
      const before=missing.length,points={};
      points.recognition=qualification==="partial"?4:0;
      const de=german("opGerman","Verified German level"),en=choice("opEnglish",["belowB2","B2","C1+"],"Verified English level");
      if(de==="none"&&en==="belowB2")failed.push("At least German A1 or English B2 required");
      if(de!==null)points.german=({none:0,A1:0,A2:1,B1:2,"B2+":3})[de];
      if(en!==null)points.english=en==="C1+"?1:0;
      const age=int("opAge",120,"Age at application",18);
      if(age!==null)points.age=age<35?2:age<40?1:0;
      const exp=choice("opExperience",["none","two","five"],"Qualifying post-qualification related experience");
      if(exp!==null)points.experience=({none:0,two:2,five:3})[exp];
      for(const [key,label,name] of [["opShortage","Formal qualification in shortage occupation","shortage"],["opStay","Qualifying prior German residence","priorStay"],["opPartner","Qualifying jointly applying spouse/registered partner","partner"]]){
        const answer=choice(key,["yes","no"],label);if(answer!==null)points[name]=answer==="yes"?1:0;
      }
      if(missing.length===before){
        const score=Object.values(points).reduce((a,v)=>a+v,0);
        details.points=score;details.minimumPoints=6;details.pointBreakdown=points;
        if(score<6)failed.push("Fewer than six Opportunity Card points");
      }
    }
    general();
  });
  const blue=evaluate(...routes[1],({missing,failed,details,choice,requireYes,int,cents,general})=>{
    const path=choice("blueQualification",["degree","itExperience","none"],"Blue Card qualification route");
    if(path==="none")failed.push("Eligible academic/tertiary qualification or qualifying IT experience required");
    requireYes("blueOffer","Specific qualifying job offer in Germany");
    const term=int("blueMonths",999,"Contract duration in months (999 for indefinite)");
    if(term!==null&&term<6)failed.push("Job offer must cover at least six months");
    requireYes("blueMatch","Job matches qualifying education or IT experience; any required professional licence in place or in prospect");
    const salary=cents("blueSalary","Confirmed annual gross qualifying salary in EUR");
    requireYes("bluePayConfirmed","Salary basis independently confirmed (not estimated total compensation)");
    if(path==="degree"){
      requireYes("blueDegreeProof","German/comparable academic degree or qualifying equivalent three-year tertiary level-6 credential");
      if(salary!==null){
        if(salary>=DE_THRESHOLDS.standard*100)details.minimumSalaryEUR=DE_THRESHOLDS.standard;
        else{
          details.minimumSalaryEUR=DE_THRESHOLDS.reduced;
          if(salary<DE_THRESHOLDS.reduced*100)failed.push("Salary below even reduced threshold");
          else{
            requireYes("blueReduced","Applicable shortage occupation or qualifying recent-graduate lower threshold independently confirmed");
            requireYes("blueBA","Federal Employment Agency consent obtained/confirmed as required");
          }
        }
      }
    }else if(path==="itExperience"){
      details.minimumSalaryEUR=DE_THRESHOLDS.reduced;
      const months=int("blueITMonths",84,"Qualifying IT experience months within past seven years");
      if(months!==null&&months<36)failed.push("At least three qualifying years of IT experience within past seven years required");
      requireYes("blueITLevel","Relevant academic-level IT experience and qualifying ISCO 133 or 25 job/experience");
      requireYes("blueBA","Federal Employment Agency consent obtained/confirmed as required");
      if(salary!==null&&salary<DE_THRESHOLDS.reduced*100)failed.push("Salary below IT experience route threshold");
    }
    if(salary!==null)details.annualGrossSalaryEUR=salary/100;
    general();
  });
  const settlement=evaluate(...routes[2],({missing,failed,details,choice,requireYes,int,german,general})=>{
    const path=choice("settlementRoute",["blue","skilled","germanGraduate","none"],"Current qualifying residence title and settlement pathway");
    if(path==="none")failed.push("These settlement routes require qualifying residence and employment in Germany");
    const level=german("settlementGerman","Verified German level");
    let months=null;
    if(path==="blue"&&level!==null){
      months=level==="B1"||level==="B2+"?21:27;
      if(level==="none")failed.push("At least A1 German required for Blue Card settlement");
    }else if(path==="skilled"||path==="germanGraduate"){
      months=path==="skilled"?36:24;
      if(level!==null&&level!=="B1"&&level!=="B2+")failed.push("At least B1 German required for this settlement route");
    }
    if(months!==null){
      details.requiredMonths=months;
      const residence=int("settlementMonths",999,"Qualifying residence/employment months under selected route");
      const pension=int("settlementPension",999,"Qualifying pension contribution months");
      if(residence!==null){details.qualifyingMonths= residence;if(residence<months)failed.push("Qualifying residence/employment period too short");}
      if(pension!==null&&pension<months)failed.push("Qualifying pension contribution period too short");
    }
    if(path==="germanGraduate")requireYes("settlementGraduate","Completed qualifying German higher education or vocational training");
    requireYes("settlementJob","Current qualifying employment authorised by residence title");
    requireYes("settlementLiving","Livelihood secured");
    requireYes("settlementHousing","Sufficient housing");
    requireYes("settlementCivic","Basic German legal and social knowledge");
    general();
  });
  return [opportunity,blue,settlement];
}
