// Australia skilled-migration self-reported scenario. See docs/australia-rules.md.
export function assessAustralia(input, today) {
  const missing = [], failed = [], factors = {};
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+"T00:00:00Z")) && new Date(value+"T00:00:00Z").toISOString().slice(0,10) === value;
  const unknown = () => ({ basePoints:null, factors:{}, routes:[], missing:["Current rule review required"], failed:[] });
  if (!validDate(today) || today < "2026-11-26" || today > "2026-12-26") return unknown();
  const choice = (key, values, label, list=missing) => {
    if (!values.includes(input[key])) { list.push(label); return null; }
    return input[key];
  };
  const integer = (key, max, label) => {
    const value=input[key];
    if(typeof value!=="string" || !/^\d{1,3}$/.test(value) || Number(value)>max) { missing.push(label); return null; }
    return Number(value);
  };
  const yesNo = (key,label,list=missing) => choice(key,["yes","no"],label,list);
  const withinYears = (value, years) => {
    if(!validDate(value)||value>today)return false;
    const anniversary=String(Number(value.slice(0,4))+years)+value.slice(4);
    return today < (validDate(anniversary)?anniversary:anniversary.slice(0,8)+"28");
  };
  const age=integer("age",120,"Age at assessment");
  if(age!==null){
    factors.age=age<18||age>=45?0:age<25?25:age<33?30:age<40?25:15;
    if(age<18||age>=45)failed.push("Age must be 18–44 at invitation");
  }
  const english=choice("english",["below","competent","proficient","superior"],"Verified English level");
  const englishEvidence=choice("englishEvidence",["passport","test","none"],"English evidence type");
  if(english!==null){
    factors.english=english==="superior"?20:english==="proficient"?10:0;
    if(english==="below")failed.push("At least competent English is required");
  }
  if(english&&english!=="below"){
    if(englishEvidence==="test"&&!withinYears(input.englishDate,3))missing.push("Current approved English test date");
    if(englishEvidence==="passport"&&english!=="competent")missing.push("Proficient/superior English requires approved test evidence");
    if(englishEvidence==="none")missing.push("English evidence");
  }
  const overseas=integer("overseasMonths",120,"Qualifying overseas work months");
  const local=integer("australianMonths",120,"Qualifying Australian work months");
  if(overseas!==null&&local!==null){
    if(overseas+local>120)missing.push("Non-overlapping qualifying employment in the last 10 years");
    const op=overseas>=96?15:overseas>=60?10:overseas>=36?5:0;
    const ap=local>=96?20:local>=60?15:local>=36?10:local>=12?5:0;
    factors.employment=Math.min(20,op+ap);
  }
  const qualification=choice("education",["none","recognised10","bachelor","doctorate"],"Recognised highest qualification");
  if(qualification!==null)factors.education={none:0,recognised10:10,bachelor:15,doctorate:20}[qualification];
  const study=yesNo("study","Australian study requirement");
  const specialist=yesNo("specialist","Eligible Australian specialist research qualification");
  const regional=yesNo("regional","Eligible regional Australian study");
  const community=yesNo("community","Current recognised community language credential");
  const professional=yesNo("professional","Eligible Australian Professional Year");
  if(study!==null)factors.australianStudy=study==="yes"?5:0;
  if(specialist!==null)factors.specialistEducation=specialist==="yes"?10:0;
  if(regional!==null)factors.regionalStudy=regional==="yes"?5:0;
  if(community!==null)factors.communityLanguage=community==="yes"?5:0;
  if(professional!==null)factors.professionalYear=professional==="yes"?5:0;
  if(regional==="yes"&&study!=="yes")missing.push("Regional study requires Australian study requirement");
  if(specialist==="yes"&&qualification!=="bachelor"&&qualification!=="doctorate")missing.push("Specialist study requires a recognised research masters or doctorate");
  if(professional==="yes"&&!withinYears(input.professionalDate,4))missing.push("Professional Year completion within 48 months");
  const partner=choice("partner",["singleOrCitizen","skilled","english","other"],"Partner points category");
  if(partner!==null)factors.partner=partner==="singleOrCitizen"||partner==="skilled"?10:partner==="english"?5:0;
  if(partner==="skilled"||partner==="english"){
    if(yesNo("partnerConfirmed","Partner eligibility for selected points")!=="yes")missing.push("Confirm partner's applicable English, applicant and skills conditions");
  }
  const scoreMissing=[...new Set(missing)];
  const basePoints=scoreMissing.length?null:Object.values(factors).reduce((sum,value)=>sum+value,0);
  const skills=yesNo("skills","Suitable skills assessment for nominated occupation");
  if(skills==="no")failed.push("Suitable skills assessment not yet held");
  if(skills==="yes"&&!withinYears(input.skillsDate,3))missing.push("Skills assessment date within three years");
  if(skills==="yes"&&yesNo("skillsValid","Assessment still valid and not for subclass 485")!=="yes")missing.push("Confirm suitable assessment validity");
  for(const [key,label] of [["health","Health requirements"],["character","Character requirements"],["otherRequirements","Other applicable visa conditions"]]){
    if(yesNo(key,label)==="no")failed.push(label+" not met");
  }
  const routes=[["189",0,"Permanent visa"],["190",5,"Permanent visa"],["491",15,"Provisional regional visa"]].map(([id,bonus,kind])=>{
    const routeMissing=[...new Set(missing)], routeFailed=[...failed];
    const occupation=yesNo("occupation"+id,"Occupation on applicable subclass "+id+" list",routeMissing);
    if(occupation==="no")routeFailed.push("Occupation not on applicable list");
    const support=id==="189"?"yes":yesNo("support"+id,id==="190"?"Current state nomination":"Current state nomination or accepted eligible family sponsorship",routeMissing);
    if(support==="no")routeFailed.push(id==="190"?"Nomination not held":"Nomination or accepted family sponsorship not held");
    const invitation=yesNo("invited"+id,"Invitation for subclass "+id,routeMissing);
    const points=basePoints===null?null:basePoints+(support==="yes"?bonus:0);
    const potentialPoints=basePoints===null?null:basePoints+bonus;
    if(potentialPoints!==null&&potentialPoints<65)routeFailed.push("Even with applicable nomination points, below 65");
    if(invitation==="yes"){
      const value=input["invitedPoints"+id];
      if(typeof value!=="string"||!/^\d{1,3}$/.test(value)||Number(value)<65)routeMissing.push("Points required by actual invitation");
      else if(points!==null&&points<Number(value))routeFailed.push("Below points stated in invitation");
    }
    const status=routeFailed.length?"requirements_not_met":routeMissing.length?"review_required":points===null||points<65?"requirements_not_met":invitation==="yes"?"meets_self_reported_screen":"potential_eoi_candidate";
    return {id,kind,points,potentialPoints,status,missing:[...new Set(routeMissing)],failed:routeFailed};
  });
  return {basePoints,factors:basePoints===null?{}:factors,routes,missing:[...new Set(missing)],failed};
}
