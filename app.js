const LINES={
  pointe:{name:"Point",skills:[
    {id:"ligne",name:"Line",role:"cut",dmg:14,hint:"Lunge now"},
    {id:"mesure",name:"Measure",role:"read",dmg:0,hint:"See the tell"},
    {id:"ouverture",name:"Opening",role:"kill",dmg:26,hint:"Punish a miss"}
  ]},
  taille:{name:"Edge",skills:[
    {id:"passage",name:"Passage",role:"cut",dmg:16,hint:"Lunge now"},
    {id:"pression",name:"Pressure",role:"read",dmg:4,hint:"See the tell"},
    {id:"rupture",name:"Rupture",role:"kill",dmg:28,hint:"Punish a miss"}
  ]},
  garde:{name:"Guard",skills:[
    {id:"plaque",name:"Plate",role:"read",dmg:2,hint:"Eat and hold"},
    {id:"rendre",name:"Return",role:"cut",dmg:15,hint:"Riposte"},
    {id:"epuisement",name:"Drain",role:"kill",dmg:22,hint:"Punish a miss"}
  ]}
};
const BOTS=[
  {name:"Newsteel",lineage:"pointe",tell:"Line coming.",bias:"cut"},
  {name:"Mist",lineage:"pointe",tell:"Holds measure.",bias:"read"},
  {name:"Fang",lineage:"taille",tell:"Edge loads.",bias:"kill"},
  {name:"Halt",lineage:"garde",tell:"Plate up.",bias:"read"},
  {name:"Wake",lineage:"taille",tell:"Pressure.",bias:"cut"},
  {name:"Duelle",lineage:"pointe",tell:"Looks for blood.",bias:"kill"},
  {name:"Mass",lineage:"garde",tell:"Takes the yard.",bias:"read"},
  {name:"Black Estoc",lineage:"pointe",tell:"Reads you.",bias:"cut"}
];
const SUGGEST={pointe:"Linen",taille:"Cinder",garde:"Somme"};
const SAVE="estoc.v6";
const WINDOW=850;

const state={
  lineage:"pointe",name:"Linen",ladder:0,wins:0,losses:0,
  hp:100,foe:100,time:90,live:false,windowOpen:false,pending:null,answered:false
};
let tick=null,tellTimer=null,ctx=null;

function save(){
  localStorage.setItem(SAVE,JSON.stringify({
    lineage:state.lineage,name:state.name,ladder:state.ladder,wins:state.wins,losses:state.losses
  }));
}
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(SAVE)||"null");
    if(raw)Object.assign(state,raw);
  }catch{}
}
function show(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("on"));
  document.getElementById(id).classList.add("on");
}
function bot(){return BOTS[Math.min(state.ladder,BOTS.length-1)];}
function skills(){return LINES[state.lineage].skills;}
function setMask(el,line){
  if(!el)return;
  const size=el.classList.contains("big")?"big":el.classList.contains("mini")?"mini":"mid";
  el.className="mask "+size+" "+line;
}
function beep(freq,ms,type){
  try{
    ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type||"square";o.frequency.value=freq;
    g.gain.value=0.05;o.connect(g);g.connect(ctx.destination);
    o.start();setTimeout(()=>o.stop(),ms||90);
  }catch{}
}
function fmt(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function float(n,good){
  const el=document.getElementById("floater");
  el.textContent=(good?"−":"") + n;
  el.className="floater on "+(good?"good":"bad");
  setTimeout(()=>el.classList.remove("on"),600);
}
function paint(){
  document.getElementById("youHpn").textContent=Math.max(0,Math.round(state.hp));
  document.getElementById("foeHpn").textContent=Math.max(0,Math.round(state.foe));
  document.getElementById("youHp").style.width=Math.max(0,state.hp)+"%";
  document.getElementById("foeHp").style.width=Math.max(0,state.foe)+"%";
  document.getElementById("timer").textContent=fmt(state.time);
}
function say(text,cls){
  const el=document.getElementById("tell");
  el.textContent=text;
  el.className="tell "+(cls||"");
}
function lunge(who){
  const el=document.getElementById(who==="you"?"youFig":"foeFig");
  el.classList.add("lunge");
  setTimeout(()=>el.classList.remove("lunge"),160);
}
function yardFlash(hurt){
  const y=document.getElementById("yard");
  y.classList.remove("flash","hurt");
  void y.offsetWidth;
  y.classList.add(hurt?"hurt":"flash");
}

function startFight(){
  const b=bot(),L=LINES[state.lineage];
  state.hp=100;state.foe=100;state.time=90;state.live=true;state.windowOpen=false;state.pending=null;
  document.getElementById("youLabel").textContent=state.name;
  document.getElementById("foeLabel").textContent=b.name;
  setMask(document.getElementById("youMask"),state.lineage);
  setMask(document.getElementById("foeMask"),b.lineage);
  document.getElementById("skills").innerHTML=L.skills.map(s=>`<button data-s="${s.id}">${s.name}<small>${s.hint}</small></button>`).join("");
  document.getElementById("skills").querySelectorAll("button").forEach(btn=>btn.onclick=()=>answer(btn.dataset.s));
  paint();
  say("Watch the mask.");
  show("duel");
  clearInterval(tick);clearTimeout(tellTimer);
  tick=setInterval(()=>{
    if(!state.live)return;
    state.time-=1;
    document.getElementById("timer").textContent=fmt(state.time);
    if(state.time<=0)end(state.hp>=state.foe);
  },1000);
  setTimeout(openTell,600);
  beep(220,80);
}
function pickBotSkill(){
  const b=bot();
  const list=LINES[b.lineage].skills;
  const want=list.find(s=>s.role===b.bias);
  if(want&&Math.random()<0.7)return want;
  return list[Math.floor(Math.random()*list.length)];
}
function openTell(){
  if(!state.live)return;
  const incoming=pickBotSkill();
  state.pending=incoming;
  state.windowOpen=true;
  state.answered=false;
  say(bot().name+": "+incoming.name+".",incoming.role==="kill"?"danger":"");
  const bar=document.getElementById("windowBar");
  const win=document.querySelector(".window");
  const box=document.getElementById("skills");
  win.classList.remove("live");bar.style.transition="none";bar.style.width="0";
  void bar.offsetWidth;
  bar.style.transition="";win.classList.add("live");
  box.classList.add("hot");
  beep(incoming.role==="kill"?160:320,70);
  clearTimeout(tellTimer);
  tellTimer=setTimeout(()=>{
    if(!state.live||state.answered)return;
    resolve(null,incoming);
  },WINDOW);
}
function answer(id){
  if(!state.live)return;
  const mine=skills().find(s=>s.id===id);
  if(!mine)return;
  if(state.windowOpen&&!state.answered){
    state.answered=true;
    state.windowOpen=false;
    document.querySelector(".window").classList.remove("live");
    document.getElementById("skills").classList.remove("hot");
    resolve(mine,state.pending);
    return;
  }
  if(!state.windowOpen){
    resolve(mine,null);
  }
}
function resolve(mine,theirs){
  state.windowOpen=false;
  document.getElementById("skills").classList.remove("hot");
  document.querySelector(".window").classList.remove("live");
  let dmgYou=0,dmgFoe=0,line="";
  if(!mine&&theirs){
    dmgYou=theirs.role==="kill"?22:theirs.role==="cut"?14:6;
    line=bot().name+" lands "+theirs.name+".";
    lunge("foe");yardFlash(true);beep(110,140);float(dmgYou,false);
  }else if(mine&&!theirs){
    if(mine.role==="read"){line="You hold. Nothing there.";beep(200,60);}
    else{
      dmgFoe=Math.floor(mine.dmg*0.45);
      line="Too early. Cheap "+mine.name+".";
      lunge("you");yardFlash(false);beep(260,70);float(dmgFoe,true);
    }
  }else{
    const ok=(mine.role==="read"&&theirs.role!=="read")||(mine.role==="kill"&&theirs.role==="read")||(mine.role==="cut"&&theirs.role==="cut");
    const great=mine.role==="read"&&theirs.role==="kill"||mine.role==="kill"&&theirs.role==="read";
    if(great){
      dmgFoe=mine.dmg;
      line="Clean. "+mine.name+" through "+theirs.name+".";
      lunge("you");yardFlash(false);beep(520,90,"triangle");float(dmgFoe,true);
    }else if(ok){
      dmgFoe=Math.floor(mine.dmg*0.75);
      dmgYou=theirs.role==="cut"?7:3;
      line=mine.name+" meets "+theirs.name+".";
      lunge("you");lunge("foe");yardFlash(false);beep(400,80);float(dmgFoe,true);
    }else{
      dmgYou=theirs.role==="kill"?18:theirs.role==="cut"?12:5;
      dmgFoe=mine.role==="cut"?5:0;
      line="Late. "+theirs.name+" hits.";
      lunge("foe");yardFlash(true);beep(130,120);float(dmgYou,false);
    }
  }
  state.hp=Math.max(0,state.hp-dmgYou);
  state.foe=Math.max(0,state.foe-dmgFoe);
  say(line,dmgFoe>dmgYou?"good":dmgYou?"danger":"");
  paint();
  if(navigator.vibrate)navigator.vibrate(dmgYou>10?40:12);
  if(state.hp<=0||state.foe<=0){end(state.foe<=0&&state.hp>=state.foe);return;}
  tellTimer=setTimeout(openTell,700+Math.random()*500);
}
function end(win){
  state.live=false;
  clearInterval(tick);clearTimeout(tellTimer);
  if(win){state.wins+=1;if(state.ladder<BOTS.length-1)state.ladder+=1;}
  else state.losses+=1;
  save();
  document.getElementById("resTitle").textContent=win?"Victory":"Defeat";
  document.getElementById("resLine").textContent=win?(bot().name+" drops. Next steel is waiting."):(bot().name+" is still standing. Read the tell.");
  document.getElementById("fightAgain").textContent=win?"Fight "+bot().name:"Fight again";
  beep(win?660:140,180,win?"triangle":"sawtooth");
  show("result");
}
function enterCamp(){
  const L=LINES[state.lineage];
  setMask(document.getElementById("campMask"),state.lineage);
  document.getElementById("campName").textContent=state.name;
  document.getElementById("campMeta").textContent=L.name;
  document.getElementById("campRecord").textContent=state.wins+"–"+state.losses;
  document.getElementById("campStreak").textContent="vs "+bot().name;
  document.getElementById("campLine").textContent=state.wins?"Again.":"The mask is waiting.";
  show("camp");
}
function bind(){
  load();
  document.getElementById("playNow").onclick=()=>{
    if(ctx&&ctx.resume)ctx.resume();
    startFight();
  };
  document.getElementById("toCreate").onclick=()=>show("create");
  document.getElementById("enter").onclick=()=>{
    state.name=document.getElementById("name").value.slice(0,12)||SUGGEST[state.lineage];
    save();startFight();
  };
  document.querySelectorAll(".pick").forEach(c=>c.onclick=()=>{
    document.querySelectorAll(".pick").forEach(x=>x.classList.remove("on"));
    c.classList.add("on");
    state.lineage=c.dataset.line;
    state.name=SUGGEST[state.lineage];
    document.getElementById("name").value=state.name;
  });
  document.getElementById("fightAgain").onclick=()=>startFight();
  document.getElementById("toCamp").onclick=()=>enterCamp();
  document.getElementById("sendBtn").onclick=()=>startFight();
}
bind();
