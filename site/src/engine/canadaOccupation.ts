import type {EvidenceRecord} from "./profileEvidence";
import {dateValue} from "./jobScreening";
export const nocSource="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/find-national-occupation-code.html";
export const nocDutiesSource="https://noc.esdc.gc.ca/";
export const nocReview={version:"NOC 2021 Version 1.0",reviewedOn:"2026-11-27",through:"2026-12-25"};
// Deliberately bounded reference set for common technology, finance and adjacent roles.
// Codes and TEER categories are published reference facts, not inferred from titles.
const rows = [
 ["21211",1,"Data scientists"],["21220",1,"Cybersecurity specialists"],
 ["21221",1,"Business systems specialists"],["21222",1,"Information systems specialists"],
 ["21223",1,"Database analysts and data administrators"],["21230",1,"Computer systems developers and programmers"],
 ["21231",1,"Software engineers and designers"],["21232",1,"Software developers and programmers"],
 ["21233",1,"Web designers"],["21234",1,"Web developers and programmers"],
 ["10020",0,"Insurance, real estate and financial brokerage managers"],
 ["12201",2,"Insurance adjusters and claims examiners"],["12202",2,"Insurance underwriters"],
 ["13100",3,"Administrative officers"],["14201",4,"Banking, insurance and other financial clerks"],
] as const;
type Occupation={code:string;teer:number;title:string};
type Lookup={status:"listed";occupation:Occupation;fswTeerBand:boolean}|{status:"unknown";reason:string};
export function lookupCanadaOccupation(classification:string,code:string,today:string):Lookup{
 if(dateValue(today)===null||today<"2026-11-26"||today>nocReview.through)return {status:"unknown",reason:"Occupation reference requires review for this date."};
 if(typeof classification!=="string"||classification.trim().toLowerCase()!=="noc 2021")return {status:"unknown",reason:"Select NOC 2021 as the classification; other versions require manual review."};
 if(typeof code!=="string"||!/^\d{5}$/.test(code.trim()))return {status:"unknown",reason:"Enter the exact five-digit NOC 2021 code."};
 const row=rows.find(r=>r[0]===code.trim());
 if(!row)return {status:"unknown",reason:"Not in the local reference subset. Check the official full NOC list."};
 return {status:"listed",occupation:{code:row[0],teer:row[1],title:row[2]},fswTeerBand:row[1]<=3};
}
export function lookupEmploymentOccupation(record:EvidenceRecord|undefined,today:string):Lookup{
 if(!record||record.kind!=="employment")return {status:"unknown",reason:"No saved employment record selected."};
 return lookupCanadaOccupation(record.values.classification??"",record.values.occupation??"",today);
}
