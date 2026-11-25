// Versioned arithmetic; user-confirmed inputs only. See docs/canada-rules.md.
export function assessCanada(input,today){
  const mf=[],mc=[],failed=[],common=[];
  const integer=(k,min,max,list)=>{const s=input[k];if(typeof s!=="string"||!/^\d+$/.test(s)||Number(s)<min||Number(s)>max){list.push(k);return 0;}return Number(s);};
  const opt=(k,choices,list)=>{const v=input[k];if(!choices.includes(v)){list.push(k);return choices[0];}return v;};
  const date=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
  if(!date(today)||today<"2026-11-18"||today>"2026-12-25")return {fsw:{status:"unknown",score:null,factors:{},missing:["rule review required"],failed:[]},crs:{score:null,factors:{},missing:["rule review required"]}};
  const fresh=(d,y)=>{if(!date(d)||d>today)return false;const a=String(Number(d.slice(0,4))+y)+d.slice(4);return today<(date(a)?a:a.slice(0,8)+"28");};
  const lang=(k,list)=>{const s=input[k];if(s==="none")return [0,0,0,0];if(typeof s!=="string"||!/^(?:[0-9]|1[0-2])(?:,(?:[0-9]|1[0-2])){3}$/.test(s)||!fresh(input[k+"Date"],2)){list.push(k+" (four confirmed benchmarks and valid test date)");return [0,0,0,0];}return s.split(",").map(Number);};
  const age=integer("age",0,120,common),edu=integer("education",0,7,common);
  if(edu>0&&input.credential!=="canadian"&&!fresh(input.credential,5))common.push("education credential / ECA date");
  const kind=opt("firstKind",["english","french"],common),first=lang("first",common),second=lang("second",common);
  mf.push(...common);mc.push(...common);
  if (input.first === "none") mc.push("At least one approved language test required for Express Entry");
  const min1=Math.min(...first),min2=Math.min(...second),years=integer("fswYears",0,10,mf);
  const offer=opt("validOffer",["no","yes"],mf),adapt=Number(opt("otherAdaptability",["0","5","10"],mf));
  const ff={age:age>=18&&age<=35?12:age>=36&&age<=46?47-age:0,education:[0,5,15,19,21,22,23,25][edu],language:first.reduce((s,n)=>s+(n>=9?6:n===8?5:n===7?4:0),0)+(min2>=5?4:0),experience:years>=6?15:years>=4?13:years>=2?11:years>=1?9:0,arrangedEmployment:offer==="yes"?10:0,adaptability:Math.min(10,adapt+(offer==="yes"?5:0))};
  const sum=o=>Object.values(o).reduce((a,n)=>a+n,0);
  if(!common.some(x=>x.startsWith("first ("))&&min1<7)failed.push("First language below CLB/NCLC 7 in at least one ability");
  if(!common.includes("education")&&edu===0)failed.push("No completed secondary credential");
  if(!mf.includes("fswYears")&&years===0)failed.push("Less than one qualifying year");
  const sf=mf.length?null:sum(ff);
  for(const [k,label] of [["continuousWork","Continuous primary NOC qualifying work"],["funds","Settlement funds or documented exemption"],["outsideQuebec","Intention to settle outside Quebec"],["admissibility","Admissibility review"]]){opt(k,["no","yes"],mf);if(input[k]==="no")failed.push(label);}
  if(sf!==null&&sf<67)failed.push("Selection score below 67");
  const spouse=opt("spouse",["no","yes"],mc)==="yes",ca=integer("canadianYears",0,10,mc),foreign=integer("foreignYears",0,10,mc);
  const work=Number(opt("highWageWork",["0","20","40","70"],mc)),job=Number(opt("highWageOffer",["0","50","70","100"],mc));
  if(job>0&&input.validOffer!=="yes")mc.push("qualifying high-wage offer confirmation");
  if(work>0&&ca===0)mc.push("high-wage work requires qualifying Canadian work");
  if(ca+foreign>10)mc.push("non-overlapping work years within last ten years");
  const ap=age<18||age>=45?0:age<20?(spouse?[90,95]:[99,105])[age-18]:age<30?(spouse?100:110):(spouse?[95,90,85,80,75,70,65,60,55,50,45,35,25,15,5]:[105,99,94,88,83,77,72,66,61,55,50,39,28,17,6])[age-30];
  const ep=(spouse?[0,28,84,91,112,119,126,140]:[0,30,90,98,120,128,135,150])[edu];
  const lp=first.reduce((s,n)=>s+(n>=10?(spouse?32:34):n===9?(spouse?29:31):n===8?(spouse?22:23):n===7?(spouse?16:17):n===6?(spouse?8:9):n>=4?6:0),0)+Math.min(spouse?22:24,second.reduce((s,n)=>s+(n>=9?6:n>=7?3:n>=5?1:0),0));
  const wp=(spouse?[0,35,46,56,63,70]:[0,40,53,64,72,80])[Math.min(ca,5)];
  let sp=0;
  if(spouse){const se=integer("spouseEducation",0,7,mc);if(se>0&&input.spouseCredential!=="canadian"&&!fresh(input.spouseCredential,5))mc.push("spouse ECA / credential");const sl=lang("spouseLanguage",mc),sw=integer("spouseYears",0,10,mc);sp=[0,2,6,7,8,9,10,10][se]+sl.reduce((s,n)=>s+(n>=9?5:n>=7?3:n>=5?1:0),0)+[0,5,7,8,9,10][Math.min(sw,5)];}
  const combo=(rank,level)=>!rank||!level?0:rank===2&&level===2?50:rank===1&&level===1?13:25;
  const lr=min1>=9?2:min1>=7?1:0,cr=ca>=2?2:ca>=1?1:0,er=edu>=5?2:edu>=2?1:0,fr=foreign>=3?2:foreign>=1?1:0;
  const trade=opt("tradeCertificate",["no","yes"],mc)==="yes";
  const transfer=Math.min(100,Math.min(50,combo(er,lr)+combo(er,cr))+Math.min(50,combo(fr,lr)+combo(fr,cr))+(trade?(min1>=7?50:min1>=5?25:0):0));
  const french=kind==="french"?min1:min2,english=kind==="english"?min1:min2;
  const nomination=opt("nomination",["no","yes"],mc)==="yes",sibling=opt("sibling",["no","yes"],mc)==="yes",study=Number(opt("canadianStudy",["0","15","30"],mc));
  if(study>0&&edu<2)mc.push("Canadian study bonus requires a post-secondary credential");
  const cf={age:ap,education:ep,language:lp,labourMarketIntegration:Math.max(wp+work,job),spouse:sp,transferability:transfer,additional:Math.min(600,(nomination?600:0)+(sibling?15:0)+study+(french>=7?(english>=5?50:25):0))};
  return {fsw:{status:failed.length?"does_not_meet_screen":mf.length?"unknown":"meets_screen",score:sf,factors:sf===null?{}:ff,missing:mf,failed},crs:{score:mc.length?null:sum(cf),factors:mc.length?{}:cf,missing:mc}};
}
