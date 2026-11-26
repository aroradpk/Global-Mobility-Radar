export default function ProfileAgeControl({age,linked,onChange}:{age:string;linked:boolean;onChange:(linked:boolean)=>void}){
 return <div className="stack">
   <label className="check"><input type="checkbox" checked={linked} disabled={!age&&!linked} onChange={e=>onChange(e.target.checked)}/> Use confirmed profile age</label>
   <p className="muted small">{linked?(age?"Linked to today's profile age. Unlink to restore your manual scenario age.":"Linked age is unavailable. Confirm your age in Profile or unlink to use a manual value."):(age?"Optional: link today's confirmed age ("+age+"). Other facts are not inferred.":"Confirm your current age in Profile to reuse it here.")}</p>
 </div>;
}
