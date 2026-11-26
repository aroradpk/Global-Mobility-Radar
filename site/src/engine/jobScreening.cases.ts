import { screenSalary, compareDutchSponsor, scamFlags } from "./jobScreening";
const base = {route:"de-standard", applicationDate:"2026-11-25", amount:"50700", basisConfirmed:true, criterionConfirmed:true};
const sponsor = {employerName:"Example B.V.", employerKvk:"12345678", registerName:"Example B.V.", registerKvk:"12345678", publicationDate:"2026-11-01", checkedDate:"2026-11-25", sourceConfirmed:true};
function eq(actual: unknown, expected: unknown) { if (actual !== expected) throw new Error(`Expected ${expected}, received ${actual}`); }
export const cases: [string, () => void][] = [
  ["German standard floor exact boundary", () => eq(screenSalary(base).status, "meets_floor")],
  ["German standard one cent below", () => eq(screenSalary({...base,amount:"50699.99"}).status,"below_floor")],
  ["German reduced exact boundary", () => eq(screenSalary({...base,route:"de-reduced",amount:"45934.20"}).status,"meets_floor")],
  ["Dutch first application standard floors", () => {eq(screenSalary({...base,route:"nl-under30",amount:"4357"}).status,"meets_floor");eq(screenSalary({...base,route:"nl-30plus",amount:"4357"}).status,"below_floor");}],
  ["Dutch reduced and Blue Card floors", () => {eq(screenSalary({...base,route:"nl-reduced",amount:"3122"}).status,"meets_floor");eq(screenSalary({...base,route:"nl-blue",amount:"5941.99"}).status,"below_floor");eq(screenSalary({...base,route:"nl-blue-reduced",amount:"4754"}).status,"meets_floor");}],
  ["Missing or unconfirmed salary and criterion", () => {for(const patch of [{amount:""},{amount:"0"},{amount:"€50000"},{amount:"1e6"},{amount:"NaN"},{basisConfirmed:false},{criterionConfirmed:false},{route:"unknown"}])eq(screenSalary({...base,...patch}).status,"unknown");}],
  ["Expired rules and impossible date", () => {for(const applicationDate of ["2027-01-01","2025-12-31","2026-02-30",""])eq(screenSalary({...base,applicationDate}).status,"unknown");}],
  ["Exact legal entity and registration number", () => eq(compareDutchSponsor({...sponsor,registerName:" example  B.V. "},"2026-11-25"),"manual_exact_match")],
  ["Similar names and incorrect IDs not accepted", () => {eq(compareDutchSponsor({...sponsor,registerName:"Example"},"2026-11-25"),"mismatch");eq(compareDutchSponsor({...sponsor,registerKvk:"87654321"},"2026-11-25"),"mismatch");}],
  ["Stale, future or missing sponsor evidence", () => {for(const patch of [{publicationDate:"2026-10-01"},{checkedDate:"2026-11-01"},{checkedDate:"2026-11-26"},{sourceConfirmed:false},{employerKvk:""}])eq(compareDutchSponsor({...sponsor,...patch},"2026-11-25"),"unknown");}],
  ["Recruitment payment and crypto warnings", () => eq(scamFlags("Pay a recruitment fee. Send cryptocurrency.").length,2)],
  ["Check repayment and messaging-only warnings", () => eq(scamFlags("Deposit the check and send the balance. Interview via Telegram only.").length,2)],
  ["Ordinary benefits do not trigger payment warnings", () => eq(scamFlags("We offer training, relocation assistance and equipment. No recruitment fee.").length,0)],
];
