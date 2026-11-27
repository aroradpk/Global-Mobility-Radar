import {dateValue} from "./jobScreening";
import type {EvidenceRecord} from "./profileEvidence";
export const germanyRecognitionSource="https://www.make-it-in-germany.com/en/visa-recognition/recognition/evaluation-academic-degrees";
export const germanyRecognitionChoices:Record<string,readonly (readonly [string,string])[]>={germanyCredentialOwner:[["applicant","Principal applicant"],["spouse","Spouse / partner"]],germanyRecognitionBasis:[["anabin","Positive Anabin institution AND degree results"],["zab","Positive ZAB Statement of Comparability"],["german","Completed German academic degree"],["partial","Official partial-recognition notice"],["foreign","State-recognised foreign qualification; required proof checked"]],germanyRecognitionConfirmed:[["confirmed","Checked current original proof, applicable route, exact award and institution; no unresolved recognition restriction"]]};
type Result={ok:true;opQualification:"recognised"|"partial"|"foreign";blueDegree:boolean;basis:string}|{ok:false;reason:string};
export function mapGermanyRecognition(record:EvidenceRecord|undefined,today:string):Result{
 const fail=(reason:string):Result=>({ok:false,reason});
 if(dateValue(today)===null||today<"2026-11-26"||today>"2026-12-26")return fail("Recognition rules require current review.");
 if(!record||record.kind!=="education")return fail("Select a saved education record.");
 const v=record.values;
 if(v.germanyCredentialOwner!=="applicant"||v.germanyRecognitionConfirmed!=="confirmed")return fail("Confirm applicant ownership and original German recognition evidence.");
 if(!v.qualification?.trim()||!v.institution?.trim()||!v.country?.trim()||!v.awarded||dateValue(v.awarded)===null||v.awarded>today)return fail("Completed qualification, institution, country and award date required.");
 if(v.assessmentDate&&(dateValue(v.assessmentDate)===null||v.assessmentDate<v.awarded||v.assessmentDate>today))return fail("Recognition observation date conflicts.");
 if(v.expiry&&(dateValue(v.expiry)===null||v.expiry<today||(v.assessmentDate&&v.expiry<v.assessmentDate)))return fail("Recognition expiry conflicts or has passed.");
 const domestic=["de","germany","deutschland"].includes(v.country.trim().toLowerCase());
 const basis=v.germanyRecognitionBasis;
 if(basis==="german"&&domestic)return {ok:true,opQualification:"recognised",blueDegree:true,basis:"German academic degree"};
 if(domestic)return fail("German award conflicts with foreign recognition basis.");
 if((basis==="anabin"||basis==="zab")&&v.assessmentDate)return {ok:true,opQualification:"recognised",blueDegree:true,basis:basis==="anabin"?"Anabin institution and degree":"ZAB comparability"};
 if(basis==="partial"&&v.assessmentDate)return {ok:true,opQualification:"partial",blueDegree:false,basis:"Partial recognition"};
 if(basis==="foreign"&&v.assessmentDate)return {ok:true,opQualification:"foreign",blueDegree:false,basis:"State recognition and required proof"};
 return fail("Select supported recognition proof and record the verification/issue date.");
}
export function withGermanyRecognition(input:Record<string,string>,selected:string,records:readonly EvidenceRecord[],today:string,route:"opportunity"|"blue"):Record<string,string>{
 if(!selected)return input;
 const r=mapGermanyRecognition(records.find(x=>String(x.id)===selected),today);
 if(route==="opportunity")return {...input,opQualification:r.ok?r.opQualification:"",opForeignProof:r.ok&&r.opQualification==="foreign"?"yes":""};
 return {...input,blueQualification:r.ok&&r.blueDegree?"degree":"",blueDegreeProof:r.ok&&r.blueDegree?"yes":""};
}
