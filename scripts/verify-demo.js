// Headless verification of demo/index.html behaviours (node scripts/verify-demo.js)
const fs=require("fs"), path=require("path");
const html=fs.readFileSync(path.join(__dirname,"..","demo","index.html"),"utf8");
const app=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).pop();
const store={};
const fakeEl=()=>({_h:"",set innerHTML(v){this._h=v;},get innerHTML(){return this._h;},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return fakeEl();},querySelectorAll(){return [];},style:{},value:"",elements:{}});
global.document={getElementById:()=>fakeEl(),addEventListener(){},createElement:()=>fakeEl(),body:{appendChild(){}}};
global.window={scrollTo(){}};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]};
global.confirm=()=>true;
let lastAlert=null; global.alert=m=>{ lastAlert=m; };
const probe=";global.__T={DB,USERS,WORKFLOWS,CHECKLISTS,viewMoc,viewDashboard,applySignature,advanceStage,addActionItem,toggleAction,setChecklist,get CURRENT(){return CURRENT;},set CURRENT(v){CURRENT=v;}};";
new Function(app+probe)();
const T=global.__T; let f=0; const ok=(c,m)=>{console.log((c?"PASS":"FAIL")+": "+m); if(!c)f++;};
const uName=id=>T.USERS.find(u=>u.id===id).name;

// #5 bypass restoration requires Process Safety too
const rest=T.WORKFLOWS.BYPASS.find(s=>s.stage==="RESTORATION");
ok(rest.sigs.some(s=>s.role==="PROCESS_SAFETY")&&rest.sigs.some(s=>s.role==="MOC_LEAD"),"#5 bypass Return-to-Service needs MOC Lead + Process Safety");
const byp=T.DB.mocs.find(m=>m.type==="BYPASS"&&m.status==="ACTIVE");
ok(byp.approvals.filter(a=>a.stage==="RESTORATION").length===2,"#5 active bypass has both restoration signatures pending");

// #2 action timing labels + category on add form
const rev=T.DB.mocs.find(m=>m.status==="REVIEW"); // L2 pump
let d=T.viewMoc(rev.id);
ok(d.includes("Action item timing")&&d.includes("Part of design")&&d.includes("Prior to commissioning")&&d.includes("Prior to closure"),"#2 action timing subtitle + options present");
ok(d.includes('name="category"'),"#2 add-action form has a timing category select");

// #4 + #9 dashboard: my open actions + counts by employee
T.CURRENT="u-jamie";
const dash=T.viewDashboard();
ok(dash.includes("My open action items"),"#4 dashboard shows my open action items");
ok(dash.includes("Remove temporary jumper"),"#4 my seeded open action appears");
ok(dash.includes("Open actions by employee"),"#9 dashboard shows per-employee counts");
ok(dash.includes("Overdue"),"#9 counts include an overdue column");

// #7 any approver (not just lead) can advance an IMPLEMENTATION MOC
const temp=T.DB.mocs.find(m=>m.changeType==="TEMPORARY"&&m.type==="LEVEL2"); // E-310 at IMPLEMENTATION
T.CURRENT="u-pat"; // PM, an approver of this MOC, not the lead
ok(temp.leadId!=="u-pat","(precondition) Pat is not the lead");
ok(T.viewMoc(temp.id).includes("Mark implementation complete"),"#7 an approver sees the advance action");

// #3 cannot close out while action items are open
T.CURRENT=temp.leadId; T.advanceStage(temp.id); // IMPLEMENTATION -> HANDOVER
let g=0;
while(temp.status!=="CLOSEOUT" && g++<5){ const p=temp.approvals.find(a=>a.stage==="HANDOVER"&&a.decision==="PENDING"); if(!p)break; T.CURRENT=p.assignedToId; T.applySignature(temp.id,p.id,"APPROVED",uName(p.assignedToId),""); }
ok(temp.status==="CLOSEOUT","temp MOC reached CLOSEOUT");
ok(temp.actions.some(a=>a.status==="OPEN"),"(precondition) temp MOC has an open action");
lastAlert=null;
const co=temp.approvals.find(a=>a.stage==="CLOSEOUT"&&a.decision==="PENDING");
T.CURRENT=co.assignedToId; T.applySignature(temp.id,co.id,"APPROVED",uName(co.assignedToId),"");
ok(co.decision==="PENDING"&&temp.status!=="CLOSED","#3 close-out signing blocked while an action is open");
ok(lastAlert&&/action item/i.test(lastAlert),"#3 shows an explanatory message");
// close the action, then close-out succeeds
T.toggleAction(temp.id, temp.actions.find(a=>a.status==="OPEN").id);
let g2=0;
while(temp.status!=="CLOSED" && g2++<5){ const p=temp.approvals.find(a=>a.stage==="CLOSEOUT"&&a.decision==="PENDING"); if(!p)break; T.CURRENT=p.assignedToId; T.applySignature(temp.id,p.id,"APPROVED",uName(p.assignedToId),""); }
ok(temp.status==="CLOSED","#3 after closing actions, MOC closes out");

// #8 Level 1 Part 2 close-out checklist hidden during approval, shown after implementation
const l1=T.DB.mocs.find(m=>m.type==="LEVEL1");
ok(T.viewMoc(l1.id).includes("Close-Out Checklist"),"#8 closed L1 shows Part 2 close-out checklist");
const saved=l1.status; l1.status="REVIEW";
ok(!T.viewMoc(l1.id).includes("Close-Out Checklist"),"#8 during REVIEW the Part 2 checklist is hidden");
ok(T.viewMoc(l1.id).includes("Functional Review Checklist"),"#8 the Appendix A functional review IS shown during review");
l1.status=saved;

// #1 remarks can be documented on the functional review checklist
l1.status="REVIEW";
T.setChecklist(l1.id,"FUNCTIONAL_REVIEW","fr-hazards",{answer:"YES",remarks:"Reviewed at HAZOP 2026-06"});
ok(l1.checklist["FUNCTIONAL_REVIEW|fr-hazards"].remarks==="Reviewed at HAZOP 2026-06","#1 remarks saved on functional review item");
ok(T.viewMoc(l1.id).includes("Reviewed at HAZOP 2026-06"),"#1 remarks render on the checklist");
l1.status=saved;

// #6 storage version bumped
ok(html.includes('vmoc_demo_v2'),"#6 storage version bumped to v2 (stale data auto-refreshes)");

console.log(f===0?"\nALL DEMO CHECKS PASSED":"\n"+f+" FAILURES");
process.exit(f?1:0);
