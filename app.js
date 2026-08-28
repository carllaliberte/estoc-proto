const TRAITS=[
  {id:"froid",label:"Cold"},{id:"tetu",label:"Stubborn"},{id:"loyal",label:"Loyal"},
  {id:"moqueur",label:"Mocking"},{id:"mefiant",label:"Wary"},{id:"ardent",label:"Ardent"}
];
const LINES={
  pointe:{name:"Point",skills:[
    {id:"ligne",name:"Line",kind:"attack",dmg:11,hint:"Fast point. 11."},
    {id:"mesure",name:"Measure",kind:"prep",dmg:0,hint:"Build steel. +20."},
    {id:"ouverture",name:"Opening",kind:"finish",dmg:28,hint:"Needs 25 steel."}
  ]},
  taille:{name:"Edge",skills:[
    {id:"passage",name:"Passage",kind:"attack",dmg:13,hint:"Cut across. 13."},
    {id:"pression",name:"Pressure",kind:"prep",dmg:5,hint:"Lean in. +16 steel."},
    {id:"rupture",name:"Rupture",kind:"finish",dmg:30,hint:"Needs 25 steel."}
  ]},
  garde:{name:"Guard",skills:[
    {id:"plaque",name:"Plate",kind:"guard",dmg:3,hint:"Take the hit. Block."},
    {id:"rendre",name:"Return",kind:"attack",dmg:12,hint:"Give it back. 12."},
    {id:"epuisement",name:"Drain",kind:"finish",dmg:22,hint:"Needs 25 steel. Steal."}
  ]}
};
const BOTS=[
  {id:"lame-neuve",name:"Newsteel",lineage:"pointe",habit:"Leans on Line.",open:"Newsteel salutes.",win:"You measured.",lose:"Still standing.",bias:"attack"},
  {id:"brume",name:"Mist",lineage:"pointe",habit:"Holds Measure.",open:"Mist does not move.",win:"Too early.",lose:"Should have waited.",bias:"prep"},
  {id:"croc",name:"Fang",lineage:"taille",habit:"Rupture when low.",open:"Fang is coming.",win:"Still standing.",lose:"You waited.",bias:"finish"},
  {id:"halte",name:"Halt",lineage:"garde",habit:"Plants Plate.",open:"Halt plants feet.",win:"Tomorrow.",lose:"The wall holds.",bias:"guard"},
  {id:"sillage",name:"Wake",lineage:"taille",habit:"Pressure, then cut.",open:"Wake hunts.",win:"You kept back.",lose:"Tempo.",bias:"prep"},
  {id:"duelle",name:"Duelle",lineage:"pointe",habit:"Looks for Opening.",open:"Duelle smiles.",win:"Almost.",lose:"I read it.",bias:"finish"},
  {id:"masse",name:"Mass",lineage:"garde",habit:"Feeds Drain.",open:"Mass takes the hit.",win:"Not empty.",lose:"You fed me.",bias:"guard"},
  {id:"estoc-noir",name:"Black Estoc",lineage:"pointe",habit:"Reads the last cut.",open:"This week's steel.",win:"You varied.",lose:"Predictable.",bias:"attack"}
];
const SUGGEST={pointe:"Linen",taille:"Cinder",garde:"Somme"};
const MATCH_SECS=480,SAVE_KEY="estoc.v5",LOG_KEY="estoc.log.v1";

function testerId(){
  let id=localStorage.getItem("estoc.tid");
  if(!id){id="t-"+Math.random().toString(36).slice(2,8);localStorage.setItem("estoc.tid",id);}
  return id;
}
function dawnKey(off){
  const d=new Date();
  if(d.getHours()<4)d.setDate(d.getDate()-1);
  if(off)d.setDate(d.getDate()+off);
  return d.toISOString().slice(0,10);
}
function note(kind,extra){
  const log=JSON.parse(localStorage.getItem(LOG_KEY)||"[]");
  log.push({t:new Date().toISOString(),kind,extra:extra||"",dawn:dawnKey()});
  localStorage.setItem(LOG_KEY,JSON.stringify(log.slice(-80)));
}
function reportText(){
  const log=JSON.parse(localStorage.getItem(LOG_KEY)||"[]");
  const dawns=[...new Set(log.map(x=>x.dawn))];
  const sends=log.filter(x=>x.kind==="send").length;
  return ["Estoc 14-day report","id "+testerId(),"name "+state.name,
    `streak ${state.streak} wins ${state.wins} missed ${state.missed}`,
    `sends ${sends} dawns ${dawns.length}`].join("\n");
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&","<":"<",">":">",'"':'"',"'":"&#39;"}[c]));}

const state={
  lineage:"pointe",traits:["froid","tetu","loyal"],name:"Linen",ai:true,plus:false,
  credits:0,gestures:3,sendFree:1,practiced:false,lastDawn:"",lastSendDawn:"",
  streak:0,missed:0,weekSends:[],wounded:false,memory:[],wins:0,ladder:0,
  hp:100,foe:100,elanYou:0,elanFoe:0,time:MATCH_SECS,live:false,busy:false,lastPlayer:""
};
let tick=null;

function persist(){
  localStorage.setItem(SAVE_KEY,JSON.stringify({
    lineage:state.lineage,traits:state.traits,name:state.name,ai:state.ai,plus:state.plus,
    credits:state.credits,gestures:state.gestures,sendFree:state.sendFree,practiced:state.practiced,
    lastDawn:state.lastDawn,lastSendDawn:state.lastSendDawn,streak:state.streak,missed:state.missed,
    weekSends:state.weekSends,wounded:state.wounded,memory:state.memory,wins:state.wins,ladder:state.ladder
  }));
}
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");
    if(!raw)return false;
    Object.assign(state,raw);
    return true;
  }catch{return false;}
}
function gestureCap(){return state.plus?8:3;}
function applyDawn(force){
  const today=dawnKey();
  if(!force&&state.lastDawn===today)return;
  let gap=0;
  if(state.lastDawn){
    const a=new Date(state.lastDawn+"T12:00:00"),b=new Date(today+"T12:00:00");
    gap=Math.max(0,Math.round((b-a)/86400000)-1);
  }
  state.missed=gap;
  if(gap>=1)state.wounded=true;
  if(gap>=3&&state.memory.length)state.memory=state.memory.slice(0,-1);
  if(state.lastSendDawn&&state.lastSendDawn!==dawnKey(-1)&&state.lastSendDawn!==today)state.streak=0;
  state.gestures=gestureCap();
  state.sendFree=1;
  state.lastDawn=today;
  persist();
}
function sendsLeft(){return state.sendFree+state.credits;}
function show(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("on"));
  document.getElementById(id).classList.add("on");
}
function traitLabel(id){return (TRAITS.find(t=>t.id===id)||{label:id}).label;}
function remember(text){
  state.memory=[text.slice(0,80),...state.memory.filter(m=>m!==text)].slice(0,3);
  persist();
}
function currentBot(){return BOTS[Math.min(state.ladder,BOTS.length-1)];}
function setMask(el,line){
  if(!el)return;
  const size=el.classList.contains("mini")?"mini":el.classList.contains("big")?"big":"mid";
  el.className="mask "+size+" "+line;
}

function renderTraits(){
  const box=document.getElementById("traits");
  box.innerHTML=TRAITS.map(t=>`<button class="chip ${state.traits.includes(t.id)?"on":""}" data-t="${t.id}">${t.label}</button>`).join("");
  box.querySelectorAll("button").forEach(b=>b.onclick=()=>{
    const id=b.dataset.t;
    if(state.traits.includes(id))state.traits=state.traits.filter(x=>x!==id);
    else if(state.traits.length<3)state.traits.push(id);
    renderTraits();
  });
}
function phraseCamp(){
  if(!state.ai)return "The hall is quiet. Send.";
  if(state.missed>=2)return "The mask waited.";
  if(state.memory[0])return "I do not forget. "+state.memory[0];
  return "Yard is open. Send me.";
}
function enterCamp(){
  stopClock();
  applyDawn(false);
  const L=LINES[state.lineage],bot=currentBot();
  setMask(document.getElementById("campMask"),state.lineage);
  document.getElementById("campName").textContent=state.name;
  document.getElementById("campMeta").textContent=L.name+" · "+(state.traits.map(traitLabel).join(" · ")||"—");
  document.getElementById("campActions").textContent="Gestures "+state.gestures+"/"+gestureCap();
  document.getElementById("campStreak").textContent=state.streak?"Streak "+state.streak:"Dawn";
  const yard=!state.practiced;
  document.getElementById("campQueue").textContent=yard?("Yard vs "+bot.name):(state.sendFree?"Send ready · vs "+bot.name:"Send spent · vs "+bot.name);
  document.getElementById("campRust").textContent=state.wounded?"Rust":"";
  document.getElementById("campLine").textContent=phraseCamp();
  const sendBtn=document.getElementById("sendBtn");
  sendBtn.disabled=!yard&&sendsLeft()<=0;
  sendBtn.textContent=yard?"Yard bout":"Send";
  show("camp");
}
function renderFiche(){
  const box=document.getElementById("memList");
  box.innerHTML=state.memory.length?state.memory.map(m=>`<p class="bubble">${esc(m)}</p>`).join(""):`<p class="bubble">No yard carved yet.</p>`;
  document.getElementById("ficheName").textContent=state.name;
  document.getElementById("ladderList").innerHTML=BOTS.map((b,i)=>`<li class="${i===state.ladder?"now":""}">${esc(b.name)}</li>`).join("");
}
function renderYou(){
  document.getElementById("youStats").textContent=(state.plus?"Plus":"Free")+" · streak "+state.streak+" · wins "+state.wins;
}
function spendSend(){
  if(!state.practiced){state.practiced=true;persist();return true;}
  if(state.sendFree>0)state.sendFree-=1;
  else if(state.credits>0)state.credits-=1;
  else return false;
  const today=dawnKey();
  if(state.lastSendDawn!==today)state.streak=(state.lastSendDawn===dawnKey(-1)||!state.lastSendDawn)?state.streak+1:1;
  state.lastSendDawn=today;
  if(!state.weekSends.includes(today))state.weekSends.push(today);
  persist();
  return true;
}

function startDuel(){
  applyDawn(false);
  const yard=!state.practiced;
  if(!yard&&(sendsLeft()<=0||!spendSend())){show("shop");return;}
  if(yard)spendSend();
  const bot=currentBot(),L=LINES[state.lineage];
  state.hp=state.wounded?78:100;
  state.foe=100;
  state.elanYou=state.wounded?8:12;
  state.elanFoe=8;
  state.time=MATCH_SECS;
  state.live=true;
  state.busy=false;
  state.lastPlayer="";
  document.getElementById("youLabel").textContent=state.name;
  document.getElementById("foeLabel").textContent=bot.name;
  document.getElementById("habit").textContent=bot.habit;
  setMask(document.getElementById("youMask"),state.lineage);
  setMask(document.getElementById("foeMask"),bot.lineage);
  document.getElementById("skills").innerHTML=L.skills.map(s=>`<button data-s="${s.id}">${s.name}<small>${s.hint}</small></button>`).join("");
  document.getElementById("skills").querySelectorAll("button").forEach(b=>b.onclick=()=>playerSkill(b.dataset.s));
  note(yard?"yard":"send",bot.name);
  paintDuel(bot.open+" Your move.");
  show("duel");
  stopClock();
  tick=setInterval(onTick,1000);
}
function stopClock(){if(tick)clearInterval(tick);tick=null;state.live=false;}
function onTick(){
  if(!state.live)return;
  state.time-=1;
  if(state.time<=0){finish(state.hp>=state.foe);return;}
  document.getElementById("timer").textContent=fmt(state.time);
}
function fmt(sec){return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");}
function paintDuel(msg){
  if(msg)document.getElementById("log").textContent=msg;
  document.getElementById("youHp").style.width=Math.max(0,state.hp)+"%";
  document.getElementById("foeHp").style.width=Math.max(0,state.foe)+"%";
  document.getElementById("youElan").style.width=Math.min(100,state.elanYou)+"%";
  document.getElementById("foeElan").style.width=Math.min(100,state.elanFoe)+"%";
  document.getElementById("youHpn").textContent=Math.max(0,Math.round(state.hp));
  document.getElementById("foeHpn").textContent=Math.max(0,Math.round(state.foe));
  document.getElementById("timer").textContent=fmt(state.time);
  document.getElementById("phase").textContent=state.busy?"Steel meets":"Your move";
}
function flash(who){
  const el=document.getElementById(who==="you"?"youMask":"foeMask");
  if(!el)return;
  el.classList.remove("hit");
  void el.offsetWidth;
  el.classList.add("hit");
}
function skillOf(line,id){return LINES[line].skills.find(s=>s.id===id);}
function botPick(){
  const bot=currentBot();
  const skills=LINES[bot.lineage].skills;
  if(bot.bias==="finish"&&state.elanFoe>=25)return skills.find(s=>s.kind==="finish")||skills[0];
  if(bot.bias==="prep"&&state.elanFoe<25)return skills.find(s=>s.kind==="prep")||skills[0];
  if(bot.bias==="guard"&&state.lastPlayer==="attack")return skills.find(s=>s.kind==="guard")||skills[0];
  if(state.elanFoe>=25&&Math.random()<0.35)return skills.find(s=>s.kind==="finish")||skills[0];
  if(state.elanFoe<18)return skills.find(s=>s.kind==="prep")||skills[0];
  return skills.find(s=>s.kind==="attack")||skills[0];
}
function resolve(pDef,bDef){
  let pHit=0,bHit=0,pNote=pDef.name,bNote=bDef.name;
  if(pDef.kind==="prep"){state.elanYou=Math.min(100,state.elanYou+20);pHit=pDef.dmg;}
  else if(pDef.kind==="guard"){pHit=2;}
  else if(pDef.kind==="finish"){
    if(state.elanYou>=25){state.elanYou-=25;pHit=pDef.dmg;}else{pHit=6;pNote=pDef.name+" short";}
  }else pHit=pDef.dmg;
  if(bDef.kind==="prep"){state.elanFoe=Math.min(100,state.elanFoe+18);bHit=bDef.dmg;}
  else if(bDef.kind==="guard"){bHit=2;}
  else if(bDef.kind==="finish"){
    if(state.elanFoe>=25){state.elanFoe-=25;bHit=bDef.dmg;}else{bHit=6;bNote=bDef.name+" short";}
  }else bHit=bDef.dmg;
  if(pDef.kind==="guard")bHit=Math.floor(bHit*0.35);
  if(bDef.kind==="guard")pHit=Math.floor(pHit*0.35);
  if(pDef.kind==="finish"&&bDef.kind==="guard")pHit=Math.floor(pHit*0.55);
  if(bDef.kind==="finish"&&pDef.kind==="guard")bHit=Math.floor(bHit*0.55);
  if(pDef.kind==="finish"&&pDef.id==="epuisement"&&pHit>6){
    const steal=Math.min(12,state.elanFoe);
    state.elanFoe-=steal;state.elanYou=Math.min(100,state.elanYou+steal);
  }
  state.foe=Math.max(0,state.foe-pHit);
  state.hp=Math.max(0,state.hp-bHit);
  if(pHit)flash("foe");
  if(bHit)flash("you");
  const left=state.name+" "+pNote+(pHit?" — "+pHit+". ":". ");
  const right=currentBot().name+" "+bNote+(bHit?" — "+bHit+".":".");
  return left+right;
}
function playerSkill(id){
  if(!state.live||state.busy)return;
  const pDef=skillOf(state.lineage,id);
  if(!pDef)return;
  state.busy=true;
  state.lastPlayer=pDef.kind;
  const bDef=botPick();
  const line=resolve(pDef,bDef);
  paintDuel(line);
  lockSkills(true);
  if(state.foe<=0||state.hp<=0){finish(state.foe<=0&&state.hp>=state.foe);return;}
  setTimeout(()=>{
    if(!state.live)return;
    state.busy=false;
    lockSkills(false);
    paintDuel(line+" Your move.");
  },700);
}
function lockSkills(on){
  document.querySelectorAll("#skills button").forEach(b=>b.disabled=on);
}
function finish(win){
  stopClock();
  const bot=currentBot();
  if(win){
    state.wins+=1;state.wounded=false;
    if(state.ladder<BOTS.length-1)state.ladder+=1;
    remember("Win against "+bot.name);
  }else{
    state.wounded=true;
    remember("Loss vs "+bot.name);
  }
  persist();
  document.getElementById("resTitle").textContent=win?"Victory":"Defeat";
  document.getElementById("resLine").textContent=bot.name+": \u201c"+(win?bot.lose:bot.win)+"\u201d";
  document.getElementById("resMem").textContent=state.memory[0]||"";
  document.getElementById("sendAgain").style.display=sendsLeft()>0?"block":"none";
  note(win?"win":"loss",bot.name);
  show("result");
}
function doAct(act){
  applyDawn(false);
  if(state.gestures<=0){show("shop");return;}
  state.gestures-=1;
  if(act==="heal")state.wounded=false;
  if(act==="drill"){remember("Morning drill held");}
  document.getElementById("campLine").textContent=act==="talk"?phraseCamp():act==="drill"?"Drill held. Opening comes sooner.":"The steel quiets. Rust off.";
  document.getElementById("campActions").textContent="Gestures "+state.gestures+"/"+gestureCap();
  document.getElementById("campRust").textContent=state.wounded?"Rust":"";
  note(act);
  persist();
}
function bind(){
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{
    const to=b.dataset.go;
    if(to==="camp")enterCamp();
    else if(to==="fiche"){renderFiche();show("fiche");}
    else show(to);
  });
  document.getElementById("sendBtn").onclick=()=>startDuel();
  document.querySelectorAll(".pick").forEach(c=>c.onclick=()=>{
    document.querySelectorAll(".pick").forEach(x=>x.classList.remove("on"));
    c.classList.add("on");
    state.lineage=c.dataset.line;
    state.name=SUGGEST[state.lineage];
    document.getElementById("name").value=state.name;
  });
  document.getElementById("name").oninput=e=>{state.name=e.target.value.slice(0,12)||SUGGEST[state.lineage];};
  document.getElementById("allowAi").onclick=()=>{state.ai=true;show("create");};
  document.getElementById("denyAi").onclick=()=>{state.ai=false;show("create");};
  document.getElementById("enter").onclick=()=>{
    if(state.traits.length!==3){alert("Three traits.");return;}
    applyDawn(true);
    note("create");
    persist();
    enterCamp();
  };
  document.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>doAct(b.dataset.act));
  document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{
    const id=t.dataset.tab;
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on",x===t));
    if(id==="camp")enterCamp();
    else if(id==="fiche"){renderFiche();show("fiche");}
    else {if(id==="toi")renderYou();show(id);}
  });
  document.getElementById("sendAgain").onclick=()=>startDuel();
  document.getElementById("togglePlus").onclick=()=>{state.plus=!state.plus;persist();renderYou();};
  document.getElementById("skipDawn").onclick=()=>{state.missed+=1;state.wounded=true;state.sendFree=1;state.gestures=gestureCap();persist();enterCamp();};
  document.getElementById("wipe").onclick=()=>{localStorage.removeItem(SAVE_KEY);location.reload();};
  document.getElementById("copyReport").onclick=async()=>{
    try{await navigator.clipboard.writeText(reportText());document.getElementById("copyReport").textContent="Report copied";}
    catch{alert(reportText());}
  };
  note("open");
  renderTraits();
  if(load()&&state.traits.length===3){applyDawn(false);enterCamp();}else show("splash");
}
bind();
