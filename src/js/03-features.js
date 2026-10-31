/* ---------- звук, вибрация, экран ---------- */
var audioCtx=null;
function unlockAudio(){try{if(!audioCtx){var AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtx=new AC();}if(audioCtx&&audioCtx.state==="suspended")audioCtx.resume();}catch(e){}}
function beep(){
  try{if(!audioCtx)return;var t=audioCtx.currentTime;
    [0,0.22,0.44].forEach(function(o,i){var os=audioCtx.createOscillator(),g=audioCtx.createGain();os.type="sine";os.frequency.value=i===2?1175:880;
      g.gain.setValueAtTime(0.0001,t+o);g.gain.exponentialRampToValueAtTime(0.35,t+o+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+o+0.18);
      os.connect(g);g.connect(audioCtx.destination);os.start(t+o);os.stop(t+o+0.2);});
  }catch(e){}
}
function buzz(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
var wakeLock=null;
function keepAwake(on){
  try{
    if(on&&!wakeLock&&navigator.wakeLock&&document.visibilityState==="visible"){navigator.wakeLock.request("screen").then(function(l){wakeLock=l;l.addEventListener("release",function(){wakeLock=null;});}).catch(function(){});}
    if(!on&&wakeLock){wakeLock.release();wakeLock=null;}
  }catch(e){}
}

/* ---------- уведомления ---------- */
var toastQ=[],toastBusy=false;
function toast(html,kind){toastQ.push({html:html,kind:kind||""});if(!toastBusy)nextToast();}
function nextToast(){
  var el=document.getElementById("toast");var t=toastQ.shift();
  if(!t){toastBusy=false;el.hidden=true;return;}
  toastBusy=true;el.className="toast "+t.kind;el.innerHTML=t.html;el.hidden=false;
  setTimeout(function(){el.hidden=true;setTimeout(nextToast,200);},t.kind==="gold"?3600:2600);
}

/* ---------- конфетти ---------- */
function confetti(){
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var c=document.createElement("canvas");c.className="confetti";document.body.appendChild(c);
  var dpr=window.devicePixelRatio||1,W=window.innerWidth,H=window.innerHeight;c.width=W*dpr;c.height=H*dpr;
  var x=c.getContext("2d");x.scale(dpr,dpr);
  var cs=getComputedStyle(document.documentElement);
  var cols=[cs.getPropertyValue("--accent"),"#f2b705","#e5484d","#30a46c","#8e4ec6","#ffffff"].map(function(s){return s.trim()||"#f2b705";});
  var ps=[];for(var i=0;i<140;i++)ps.push({x:W/2+(Math.random()-0.5)*80,y:H*0.35,vx:(Math.random()-0.5)*13,vy:-Math.random()*13-4,s:4+Math.random()*6,r:Math.random()*6,vr:(Math.random()-0.5)*0.4,c:cols[i%cols.length]});
  var t0=performance.now();
  (function f(now){var el=(now-t0)/1000;x.clearRect(0,0,W,H);
    ps.forEach(function(p){p.vy+=0.38;p.vx*=0.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.globalAlpha=Math.max(0,1-el/2.2);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore();});
    if(el<2.3)requestAnimationFrame(f);else c.remove();})(t0);
}

/* ---------- таймер отдыха ---------- */
var rest={endAt:0,total:0,running:false,done:false,label:"",timer:null,hideAt:0};
function suggestedRest(exId,set){
  var R=curReps();
  var learned=state.config.restLearn[exId];
  var base=learned||KINDS[exKind(exId)].rest;
  var why="";
  if(set&&set.r>0&&exMode(exId)!=="time"){
    if(set.r<R.lo){base+=30;why="тяжёлый подход +30 с";}
    else if(set.r>R.hi){base-=15;why="легко −15 с";}
  }
  if(R.load<1)base=Math.min(base,90);
  base=Math.max(30,Math.min(300,Math.round(base/5)*5));
  return {sec:base,why:why,learned:!!learned};
}
function learnRest(exId,en,i){
  if(i<1)return;
  var a=en.sets[i-1],b=en.sets[i];
  if(!a||!b||!a.t||!b.t)return;
  var actual=(b.t-a.t)/1000-35;
  if(actual<20||actual>420)return;
  var cur=state.config.restLearn[exId]||KINDS[exKind(exId)].rest;
  state.config.restLearn[exId]=Math.round((cur*0.7+actual*0.3)/5)*5;
  state.cfgDirty=true;
}
function startRest(sec,label){
  rest.total=sec;rest.endAt=Date.now()+sec*1000;rest.running=true;rest.done=false;rest.label=label;rest.hideAt=0;
  unlockAudio();renderRest();
  clearInterval(rest.timer);rest.timer=setInterval(tickRest,250);
}
function stopRest(){rest.running=false;rest.done=false;clearInterval(rest.timer);document.getElementById("restbar").hidden=true;document.body.classList.remove("has-rest");}
function tickRest(){
  if(!rest.running)return;
  var left=(rest.endAt-Date.now())/1000;
  if(left<=0&&!rest.done){rest.done=true;rest.hideAt=Date.now()+45000;buzz([350,150,350,150,500]);beep();}
  if(rest.done&&Date.now()>rest.hideAt){stopRest();return;}
  renderRest();
}
function renderRest(){
  var bar=document.getElementById("restbar");bar.hidden=false;document.body.classList.add("has-rest");
  var left=Math.max(0,(rest.endAt-Date.now())/1000);
  var frac=rest.total?left/rest.total:0;
  bar.classList.toggle("done",rest.done);
  document.getElementById("rbTime").textContent=rest.done?"0:00":fmtClock(Math.ceil(left));
  document.getElementById("rbTitle").textContent=rest.done?"Пора! Следующий подход":"Отдых";
  document.getElementById("rbWhat").textContent=rest.label;
  var c=document.getElementById("rbArc");var L=2*Math.PI*20;c.style.strokeDasharray=L;c.style.strokeDashoffset=L*(1-frac);
}

/* ---------- таймер тренировки ---------- */
var sessTimer=null;
function sessionActive(w){return w&&w.startedAt&&!w.finishedAt&&w.date===todayIso()&&(Date.now()-(w.lastAt||w.startedAt))<3*3600e3;}
function tickSession(){
  var el=document.getElementById("sessClock");if(!el)return;
  var w=state.draft;if(!sessionActive(w)){return;}
  el.textContent=fmtClock((Date.now()-w.startedAt)/1000);
}
function startSessionTicker(){clearInterval(sessTimer);sessTimer=setInterval(tickSession,1000);}

/* ---------- достижения ---------- */
var ACH = [
  {id:"first",ic:"🎉",name:"Первая тренировка",desc:"Записать первую тренировку",test:function(s){return s.count>=1;}},
  {id:"w5",ic:"💪",name:"5 тренировок",desc:"Провести 5 тренировок",test:function(s){return s.count>=5;},prog:function(s){return [s.count,5];}},
  {id:"w10",ic:"🔥",name:"10 тренировок",desc:"Провести 10 тренировок",test:function(s){return s.count>=10;},prog:function(s){return [s.count,10];}},
  {id:"w25",ic:"⭐",name:"25 тренировок",desc:"Провести 25 тренировок",test:function(s){return s.count>=25;},prog:function(s){return [s.count,25];}},
  {id:"w50",ic:"🏅",name:"50 тренировок",desc:"Провести 50 тренировок",test:function(s){return s.count>=50;},prog:function(s){return [s.count,50];}},
  {id:"w100",ic:"👑",name:"Сотка",desc:"Провести 100 тренировок",test:function(s){return s.count>=100;},prog:function(s){return [s.count,100];}},
  {id:"pr1",ic:"🏆",name:"Первый рекорд",desc:"Побить свой лучший результат",test:function(s){return s.records>=1;}},
  {id:"pr10",ic:"🚀",name:"10 рекордов",desc:"Побить свои рекорды 10 раз",test:function(s){return s.records>=10;},prog:function(s){return [s.records,10];}},
  {id:"pr50",ic:"💎",name:"50 рекордов",desc:"Побить свои рекорды 50 раз",test:function(s){return s.records>=50;},prog:function(s){return [s.records,50];}},
  {id:"ton1",ic:"🏋️",name:"Тонна",desc:"Поднять 1 000 кг за тренировку",test:function(s){return s.maxTon>=1000;},prog:function(s){return [Math.round(s.maxTon),1000];}},
  {id:"ton5",ic:"🦾",name:"Пять тонн",desc:"Поднять 5 000 кг за тренировку",test:function(s){return s.maxTon>=5000;},prog:function(s){return [Math.round(s.maxTon),5000];}},
  {id:"tot100",ic:"🗻",name:"100 тонн",desc:"Поднять 100 тонн за всё время",test:function(s){return s.totalTon>=100000;},prog:function(s){return [Math.round(s.totalTon/1000),100];}},
  {id:"st4",ic:"📅",name:"Месяц по плану",desc:"4 недели подряд выполнять цель по тренировкам",test:function(s){return s.maxStreak>=4;},prog:function(s){return [s.maxStreak,4];}},
  {id:"st12",ic:"🗓️",name:"Три месяца по плану",desc:"12 недель подряд выполнять цель",test:function(s){return s.maxStreak>=12;},prog:function(s){return [s.maxStreak,12];}},
  {id:"full",ic:"✅",name:"Всё по списку",desc:"Сделать все группы мышц тренировки",test:function(s){return s.fullDone;}},
  {id:"goal",ic:"🎯",name:"Цель взята",desc:"Достичь поставленной цели по весу",test:function(s){return s.goalsDone>=1;}},
  {id:"plan",ic:"📈",name:"План пройден",desc:"Пройти план на месяц до конца",test:function(s){return !!s.planDone;}},
  {id:"sets20",ic:"🧱",name:"Объёмная",desc:"Сделать 20 подходов за тренировку",test:function(s){return s.maxSets>=20;},prog:function(s){return [s.maxSets,20];}},
  {id:"wk3",ic:"⚡",name:"Три за неделю",desc:"Провести 3 тренировки за одну неделю",test:function(s){return s.maxWeek>=3;},prog:function(s){return [s.maxWeek,3];}},
  {id:"early",ic:"🌅",name:"Ранняя пташка",desc:"Начать тренировку до 8 утра",test:function(s){return s.early;}},
  {id:"owl",ic:"🦉",name:"Сова",desc:"Начать тренировку после 21:00",test:function(s){return s.owl;}}
];
function weekStats(){
  var goal=settings().weekGoal;var counts={};
  sortedDates().forEach(function(d){if(isWorkoutDone(state.workouts[d])){var k=mondayOf(d);counts[k]=(counts[k]||0)+1;}});
  var keys=Object.keys(counts).sort();
  var thisWeek=mondayOf(todayIso());
  var res={goal:goal,thisWeek:counts[thisWeek]||0,current:0,max:0};
  if(!keys.length)return res;
  var run=0,w=keys[0];
  while(w<=thisWeek){
    var n=counts[w]||0;
    if(n>=goal){run++;if(run>res.max)res.max=run;}
    else if(w!==thisWeek)run=0;
    w=shiftIso(w,7);
  }
  res.current=run;
  return res;
}
function allStats(){
  var s={count:0,records:0,maxTon:0,totalTon:0,fullDone:false,early:false,owl:false,goalsDone:0,maxSets:0,maxWeek:0};
  var perWeek={};
  sortedDates().forEach(function(d){
    var w=state.workouts[d];if(!isWorkoutDone(w))return;
    s.count++;var wk=mondayOf(d);perWeek[wk]=(perWeek[wk]||0)+1;if(perWeek[wk]>s.maxWeek)s.maxWeek=perWeek[wk];
    var sc=setsCount(w);if(sc>s.maxSets)s.maxSets=sc;
    var t=tonnage(w);s.totalTon+=t;if(t>s.maxTon)s.maxTon=t;
    s.records+=workoutRecords(w).length;
    var p=program(w.programId);
    if(p&&p.slots.length&&p.slots.every(function(sl){return w.entries.some(function(en){return en.gid===sl.gid&&entryDone(en);});}))s.fullDone=true;
    if(w.startedAt){var h=new Date(w.startedAt).getHours();if(h<8)s.early=true;if(h>=21)s.owl=true;}
  });
  var ws=weekStats();s.maxStreak=ws.max;
  Object.keys(state.config.goals).forEach(function(exId){var g=state.config.goals[exId];if(g.doneAt)s.goalsDone++;});
  s.planDone=state.config.planDone||false;
  return s;
}
function unlockedAch(){var s=allStats();return ACH.filter(function(a){return a.test(s);}).map(function(a){return a.id;});}
function checkAchievements(silent){
  var un=unlockedAch();
  if(state.config.seenAch===null){state.config.seenAch=un;state.cfgDirty=true;return [];}
  var fresh=un.filter(function(id){return state.config.seenAch.indexOf(id)<0;});
  if(fresh.length){
    state.config.seenAch=state.config.seenAch.concat(fresh);state.cfgDirty=true;
    if(!silent)fresh.forEach(function(id){var a=ACH.filter(function(x){return x.id===id;})[0];toast('<span class="big">'+a.ic+'</span><span><b>Новое достижение</b><br>'+esc(a.name)+'</span>',"gold");});
  }
  return fresh;
}
/* Цели: отмечаем достигнутые */
function checkGoals(){
  Object.keys(state.config.goals).forEach(function(exId){
    var g=state.config.goals[exId];if(g.doneAt)return;
    var h=exHistory(exId);if(!h.length)return;
    var cur=h[h.length-1].top;
    if(cur>=g.w){g.doneAt=h[h.length-1].date;state.cfgDirty=true;toast('<span class="big">🎯</span><span><b>Цель достигнута!</b><br>'+esc(exName(exId))+' — '+fmtNum(g.w)+' кг</span>',"gold");confetti();}
  });
}

/* ---------- история упражнения, прогноз, сравнение ---------- */
function exHistory(exId){
  var out=[];
  sortedDates().forEach(function(d){
    state.workouts[d].entries.forEach(function(en){
      if(en.exId!==exId)return;var t=entryTop(en);if(!t)return;
      out.push({date:d,entry:en,top:t.w,reps:t.r});
    });
  });
  return out;
}
function forecast(exId,goalW){
  var h=exHistory(exId).slice(-8);if(h.length<3)return null;
  var x0=h[0].date;var xs=h.map(function(p){return daysBetween(x0,p.date);}),ys=h.map(function(p){return p.top;});
  var n=xs.length,mx=xs.reduce(function(a,b){return a+b;})/n,my=ys.reduce(function(a,b){return a+b;})/n;
  var num=0,den=0;for(var i=0;i<n;i++){num+=(xs[i]-mx)*(ys[i]-my);den+=(xs[i]-mx)*(xs[i]-mx);}
  if(!den)return null;var slope=num/den;if(slope<=0.005)return {slope:slope,date:null};
  var cur=ys[n-1];var days=Math.ceil((goalW-cur)/slope);
  return {slope:slope,date:shiftIso(todayIso(),Math.max(0,days))};
}
function comparison(months){
  var cut=shiftIso(todayIso(),-Math.round(months*30.4));
  var rows=[];
  groups().forEach(function(g){g.ex.forEach(function(e){
    var h=exHistory(e.id);if(h.length<2)return;
    var base=null;for(var i=h.length-1;i>=0;i--){if(h[i].date<=cut){base=h[i];break;}}
    var since=false;if(!base){base=h[0];since=true;}
    var now=h[h.length-1];if(now.date===base.date)return;
    var md=exMode(e.id);var bw=md!=="w"||h.every(function(p){return p.top<=0;});
    var a=bw?base.reps:base.top,b=bw?now.reps:now.top;
    rows.push({exId:e.id,from:a,to:b,unit:md==="time"?"сек":bw?"раз":"кг",diff:b-a,pct:a>0?Math.round((b-a)/a*100):0,since:since,fromDate:base.date});
  });});
  rows.sort(function(x,y){return y.pct-x.pct||y.diff-x.diff;});
  return rows;
}

/* ---------- подходы в неделю по мышцам ---------- */
function weeklySets(days){
  var since=shiftIso(todayIso(),-(days-1));var out={};
  sortedDates().forEach(function(d){if(d<since)return;state.workouts[d].entries.forEach(function(en){
    var m=exMuscle(en.exId);if(!m)return;var n=workSets(en).length;if(!n)return;
    out[m]=out[m]||{direct:0,indirect:0};out[m].direct+=n;
    var k=exKind(en.exId);
    if((k==="heavy"||k==="mid")&&INDIRECT[m])INDIRECT[m].forEach(function(m2){out[m2]=out[m2]||{direct:0,indirect:0};out[m2].indirect+=n*0.5;});
  });});
  return out;
}
function plannedMuscles(){
  var set={};
  programs().forEach(function(p){p.slots.forEach(function(s){var g=group(s.gid);if(!g||g.archived)return;
    if(g.muscle)set[g.muscle]=1;
    var ids=(s.pref&&s.pref.length?s.pref:g.ex.filter(function(e){return !e.archived;}).map(function(e){return e.id;}));
    ids.forEach(function(id){var m=exMuscle(id);if(m&&g.ex.length<=4)set[m]=1;});
  });});
  return Object.keys(MUSCLES).filter(function(m){return set[m];});
}
function volumeHtml(){
  var ws=weeklySets(7);
  var list=state.showAllMuscles?Object.keys(MUSCLES):plannedMuscles();
  if(!list.length)list=Object.keys(MUSCLES);
  var rows=list.map(function(m){
    var v=VOLUME[m];var d=ws[m]||{direct:0,indirect:0};var n=Math.round((d.direct+d.indirect)*2)/2;
    var st=n<v.min?["low","мало"]:n<v.lo?["ok","минимум"]:n<=v.hi?["good","оптимально"]:n<=v.max?["ok","много"]:["over","перебор"];
    var scale=v.max*1.15;function pc(x){return Math.min(100,x/scale*100).toFixed(1)+"%";}
    return '<div class="vrow"><div class="vtop"><span class="vname">'+MUSCLES[m]+'</span><span class="vnum"><b>'+fmtNum(n)+'</b> / '+v.lo+'–'+v.hi+'</span><span class="vst s-'+st[0]+'">'+st[1]+'</span></div>'+
      '<div class="vbar"><i class="z1" style="left:'+pc(v.min)+';width:calc('+pc(v.lo)+' - '+pc(v.min)+')"></i><i class="z2" style="left:'+pc(v.lo)+';width:calc('+pc(v.hi)+' - '+pc(v.lo)+')"></i><i class="z1" style="left:'+pc(v.hi)+';width:calc('+pc(v.max)+' - '+pc(v.hi)+')"></i>'+
      '<i class="fillv s-'+st[0]+'" style="width:'+pc(n)+'"></i></div>'+
      (d.indirect?'<small class="vind">из них '+fmtNum(d.indirect)+' — косвенно</small>':'')+'</div>';
  }).join("");
  return '<div class="sec-title">Подходы за 7 дней · норма</div><div class="card vol"><div class="mlegend"><span><i style="background:color-mix(in srgb,var(--warm) 30%,var(--surface))"></i>минимум для роста</span><span><i style="background:color-mix(in srgb,var(--good) 40%,var(--surface))"></i>оптимально</span><span>цифры: сделано / оптимум</span></div>'+rows+
    '<button class="linkbtn" data-act="allmuscles">'+(state.showAllMuscles?'только мышцы из моих тренировок':'показать все мышцы')+'</button>'+
    '<details class="vinfo"><summary>Откуда эти цифры</summary><p>Ориентиры из исследований объёма тренировок: сколько <b>рабочих</b> подходов в неделю нужно мышце. Ниже минимума рост почти не идёт, в «оптимально» — лучший результат, выше «много» мышцы обычно не успевают восстановиться.</p>'+
    '<p>Считаются только тяжёлые подходы — когда в запасе остаётся 1–3 повтора. Базовые упражнения частично качают соседние мышцы: например, тяги спины — бицепс, жимы — трицепс. Такие подходы идут за ½.</p>'+
    '<p>Это средние цифры. Новичкам и тем, кто худеет, часто хватает нижней границы, а нагрузку лучше добавлять постепенно — по 1–2 подхода в неделю.</p></details></div>';
}

/* ---------- карта мышц ---------- */
function muscleLoad(days){
  var since=shiftIso(todayIso(),-(days-1));var load={};
  sortedDates().forEach(function(d){if(d<since)return;state.workouts[d].entries.forEach(function(en){var m=exMuscle(en.exId);if(!m)return;load[m]=(load[m]||0)+workSets(en).length;});});
  return load;
}
function muscleFill(n){if(!n)return "var(--mm-empty)";if(n<4)return "color-mix(in srgb, var(--accent) 35%, var(--mm-empty))";if(n<9)return "color-mix(in srgb, var(--accent) 68%, var(--mm-empty))";return "var(--accent)";}
function bodySvg(load){
  function M(m,shape){return '<g class="mm" data-m="'+m+'" style="fill:'+muscleFill(load[m]||0)+'">'+shape+'</g>';}
  function E(cx,cy,rx,ry,rot){return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"'+(rot?' transform="rotate('+rot+' '+cx+' '+cy+')"':'')+'/>';}
  var base='<g class="mm-base">'+
    '<circle cx="50" cy="15" r="10"/><rect x="45" y="23" width="10" height="9" rx="3"/>'+
    '<path d="M30 36 Q50 29 70 36 L74 48 L68 92 Q50 100 32 92 L26 48 Z"/>'+
    '<path d="M27 40 Q21 42 20 52 L17 98 Q18 103 22 103 L25 99 L30 56 Z"/><path d="M73 40 Q79 42 80 52 L83 98 Q82 103 78 103 L75 99 L70 56 Z"/>'+
    '<path d="M33 92 Q50 99 67 92 L68 104 L63 186 Q58 191 53 186 L51 112 L49 112 L47 186 Q42 191 37 186 L32 104 Z"/></g>';
  var front=base+
    M("shoulders",E(30,42,7,6.5,-20)+E(70,42,7,6.5,20))+
    M("chest",'<path d="M36 44 Q43 41 49 44 L49 56 Q42 59 35 55 Z"/><path d="M64 44 Q57 41 51 44 L51 56 Q58 59 65 55 Z"/>')+
    M("biceps",E(25,58,4.2,9,8)+E(75,58,4.2,9,-8))+
    M("abs",'<rect x="42" y="60" width="16" height="30" rx="5"/>')+
    M("quads",E(41,128,7.5,21,4)+E(59,128,7.5,21,-4))+
    M("hips",E(48.6,118,2.4,11)+E(51.4,118,2.4,11))+
    '<g class="mm-base">'+E(41,168,4.5,14)+E(59,168,4.5,14)+'</g>';
  var back=base+
    M("shoulders",E(30,42,7,6.5,-20)+E(70,42,7,6.5,20))+
    M("back",'<path d="M38 37 Q50 33 62 37 L67 50 L61 76 Q50 84 39 76 L33 50 Z"/>')+
    M("triceps",E(25,58,4.2,9,8)+E(75,58,4.2,9,-8))+
    M("glutes",E(43,102,7.5,8)+E(57,102,7.5,8))+
    M("hips",E(34.5,106,2.6,8,8)+E(65.5,106,2.6,8,-8))+
    M("hams",E(41.5,132,6.5,17,3)+E(58.5,132,6.5,17,-3))+
    M("calves",E(41,166,5,12)+E(59,166,5,12));
  return '<div class="bodymap"><figure><svg viewBox="10 0 80 195" role="img" aria-label="Мышцы спереди">'+front+'</svg><figcaption>Спереди</figcaption></figure>'+
         '<figure><svg viewBox="10 0 80 195" role="img" aria-label="Мышцы сзади">'+back+'</svg><figcaption>Сзади</figcaption></figure></div>';
}

/* ---------- карточка для соцсетей ---------- */
function rr(x,X,Y,W,H,R){x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.closePath();}
function fitText(x,txt,max){if(x.measureText(txt).width<=max)return txt;while(txt.length>1&&x.measureText(txt+"…").width>max)txt=txt.slice(0,-1);return txt+"…";}
function cardFonts(){
  if(!document.fonts||!document.fonts.load)return Promise.resolve();
  return Promise.race([Promise.all(["700 80px Unbounded","600 40px Onest","500 40px Onest","600 40px 'JetBrains Mono'"].map(function(f){return document.fonts.load(f).catch(function(){});})),new Promise(function(r){setTimeout(r,1500);})]);
}
function fmtClockShort(ms){var m=Math.round(ms/60000);return Math.floor(m/60)+":"+pad(m%60);}
var ACCENT_HEX={blue:{glow:"#2f5bff",glow2:"#00b3ff"},pink:{glow:"#ff3d8b",glow2:"#ff8a5c"},violet:{glow:"#7b4dff",glow2:"#ff4fd8"},green:{glow:"#1fbf6b",glow2:"#00c2c7"},orange:{glow:"#ff7a1a",glow2:"#ff3d5a"}};

/* Отдать картинку: Android-приложение → «Поделиться», Claude → скачать, браузер → поделиться или скачать */
function canvasToBlob(c){return new Promise(function(res){c.toBlob(function(b){res(b);},"image/png");});}
function shareImage(c,name){
  var cap=window.Capacitor&&window.Capacitor.Plugins;
  if(cap&&cap.Filesystem&&cap.Share){
    var b64=c.toDataURL("image/png").split(",")[1];
    return cap.Filesystem.writeFile({path:name,data:b64,directory:"CACHE"}).then(function(r){return cap.Share.share({title:"Моя тренировка",files:[r.uri]});}).then(function(){return "shared";});
  }
  return canvasToBlob(c).then(function(blob){
    if(IS_ARTIFACT&&window.claude&&window.claude.use){
      return window.claude.use("downloads").then(function(dl){if(!dl)throw {code:"unavailable"};return dl.save({filename:name,data:blob}).then(function(){return "saved";});});
    }
    try{var f=new File([blob],name,{type:"image/png"});
      if(navigator.canShare&&navigator.canShare({files:[f]}))return navigator.share({files:[f],title:"Моя тренировка"}).then(function(){return "shared";});
    }catch(e){}
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);return "saved";
  });
}

/* ---------- цвет и тема ---------- */
function applyLook(){
  var r=document.documentElement,s=settings();
  r.setAttribute("data-accent",s.accent||"blue");
  if(!IS_ARTIFACT){if(s.theme==="light"||s.theme==="dark")r.setAttribute("data-theme",s.theme);else r.removeAttribute("data-theme");}
}
