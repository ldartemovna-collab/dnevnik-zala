"use strict";
var IS_ARTIFACT = false;
var PLATES = ["--p-red","--p-blue","--p-yellow","--p-green","--p-grey"];
var KINDS = {
  heavy:{name:"Тяжёлое",short:"Тяж.",rest:150},
  mid:{name:"Среднее",short:"Сред.",rest:120},
  iso:{name:"Изоляция",short:"Изол.",rest:75},
  core:{name:"Пресс / икры",short:"Лёгк.",rest:45}
};
var KIND_ORDER = ["heavy","mid","iso","core"];
var MODES = {w:{name:"С весом",short:"кг"},bw:{name:"Без веса",short:"без веса"},time:{name:"На время",short:"сек"}};
var MODE_ORDER = ["w","bw","time"];
var MUSCLES = {quads:"Квадрицепс",glutes:"Ягодицы",hams:"Задняя поверхность бедра",hips:"Внешняя и внутренняя часть бедра",back:"Спина",chest:"Грудь",shoulders:"Плечи",biceps:"Бицепс",triceps:"Трицепс",calves:"Икры",abs:"Пресс"};
var ACCENTS = [["blue","Синий"],["pink","Розовый"],["violet","Фиолетовый"],["green","Зелёный"],["orange","Оранжевый"]];

/* ---------- библиотека упражнений ---------- */
/* [id, название, тип, мышца (если отличается от группы), нагрузка на поясницу] */
function G(id,name,muscle,ex){return {id:id,name:name,muscle:muscle,ex:ex.map(function(e){var o={id:e[0],name:e[1],kind:e[2]||"mid"};if(e[3])o.muscle=e[3];if(e[4])o.backRisk=true;if(e[5])o.mode=e[5];return o;})};}
var DEFAULT_GROUPS = [
  G("q","Квадрицепс","quads",[["q1","Жим ногами","heavy"],["q2","Разгибание ног","iso"],["q3","Зашагивания","mid"],["q4","Болгарские сплит-приседания","mid"],["q5","Выпады назад с гантелями","mid"],["q6","Гоблет-присед","mid",null,1],["q7","Гакк-приседания","heavy",null,1],["q8","Приседания со штангой","heavy",null,1]]),
  G("g","Ягодицы","glutes",[["g1","Ягодичный мост","mid"],["g2","Гиперэкстензия","mid",null,0,"bw"],["g3","Отведение ноги назад","iso"],["g4","Хип-траст со штангой","heavy"],["g5","Мост на одной ноге","iso",null,0,"bw"]]),
  G("h","Задняя поверхность бедра","hams",[["h1","Сгибание ног","iso"],["h2","Румынская тяга","heavy",null,1],["h3","Становая тяга","heavy",null,1]]),
  G("l","Ноги, дополнительно","hips",[["l1","Отведение бёдер","iso"],["l2","Сведение бёдер","iso"]]),
  G("b","Спина","back",[["b1","Тяга верхнего блока","mid"],["b2","Рычажная тяга","mid"],["b3","Тяга гантели одной рукой","mid"],["b4","Тяга штанги в наклоне","heavy",null,1],["b5","Тяга горизонтального блока","mid"],["b6","Подтягивания в гравитроне","mid"],["b7","Пуловер на верхнем блоке","iso"]]),
  G("c","Грудь","chest",[["c1","Жим гантелей","mid"],["c2","Бабочка","iso"],["c3","Разводка гантелей","iso"],["c4","Отжимания","mid",null,0,"bw"],["c5","Жим гантелей на наклонной","mid"],["c6","Жим штанги лёжа","heavy"],["c7","Жим в тренажёре сидя","mid"]]),
  G("s","Плечи","shoulders",[["s1","Армейский жим","heavy",null,1],["s2","Жим гантелей сидя","mid"],["s3","Махи в стороны","iso"],["s4","Отведение на блоке","iso"],["s5","Обратная бабочка","iso"],["s6","Тяга каната к лицу","iso"]]),
  G("m","Мини-блок","triceps",[["m1","Трицепс","iso","triceps"],["m2","Икры","core","calves"],["m3","Пресс","core","abs",0,"bw"]]),
  G("bi","Бицепс","biceps",[["bi1","Сгибания с гантелями сидя","iso"],["bi2","Молотки","iso"],["bi3","Сгибания на скамье Скотта","iso"],["bi4","Сгибания на нижнем блоке","iso"]]),
  G("tr","Трицепс","triceps",[["tr1","Разгибания на верхнем блоке","iso"],["tr2","Французский жим с гантелями","iso"],["tr3","Разгибание гантели из-за головы","iso"],["tr4","Отжимания узким хватом","mid",null,0,"bw"]]),
  G("ca","Икры","calves",[["ca1","Подъёмы на носки сидя","core"],["ca2","Подъёмы на носки в тренажёре","core"],["ca3","Подъёмы на носки на одной ноге","core"]]),
  G("ab","Пресс","abs",[["ab1","Планка","core",null,0,"time"],["ab2","Боковая планка","core",null,0,"time"],["ab3","Мёртвый жук","core",null,0,"bw"],["ab4","Паллоф-пресс","core"],["ab5","Скручивания","core",null,0,"bw"],["ab6","Подъём коленей в упоре","core",null,0,"bw"]])
];
function P(id,name,slots,reps){var p={id:id,name:name,slots:slots.map(function(s){var o={gid:s[0],count:s[1]||1};if(s[2])o.pref=s[2];return o;})};if(reps)p.reps=reps;return p;}
var DEFAULT_PROGRAMS = [
  P("p_full","Фулбади",[["q"],["g"],["h"],["l"],["b"],["c"],["s"],["m",3]]),
  P("p_up","Верх",[["b",2],["c"],["s"],["bi"],["tr"]]),
  P("p_low","Низ",[["q"],["g"],["h"],["l"],["ca"],["ab"]])
];
function defaultConfig(){
  return fillDefaults({version:3,settings:{repLo:10,repHi:12,sets:3,weekGoal:2,accent:"blue",theme:"auto"},groups:clone(DEFAULT_GROUPS),programs:clone(DEFAULT_PROGRAMS),lastProgram:"p_full",onboarded:false});
}

/* ---------- миграция ---------- */
function migrate(cfg){
  if(!cfg||!cfg.groups)return defaultConfig();
  cfg=clone(cfg);
  if(!(cfg.version>=2&&cfg.programs)){
    var old=cfg.groups.slice();
    var fullSlots=old.filter(function(g){return !g.archived;}).map(function(g){return {gid:g.id,count:g.multi>0?g.multi:1};});
    old.forEach(function(g){delete g.multi;});
    cfg.groups=old;
    var progs=clone(DEFAULT_PROGRAMS);progs[0].slots=fullSlots;
    cfg.programs=progs;cfg.lastProgram="p_full";
  }
  if(!(cfg.version>=3))cfg.onboarded=true;
  return fillDefaults(cfg);
}
function fillDefaults(cfg){
  var defG={},defE={};
  DEFAULT_GROUPS.forEach(function(g){defG[g.id]=g;g.ex.forEach(function(e){defE[e.id]=e;});});
  DEFAULT_GROUPS.forEach(function(dg){if(!cfg.groups.some(function(g){return g.id===dg.id;}))cfg.groups.push(clone(dg));});
  cfg.groups.forEach(function(g){
    if(g.muscle===undefined)g.muscle=defG[g.id]?defG[g.id].muscle:null;
    g.ex.forEach(function(e){
      var d=defE[e.id];
      if(!e.kind)e.kind=d?d.kind:"mid";
      if(e.muscle===undefined&&d&&d.muscle)e.muscle=d.muscle;
      if(e.backRisk===undefined&&d&&d.backRisk)e.backRisk=true;
      if(e.mode===undefined&&d&&d.mode)e.mode=d.mode;
    });
  });
  var s=cfg.settings=cfg.settings||{};
  if(!(s.repLo>0))s.repLo=10;if(!(s.repHi>=s.repLo))s.repHi=Math.max(s.repLo,12);if(!(s.sets>0))s.sets=3;
  if(!(s.weekGoal>0))s.weekGoal=2;if(!s.accent)s.accent="blue";if(!s.theme)s.theme="auto";
  cfg.goals=cfg.goals||{};
  cfg.restLearn=cfg.restLearn||{};
  if(cfg.seenAch===undefined)cfg.seenAch=null;
  if(cfg.plan===undefined)cfg.plan=null;
  cfg.version=3;
  return cfg;
}

/* ---------- утилиты ---------- */
function clone(o){return JSON.parse(JSON.stringify(o));}
function uid(p){return p+Date.now().toString(36)+Math.floor(Math.random()*1e5).toString(36);}
function pad(n){return (n<10?"0":"")+n;}
function isoOf(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function todayIso(){return isoOf(new Date());}
function dateObj(iso){var p=iso.split("-");return new Date(+p[0],+p[1]-1,+p[2],12);}
function shiftIso(iso,days){var d=dateObj(iso);d.setDate(d.getDate()+days);return isoOf(d);}
function daysBetween(a,b){return Math.round((dateObj(b)-dateObj(a))/864e5);}
function mondayOf(iso){var d=dateObj(iso);var wd=(d.getDay()+6)%7;d.setDate(d.getDate()-wd);return isoOf(d);}
function fmtDate(iso,withWd){var d=dateObj(iso);var s=d.toLocaleDateString("ru-RU",{day:"numeric",month:"short"}).replace(".","");if(withWd)s=d.toLocaleDateString("ru-RU",{weekday:"short"})+", "+s;return s;}
function fmtDateLong(iso){return dateObj(iso).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"}).replace(" г.","");}
function fmtNum(n){if(n===null||n===undefined||n==="")return "";return String(Math.round(n*100)/100).replace(".",",");}
function fmtBig(n){return Math.round(n).toLocaleString("ru-RU").replace(/,/g," ");}
function fmtDur(ms){var m=Math.max(0,Math.round(ms/60000));var h=Math.floor(m/60);return h?h+" ч "+pad(m%60)+" мин":m+" мин";}
function fmtClock(sec){sec=Math.max(0,Math.round(sec));var h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return (h?h+":"+pad(m):m)+":"+pad(s);}
function parseNum(s){s=String(s).trim().replace(",",".");if(s==="")return null;var n=parseFloat(s);return isFinite(n)?n:null;}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function plural(n,a,b,c){n=Math.abs(n)%100;var n1=n%10;if(n>10&&n<20)return c;if(n1>1&&n1<5)return b;if(n1===1)return a;return c;}

/* ---------- состояние ---------- */
var state = {
  config: defaultConfig(), workouts: {}, date: todayIso(), draft: null, dirty: 0,
  tab: "workout", progEx: null, confirm: null, msg: null, pendingImport: null, mode: "local",
  calMonth: null, cmpMonths: 1, editNote: null, swap: null, ssPick: null, modal: null, openGroup: null, libTab: "programs"
};
function cfg(){return state.config;}
function settings(){return state.config.settings;}

/* Повторы и подходы: план на месяц → программа → общие настройки */
function repsFor(programId,date){
  var s=settings(),r={lo:s.repLo,hi:s.repHi,sets:s.sets,load:1,label:null};
  var p=program(programId);
  if(p&&p.reps){r.lo=p.reps.lo;r.hi=p.reps.hi;r.sets=p.reps.sets;}
  var pw=planWeek(date||state.date);
  if(pw){r.lo=pw.week.lo;r.hi=pw.week.hi;r.sets=pw.week.sets;r.load=pw.week.load||1;r.label=pw.week.label;}
  return r;
}
function curReps(){return repsFor(state.draft&&state.draft.programId,state.date);}

/* ---------- хранение ---------- */
var LS_KEY = "trenlog.v1";
var store = {
  col:null, chains:{},
  loadLocal:function(){
    try{var raw=localStorage.getItem(LS_KEY);if(raw){var d=JSON.parse(raw);if(d.config&&d.config.groups)state.config=migrate(d.config);state.workouts=d.workouts||{};}}catch(e){}
  },
  saveLocal:function(){try{localStorage.setItem(LS_KEY,JSON.stringify({config:state.config,workouts:state.workouts}));}catch(e){}},
  write:function(key,fn){var prev=store.chains[key]||Promise.resolve();var next=prev.then(fn,fn);store.chains[key]=next.catch(function(){});return next;},
  saveConfig:function(){
    if(store.col){setStatus("saving");return store.write("config",function(){return store.col.doc("config").set({kind:"config",config:clone(state.config)});}).then(function(){setStatus("ok");},onWriteErr);}
    store.saveLocal();setStatus("ok");return Promise.resolve();
  },
  saveWorkout:function(w){
    var id="w_"+w.date;
    if(store.col){setStatus("saving");return store.write(id,function(){
      if(!w.entries.length)return store.col.doc(id).delete();
      var body=clone(w);body.kind="workout";return store.col.doc(id).set(body);
    }).then(function(){setStatus("ok");},onWriteErr);}
    store.saveLocal();setStatus("ok");return Promise.resolve();
  },
  replaceAll:function(){
    if(!store.col){store.saveLocal();return Promise.resolve();}
    var self=this;
    return store.col.get().then(function(snap){
      var keep={};Object.keys(state.workouts).forEach(function(d){keep["w_"+d]=true;});
      return Promise.all(snap.docs.filter(function(d){return d.id!=="config"&&!keep[d.id];}).map(function(d){return store.col.doc(d.id).delete();}));
    }).then(function(){
      var p=self.saveConfig();
      Object.keys(state.workouts).forEach(function(d){p=p.then(function(){return self.saveWorkout(state.workouts[d]);});});
      return p;
    });
  }
};
function onWriteErr(e){setStatus("err",e&&e.code==="quota_exceeded"?"Место закончилось":"Не сохранилось, повторю при следующем изменении");}
function setStatus(kind,text){
  var el=document.getElementById("status");if(!el)return;
  el.className="status"+(kind==="ok"?" ok":"");
  el.textContent=kind==="saving"?"Сохраняю…":kind==="ok"?"Сохранено ✓":(text||"");
}

/* ---------- данные ---------- */
function groups(){return state.config.groups;}
function liveGroups(){return groups().filter(function(g){return !g.archived;});}
function group(id){return groups().filter(function(g){return g.id===id;})[0]||null;}
function programs(){return state.config.programs.filter(function(p){return !p.archived;});}
function program(id){return state.config.programs.filter(function(p){return p.id===id;})[0]||null;}
function findEx(id){var gs=groups();for(var i=0;i<gs.length;i++){for(var j=0;j<gs[i].ex.length;j++){if(gs[i].ex[j].id===id)return {g:gs[i],e:gs[i].ex[j]};}}return null;}
function exName(id){var f=findEx(id);return f?f.e.name:"Упражнение удалено";}
function exKind(id){var f=findEx(id);return f&&KINDS[f.e.kind]?f.e.kind:"mid";}
function exMode(id){var f=findEx(id);return f&&MODES[f.e.mode]?f.e.mode:"w";}
function fmtSet(exId,w,r){if(exMode(exId)==="time")return r+" сек";return (w?fmtNum(w)+" кг × ":"")+r;}
/* Упражнения без веса, по которым раньше записывали вес, оставляем «с весом» */
function fixModesByHistory(){
  if(state.config.modesChecked)return;
  var weighted={};sortedDates().forEach(function(d){state.workouts[d].entries.forEach(function(en){if(workSets(en).some(function(s){return s.w>0;}))weighted[en.exId]=1;});});
  groups().forEach(function(g){g.ex.forEach(function(e){if(e.mode&&e.mode!=="w"&&weighted[e.id])e.mode="w";});});
  state.config.modesChecked=true;state.cfgDirty=true;
}
function exMuscle(id){var f=findEx(id);if(!f)return null;return f.e.muscle||f.g.muscle||null;}
function workSets(entry){return (entry.sets||[]).filter(function(s){return !s.wu&&s.r>0;});}
function sortedDates(){return Object.keys(state.workouts).sort();}
function doneEntries(w){return (w.entries||[]).filter(function(en){return workSets(en).length>0;});}
function isWorkoutDone(w){return doneEntries(w).length>0;}
function programName(id){var p=program(id);return p?p.name:"";}
function entryTop(en){var ws=workSets(en);if(!ws.length)return null;var top=Math.max.apply(null,ws.map(function(s){return s.w||0;}));var reps=Math.max.apply(null,ws.filter(function(s){return (s.w||0)===top;}).map(function(s){return s.r;}));return {w:top,r:reps};}
function better(a,b){if(!b)return true;if(!a)return false;return a.w>b.w||(a.w===b.w&&a.r>b.r);}

function lastSession(exId,before){
  var ds=sortedDates();
  for(var i=ds.length-1;i>=0;i--){
    if(ds[i]>=before)continue;
    var w=state.workouts[ds[i]];
    for(var j=0;j<w.entries.length;j++){var en=w.entries[j];if(en.exId===exId&&workSets(en).length)return {date:ds[i],entry:en};}
  }
  return null;
}
function bestBefore(exId,before){
  var best=null;
  sortedDates().forEach(function(d){if(d>=before)return;state.workouts[d].entries.forEach(function(en){if(en.exId!==exId)return;workSets(en).forEach(function(s){var c={w:s.w||0,r:s.r};if(better(c,best))best=c;});});});
  return best;
}
function workoutRecords(w){
  var out=[];
  doneEntries(w).forEach(function(en){
    var prev=bestBefore(en.exId,w.date);if(!prev)return;
    var top=null;workSets(en).forEach(function(s){var c={w:s.w||0,r:s.r};if(better(c,top))top=c;});
    if(better(top,prev)&&(top.w!==prev.w||top.r!==prev.r))out.push({exId:en.exId,w:top.w,r:top.r,prev:prev});
  });
  return out;
}
function tonnage(w){var t=0;(w.entries||[]).forEach(function(en){workSets(en).forEach(function(s){t+=(s.w||0)*s.r;});});return t;}
function setsCount(w){var n=0;(w.entries||[]).forEach(function(en){n+=workSets(en).length;});return n;}
function workoutDuration(w){
  if(!w.startedAt)return null;
  var end=w.finishedAt||w.lastAt;if(!end||end<=w.startedAt)return null;
  return end-w.startedAt;
}
function stepFor(w){return w<10?1:2.5;}
function roundW(w){var st=stepFor(w);return Math.round(w/st)*st;}
function recommend(exId,date){
  var last=lastSession(exId,date);
  var R=curReps();
  if(!last)return {type:"new",R:R};
  var ws=workSets(last.entry);
  var mode=exMode(exId);
  if(mode==="time"){var best=Math.max.apply(null,ws.map(function(s){return s.r;}));return {type:"up",time:true,target:best+5,last:last,R:R};}
  var top=mode==="bw"?0:Math.max.apply(null,ws.map(function(s){return s.w||0;}));
  var allTop=ws.every(function(s){return s.r>=R.hi;});
  var res;
  if(top<=0)res={type:allTop?"up":"hold",w:0,bw:true,last:last};
  else if(allTop)res={type:"up",w:Math.round((top+stepFor(top))*100)/100,last:last};
  else res={type:"hold",w:top,last:last};
  if(R.load<1&&res.w>0){res.type="deload";res.w=roundW(res.w*R.load);}
  res.R=R;
  return res;
}
function setsText(entry){
  var ws=workSets(entry);if(!ws.length)return "";
  var mode=exMode(entry.exId);
  if(mode==="time")return ws.map(function(s){return s.r;}).join(", ")+" сек";
  if(mode==="bw")return ws.map(function(s){return s.r;}).join(", ")+" раз";
  var sameW=ws.every(function(s){return s.w===ws[0].w;});
  if(sameW)return (ws[0].w?fmtNum(ws[0].w)+" кг × ":"")+ws.map(function(s){return s.r;}).join(", ");
  return ws.map(function(s){return (s.w?fmtNum(s.w)+"×":"")+s.r;}).join(", ");
}
function newEntry(gid,exId){
  var rec=recommend(exId,state.date);
  var w=(exMode(exId)==="w"&&rec.w!==undefined&&rec.w>0)?rec.w:null;
  var sets=[];for(var i=0;i<rec.R.sets;i++)sets.push({w:w,r:null});
  return {gid:gid,exId:exId,sets:sets};
}
function entryDone(en){return workSets(en).length>0;}
function groupDone(gid){return state.draft.entries.some(function(en){return en.gid===gid&&entryDone(en);});}
function currentSlots(){
  var p=program(state.draft.programId);
  var slots=p?p.slots.filter(function(s){var g=group(s.gid);return g&&!g.archived;}).map(function(s){return {gid:s.gid,count:s.count,pref:s.pref||null};}):[];
  state.draft.entries.forEach(function(en){
    if(!slots.some(function(s){return s.gid===en.gid;})&&group(en.gid))slots.push({gid:en.gid,count:1,extra:true});
  });
  slots.forEach(function(s){var n=state.draft.entries.filter(function(en){return en.gid===s.gid;}).length;if(n>s.count)s.count=n;});
  return slots;
}
/* Следующая тренировка по очереди: после последней сделанной программы */
function nextProgramId(before){
  var ps=programs();if(!ps.length)return null;
  var ds=sortedDates().filter(function(d){return d<before&&isWorkoutDone(state.workouts[d])&&state.workouts[d].programId;});
  if(!ds.length){var lp=state.config.lastProgram;return (lp&&program(lp)&&!program(lp).archived)?lp:ps[0].id;}
  var lastPid=state.workouts[ds[ds.length-1]].programId;
  var idx=-1;ps.forEach(function(p,i){if(p.id===lastPid)idx=i;});
  return ps[(idx+1)%ps.length].id;
}
