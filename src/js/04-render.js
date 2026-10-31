/* ---------- черновик и сохранение ---------- */
var saveTimer=null;
function loadDraft(){
  var w=state.workouts[state.date];
  state.draft=w?clone(w):{date:state.date,entries:[]};
  state.draft.entries.forEach(function(en){en.sets=(en.sets||[]).filter(function(s){return !s.wu;});});
  var p=state.draft.programId&&program(state.draft.programId);
  if(!p||p.archived)state.draft.programId=nextProgramId(state.date);
  state.dirty=0;state.swap=null;state.ssPick=null;state.editNote=null;
}
function touch(){state.dirty++;clearTimeout(saveTimer);setStatus("saving");saveTimer=setTimeout(flush,700);}
function flush(){
  clearTimeout(saveTimer);saveTimer=null;
  if(state.dirty){
    var mark=state.dirty;var w=clone(state.draft);
    if(w.entries.length)state.workouts[w.date]=w;else delete state.workouts[w.date];
    store.saveWorkout(w).then(function(){if(state.dirty===mark)state.dirty=0;});
    checkGoals();checkAchievements(false);
  }
  if(state.cfgDirty){state.cfgDirty=false;store.saveConfig();}
}
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")flush();else{if(state.tab==="workout"&&sessionActive(state.draft))keepAwake(true);if(rest.running)tickRest();}});
window.addEventListener("pagehide",flush);

/* ---------- экран ---------- */
var view=document.getElementById("view");
function render(){
  document.querySelectorAll(".tab").forEach(function(t){t.classList.toggle("on",t.dataset.tab===state.tab);});
  document.getElementById("daterow").hidden=state.tab!=="workout";
  renderDate();
  if(state.tab==="workout")renderWorkout();
  else if(state.tab==="history")renderHistory();
  else if(state.tab==="progress")renderProgress();
  else renderSettings();
  renderModal();
}
function rerender(fn){var y=window.scrollY;fn();window.scrollTo(0,y);}
function renderDate(){
  document.getElementById("dateLabel").textContent=fmtDate(state.date,true);
  document.getElementById("todayTag").hidden=state.date!==todayIso();
  document.getElementById("dateInput").value=state.date;
}
function plate(i){return '<span class="plate" style="--pc:var('+PLATES[i%PLATES.length]+')"></span>';}
function kindChip(exId,tag){var k=exKind(exId);return '<'+(tag||"span")+' class="kchip k-'+k+'"'+(tag==="button"?' data-act="kind" data-e="'+exId+'" title="Тип упражнения влияет на отдых"':'')+'>'+KINDS[k].short+'</'+(tag||"span")+'>';}

function modeChip(exId){var m=exMode(exId);return '<button class="kchip mchip m-'+m+(state.modePick===exId?' open':'')+'" data-act="mode" data-e="'+exId+'" title="С весом, без веса или на время">'+MODES[m].short+' ▾</button>';}
function modePicker(exId){
  if(state.modePick!==exId)return "";var m=exMode(exId);
  return '<div class="seg mpick">'+MODE_ORDER.map(function(k){return '<button class="'+(k===m?'on':'')+'" data-act="modeset" data-e="'+exId+'" data-m="'+k+'">'+MODES[k].name+'</button>';}).join("")+'</div>';
}
function recHtml(exId){
  var r=recommend(exId,state.date),R=r.R,mode=exMode(exId);
  if(r.type==="new"){
    var t=mode==="time"?"Первый раз — держи сколько сможешь и запиши секунды":mode==="bw"?"Первый раз — сделай сколько сможешь, оставив 1–2 повтора в запасе":"Первый раз — подбери вес на "+R.lo+"–"+R.hi+" повторов";
    return '<div class="rec new"><div class="goal">'+t+'</div></div>';
  }
  if(r.time)return '<div class="rec up"><div class="last">Прошлый раз, '+fmtDate(r.last.date)+': <span>'+esc(setsText(r.last.entry))+'</span></div><div class="goal">Сегодня: попробуй <span>'+r.target+' сек</span></div></div>';
  var last='<div class="last">Прошлый раз, '+fmtDate(r.last.date)+': <span>'+esc(setsText(r.last.entry))+'</span></div>';
  var rng=R.lo===R.hi?R.lo:R.lo+'–'+R.hi;
  var goal;
  if(r.type==="deload")goal='Разгрузка: <span>'+fmtNum(r.w)+' кг</span> × '+rng+', спокойно';
  else if(r.bw)goal=r.type==="up"?(mode==="bw"?"Сегодня: добавь 1–2 повтора":"Сегодня: добавь 2–3 повтора или вес"):"Сегодня: постарайся сделать на повтор больше";
  else if(r.type==="up")goal='Сегодня: <span>'+fmtNum(r.w)+' кг</span> × '+rng+' ↑ прибавка';
  else goal='Сегодня: <span>'+fmtNum(r.w)+' кг</span>, добей до '+R.hi+' во всех подходах';
  return '<div class="rec '+r.type+'">'+last+'<div class="goal">'+goal+'</div></div>';
}
function entryKey(en){return en.gid+"|"+en.exId;}
function partnerOf(en){if(!en.ss)return null;return state.draft.entries.filter(function(x){return x!==en&&x.ss===en.ss;})[0]||null;}
function loggerHtml(gid,en,showName,groupExIds){
  var R=curReps();
  var foreign=groupExIds.indexOf(en.exId)<0;
  var f=findEx(en.exId);
  var mode=exMode(en.exId);
  var rows=en.sets.map(function(s,i){
    var a='data-g="'+gid+'" data-e="'+en.exId+'" data-i="'+i+'"';
    var logged=s.r>0;
    if(mode!=="w")return '<div class="set nw'+(logged?' logged':'')+'"><span class="n">'+(i+1)+'</span>'+
      '<div class="fld"><input id="r-'+en.exId+'-'+i+'" inputmode="numeric" enterkeyhint="done" autocomplete="off" '+a+' data-f="r" value="'+(s.r||"")+'" placeholder="'+(mode==="time"?"секунды":(R.lo===R.hi?R.lo:R.lo+'–'+R.hi))+'" aria-label="'+(mode==="time"?"Секунды":"Повторы")+'"><small>'+(mode==="time"?"сек":"раз")+'</small></div>'+
      '<button class="del" data-act="delset" '+a+' aria-label="Убрать подход">×</button></div>';
    return '<div class="set'+(logged?' logged':'')+'"><span class="n">'+(i+1)+'</span>'+
      '<div class="wfld"><button class="pm" data-act="wminus" '+a+' aria-label="Меньше вес">−</button>'+
      '<div class="fld"><input id="w-'+en.exId+'-'+i+'" inputmode="decimal" autocomplete="off" '+a+' data-f="w" value="'+fmtNum(s.w)+'" placeholder="0" aria-label="Вес, кг"></div>'+
      '<button class="pm" data-act="wplus" '+a+' aria-label="Больше вес">+</button></div>'+
      '<span class="x">×</span>'+
      '<div class="fld"><input id="r-'+en.exId+'-'+i+'" inputmode="numeric" enterkeyhint="done" autocomplete="off" '+a+' data-f="r" value="'+(s.r||"")+'" placeholder="'+(R.lo===R.hi?R.lo:R.lo+'–'+R.hi)+'" aria-label="Повторы"></div>'+
      '<button class="del" data-act="delset" '+a+' aria-label="Убрать подход">×</button></div>';
  }).join("");
  var note=f&&f.e.note;
  var noteHtml=state.editNote===en.exId
    ?'<div class="noteedit"><input id="note-'+en.exId+'" data-note="'+en.exId+'" value="'+esc(note||"")+'" placeholder="Например: сиденье на 4, узкий хват" maxlength="120" aria-label="Заметка к упражнению"><button class="btn" data-act="noteok">Готово</button></div>'
    :'<button class="note'+(note?'':' empty')+'" data-act="note" data-e="'+en.exId+'">'+(note?'📝 '+esc(note):'+ заметка')+'</button>';
  var partner=partnerOf(en);
  var ssHtml='';
  if(partner)ssHtml='<div class="ssbadge">🔗 Суперсет с «'+esc(exName(partner.exId))+'» <button class="linkbtn" data-act="ssoff" data-g="'+gid+'" data-e="'+en.exId+'">разъединить</button></div>';
  else if(state.ssPick&&state.ssPick!==entryKey(en))ssHtml='<button class="btn sslink" data-act="sslink" data-g="'+gid+'" data-e="'+en.exId+'">🔗 Связать в суперсет с этим</button>';
  var swapHtml='';
  if(state.swap===entryKey(en)){
    var alts=swapOptions(en);
    swapHtml='<div class="swap"><div class="swaptitle">Тренажёр занят? Замени на:</div><div class="chips">'+(alts.length?alts.map(function(id){return '<button class="chip" data-act="swapto" data-g="'+gid+'" data-e="'+en.exId+'" data-to="'+id+'">'+esc(exName(id))+'</button>';}).join(""):'<span class="hint">Нет похожих упражнений — добавь в «Настройках»</span>')+'</div><button class="linkbtn" data-act="swapcancel">отмена</button></div>';
  }
  var head='<div class="lhead">'+((showName||foreign)?'<h3>'+esc(exName(en.exId))+'</h3>':'<span class="sp"></span>')+modeChip(en.exId)+kindChip(en.exId)+
    (f&&f.e.backRisk?'<span class="risk" title="Нагрузка на поясницу">⚠️</span>':'')+
    '<span class="ltools"><button class="tool" data-act="swap" data-g="'+gid+'" data-e="'+en.exId+'" title="Тренажёр занят">⇄ Занято</button>'+
    (partner?'':'<button class="tool'+(state.ssPick===entryKey(en)?' on':'')+'" data-act="sspick" data-g="'+gid+'" data-e="'+en.exId+'" title="Суперсет">🔗</button>')+'</span></div>';
  head+=modePicker(en.exId);
  return '<div class="log'+(partner?' inss':'')+'" data-entry="'+esc(entryKey(en))+'">'+head+swapHtml+ssHtml+noteHtml+recHtml(en.exId)+
    '<div class="sets">'+rows+'</div><button class="addset" data-act="addset" data-g="'+gid+'" data-e="'+en.exId+'">+ подход</button></div>';
}
function swapOptions(en){
  var used={};state.draft.entries.forEach(function(x){used[x.exId]=true;});
  var f=findEx(en.exId);if(!f)return [];
  var m=exMuscle(en.exId);var out=[];
  f.g.ex.forEach(function(e){if(!e.archived&&!used[e.id])out.push(e.id);});
  liveGroups().forEach(function(g){if(g.id===f.g.id)return;g.ex.forEach(function(e){if(!e.archived&&!used[e.id]&&m&&exMuscle(e.id)===m)out.push(e.id);});});
  return out.slice(0,10);
}

function sessionHtml(){
  var w=state.draft;if(!w.startedAt)return "";
  if(sessionActive(w))return '<div class="sess live"><span class="dot"></span><span>Идёт тренировка</span><b id="sessClock">'+fmtClock((Date.now()-w.startedAt)/1000)+'</b><button class="btn primary" data-act="finish">Завершить</button></div>';
  var dur=workoutDuration(w);
  return '<div class="sess"><span>'+(dur?'⏱ '+fmtDur(dur)+' · ':'')+fmtBig(tonnage(w))+' кг · '+doneEntries(w).length+' упр.</span><button class="btn" data-act="summary">Итог</button><button class="btn" data-act="card">Карточка</button></div>';
}
function planBanner(){
  if(planFinished()){
    if(!state.config.planDone){state.config.planDone=true;state.cfgDirty=true;}
    return '<div class="banner done"><b>План на месяц пройден 🎉</b><span>Отличная работа! Начать новый месяц?</span><div class="btns"><button class="btn primary" data-act="planrestart">Ещё месяц</button><button class="btn" data-act="planoff">Убрать план</button></div></div>';
  }
  var pw=planWeek(state.date);if(!pw)return "";
  var w=pw.week;
  return '<div class="banner'+(w.load<1?' deload':'')+'"><div class="bweek">'+Array.apply(null,{length:pw.total}).map(function(_,i){return '<i class="'+(i<pw.n-1?'past':i===pw.n-1?'now':'')+'"></i>';}).join("")+'</div>'+
    '<b>Неделя '+pw.n+' из '+pw.total+' · '+esc(w.label)+'</b><span>'+esc(pw.plan.name)+' · '+w.sets+' × '+(w.lo===w.hi?w.lo:w.lo+'–'+w.hi)+'</span></div>';
}
function onboardingHtml(){
  return '<div class="onb"><h2>С чего начнём?</h2><p>Выбери готовую программу — её можно будет поменять в любой момент. Или оставь стандартный набор: фулбади, верх и низ.</p>'+
    '<div class="tlist">'+TEMPLATES.slice(0,6).map(templateCard).join("")+'</div>'+
    '<div class="btns"><button class="btn primary" data-act="lib">Все программы ('+TEMPLATES.length+')</button><button class="btn" data-act="onbskip">Оставить как есть</button></div></div>';
}
function templateCard(t){
  var days=t.programs.map(function(p){return esc(p.name);}).join(" · ");
  return '<div class="tcard"><div class="thead"><b>'+esc(t.name)+'</b><span class="back b-'+t.back+'">'+BACK_LABEL[t.back]+'</span></div>'+
    '<div class="tmeta">'+esc(t.freq)+' · '+esc(t.level)+'</div><p>'+esc(t.desc)+'</p><div class="tdays">'+days+'</div>'+templatePreview(t)+
    '<div class="btns"><button class="btn primary" data-act="tpl" data-t="'+t.id+'" data-mode="'+(state.config.onboarded?'add':'replace')+'">'+(state.config.onboarded?'Добавить':'Начать с неё')+'</button>'+
    (state.config.onboarded?'<button class="btn" data-act="tpl" data-t="'+t.id+'" data-mode="replace">Заменить мои</button>':'')+'</div></div>';
}
function renderWorkout(){
  var h="";
  if(!state.config.onboarded&&!sortedDates().length)h+=onboardingHtml();
  h+=planBanner();
  var progs=programs();
  if(!progs.length){view.innerHTML=h+'<div class="empty">Нет ни одной тренировки.<br>Добавь готовую программу или создай свою в «Настройках».</div>';return;}
  var nextId=nextProgramId(state.date);
  h+='<div class="progpick"><span class="lbl">Тренировка</span><div class="chips">'+progs.map(function(p){
    var on=p.id===state.draft.programId;
    return '<button class="chip big'+(on?' on':'')+'" data-act="prog" data-p="'+p.id+'" aria-pressed="'+on+'">'+esc(p.name)+(p.id===nextId&&progs.length>1?'<small>по очереди</small>':'')+'</button>';
  }).join("")+'</div></div>';
  h+=sessionHtml();
  var slots=currentSlots();
  var done=slots.filter(function(s){return groupDone(s.gid);}).length;
  h+='<div class="summary"><div class="meter" id="meter" style="--n:'+Math.max(slots.length,1)+'">'+slots.map(function(s){return '<i class="'+(groupDone(s.gid)?'on':'')+'"></i>';}).join("")+'</div><b id="doneCount">'+done+' / '+slots.length+'</b></div>';
  var canFill=slots.some(function(s){return s.pref&&s.pref.length&&!state.draft.entries.some(function(en){return en.gid===s.gid;});});
  if(canFill)h+='<button class="btn fill" data-act="fill">★ Заполнить по программе</button>';
  if(state.ssPick)h+='<div class="banner ss">Выбери второе упражнение для суперсета и нажми «Связать». <button class="linkbtn" data-act="sscancel">отмена</button></div>';
  if(!slots.length)h+='<div class="empty">В этой тренировке пока нет групп мышц.<br>Добавь их в «Настройки» → «Мои тренировки».</div>';
  slots.forEach(function(s,si){
    var g=group(s.gid);
    var entries=state.draft.entries.filter(function(en){return en.gid===s.gid;});
    var exIds=g.ex.filter(function(e){return !e.archived;}).map(function(e){return e.id;});
    var chips=exIds.map(function(id){
      var on=entries.some(function(en){return en.exId===id;});
      var star=s.pref&&s.pref.indexOf(id)>=0;
      return '<button class="chip'+(on?' on':'')+(star?' pref':'')+'" data-act="pick" data-g="'+g.id+'" data-e="'+id+'" data-c="'+s.count+'" aria-pressed="'+on+'">'+(star?'★ ':'')+esc(exName(id))+'</button>';
    }).join("");
    var tag=groupDone(s.gid)?'<span class="check">✓</span>':(s.count>1?'<span class="tag">до '+s.count+' упр.</span>':(s.extra?'<span class="tag">вне плана</span>':''));
    h+='<section class="group'+(groupDone(s.gid)?' done':'')+'" data-group="'+g.id+'"><div class="ghead">'+plate(si)+'<h2>'+esc(g.name)+'</h2>'+tag+'</div>'+
      '<div class="chips">'+(chips||'<span class="hint">Нет упражнений — добавь в «Настройках»</span>')+'</div>'+
      entries.map(function(en){return loggerHtml(g.id,en,s.count>1,exIds);}).join("")+'</section>';
  });
  if(state.draft.entries.some(entryDone)&&!state.draft.finishedAt&&state.date===todayIso())h+='<button class="btn primary wide" data-act="finish">Завершить тренировку</button>';
  h+='<p class="hint">Вес подставляется по прошлой тренировке — впиши повторы, и запустится отдых.</p>';
  view.innerHTML=h;
  keepAwake(sessionActive(state.draft));
}
function updateSummary(){
  var slots=currentSlots();var done=0;var bars=document.querySelectorAll("#meter i");
  slots.forEach(function(s,i){var d=groupDone(s.gid);if(d)done++;if(bars[i])bars[i].classList.toggle("on",d);
    var sec=view.querySelector('[data-group="'+s.gid+'"]');if(sec)sec.classList.toggle("done",d);});
  var dc=document.getElementById("doneCount");if(dc)dc.textContent=done+" / "+slots.length;
}

/* ---------- история и календарь ---------- */
function calendarHtml(){
  var m=state.calMonth||todayIso().slice(0,7)+"-01";state.calMonth=m;
  var first=dateObj(m);var y=first.getFullYear(),mo=first.getMonth();
  var startWd=(first.getDay()+6)%7;var dim=new Date(y,mo+1,0).getDate();
  var title=first.toLocaleDateString("ru-RU",{month:"long",year:"numeric"}).replace(" г.","");
  var cells="";for(var i=0;i<startWd;i++)cells+='<span></span>';
  var t=todayIso();
  for(var d=1;d<=dim;d++){
    var iso=y+"-"+pad(mo+1)+"-"+pad(d);var w=state.workouts[iso];var has=w&&isWorkoutDone(w);
    var pr=has&&workoutRecords(w).length;
    cells+='<button class="cday'+(has?' has':'')+(iso===t?' today':'')+'"'+(has?' data-act="openw" data-d="'+iso+'"':' disabled')+' aria-label="'+d+'">'+d+(pr?'<i class="prdot"></i>':'')+'</button>';
  }
  var ws=weekStats();
  var ring=Math.min(1,ws.thisWeek/ws.goal);var L=2*Math.PI*22;
  return '<div class="card cal"><div class="calhead"><button class="nav sm" data-act="calprev" aria-label="Предыдущий месяц">‹</button><b>'+title.charAt(0).toUpperCase()+title.slice(1)+'</b><button class="nav sm" data-act="calnext" aria-label="Следующий месяц">›</button></div>'+
    '<div class="calgrid wd"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="calgrid">'+cells+'</div>'+
    '<div class="weekrow"><svg class="ring" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" class="rbg"/><circle cx="27" cy="27" r="22" class="rfg" style="stroke-dasharray:'+L+';stroke-dashoffset:'+(L*(1-ring))+'"/></svg>'+
    '<div><b>Эта неделя: '+ws.thisWeek+' из '+ws.goal+'</b><span>'+(ws.current>0?'Серия: '+ws.current+' '+plural(ws.current,'неделя','недели','недель')+' подряд 🔥':'Сделай '+ws.goal+' '+plural(ws.goal,'тренировку','тренировки','тренировок')+' за неделю, чтобы начать серию')+'</span></div></div></div>';
}
function renderHistory(){
  var ds=sortedDates().filter(function(d){return isWorkoutDone(state.workouts[d])||state.workouts[d].entries.length;}).reverse();
  var h=calendarHtml();
  if(!ds.length){view.innerHTML=h+'<div class="empty">Здесь появятся твои тренировки.<br>Открой вкладку «Тренировка», выбери упражнения и впиши повторы — всё сохранится само.</div>';return;}
  h+='<div class="sec-title">Тренировок: '+ds.length+'</div>';
  ds.forEach(function(d){
    var w=state.workouts[d];var de=doneEntries(w);
    var recs={};workoutRecords(w).forEach(function(r){recs[r.exId]=1;});
    var lines=de.map(function(en){return '<div><span>'+(recs[en.exId]?'🏆 ':'')+esc(exName(en.exId))+'</span><span>'+esc(setsText(en))+'</span></div>';}).join("");
    var ask=state.confirm&&state.confirm.kind==="w"&&state.confirm.id===d;
    var btns=ask
      ?'<button class="btn solid-danger" data-act="delw" data-d="'+d+'">Удалить</button><button class="btn" data-act="cancel">Отмена</button>'
      :'<button class="btn primary" data-act="openw" data-d="'+d+'">Открыть</button>'+(de.length?'<button class="btn" data-act="card" data-d="'+d+'">Карточка</button>':'')+'<button class="btn danger" data-act="ask" data-k="w" data-id="'+d+'">Удалить</button>';
    var pn=programName(w.programId);var dur=workoutDuration(w);
    var meta=[pn?esc(pn):null,de.length+' упр.',dur?fmtDur(dur):null,tonnage(w)?fmtBig(tonnage(w))+' кг':null].filter(Boolean).join(' · ');
    h+='<div class="card"><div class="hrow"><h3>'+fmtDate(d,true)+'</h3><em class="meta">'+meta+'</em></div>'+
      '<div class="lines">'+(lines||'<div><span>Повторы ещё не вписаны</span><span></span></div>')+'</div><div class="btns">'+btns+'</div></div>';
  });
  view.innerHTML=h;
}

/* ---------- прогресс ---------- */
function chartSvg(pts,useReps,goalW){
  var W=340,H=170,L=34,R=12,T=14,B=26;
  var vals=pts.map(function(p){return useReps?p.reps:p.top;});
  var all=vals.slice();if(goalW&&!useReps)all.push(goalW);
  var mn=Math.min.apply(null,all),mx=Math.max.apply(null,all);
  if(mn===mx){mn=Math.max(0,mn-2);mx=mx+2;}
  var span=mx-mn;mn=Math.max(0,mn-span*0.1);mx=mx+span*0.1;
  function x(i){return pts.length===1?L+(W-L-R)/2:L+i*(W-L-R)/(pts.length-1);}
  function y(v){return T+(H-T-B)*(1-(v-mn)/(mx-mn));}
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="График прогресса">';
  for(var k=0;k<3;k++){var v=mn+(mx-mn)*k/2;var yy=y(v);
    s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="var(--line)" stroke-width="1"/>';
    s+='<text x="'+(L-6)+'" y="'+(yy+4)+'" text-anchor="end" font-size="10" fill="var(--muted)" font-family="JetBrains Mono,monospace">'+fmtNum(Math.round(v*10)/10)+'</text>';}
  if(goalW&&!useReps){var gy=y(goalW);s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+gy+'" y2="'+gy+'" stroke="var(--good)" stroke-width="1.5" stroke-dasharray="4 4"/><text x="'+(W-R)+'" y="'+(gy-5)+'" text-anchor="end" font-size="10" fill="var(--good)">цель '+fmtNum(goalW)+'</text>';}
  var path=pts.map(function(p,i){return (i?"L":"M")+x(i).toFixed(1)+" "+y(vals[i]).toFixed(1);}).join(" ");
  if(pts.length>1){
    s+='<path d="'+path+" L"+x(pts.length-1).toFixed(1)+" "+(H-B)+" L"+x(0).toFixed(1)+" "+(H-B)+' Z" fill="var(--accent-soft)" stroke="none"/>';
    s+='<path d="'+path+'" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  pts.forEach(function(p,i){var last=i===pts.length-1;
    s+='<circle cx="'+x(i)+'" cy="'+y(vals[i])+'" r="'+(last?5:3)+'" fill="'+(last?'var(--accent)':'var(--surface)')+'" stroke="var(--accent)" stroke-width="2"/>';});
  s+='<text x="'+x(0)+'" y="'+(H-8)+'" text-anchor="'+(pts.length===1?'middle':'start')+'" font-size="10" fill="var(--muted)">'+fmtDate(pts[0].date)+'</text>';
  if(pts.length>1)s+='<text x="'+x(pts.length-1)+'" y="'+(H-8)+'" text-anchor="end" font-size="10" fill="var(--muted)">'+fmtDate(pts[pts.length-1].date)+'</text>';
  return s+'</svg>';
}
function goalCardHtml(exId,hist,useReps){
  if(useReps)return "";
  var g=state.config.goals[exId];var cur=hist[hist.length-1].top;
  if(!g||state.editGoal===exId){
    return '<div class="card goal"><b>🎯 Цель</b><form class="goalform" data-form="goal" data-e="'+exId+'"><label>Вес, кг<input id="goalW" inputmode="decimal" value="'+(g?fmtNum(g.w):fmtNum(roundW(cur*1.2)))+'"></label><label>К дате (необязательно)<input id="goalD" type="date" value="'+(g&&g.by?g.by:'')+'"></label><button class="btn primary" type="submit">Сохранить</button></form>'+(g?'<button class="linkbtn" data-act="goaldel" data-e="'+exId+'">удалить цель</button>':'')+'</div>';
  }
  var start=g.startW,frac=g.w>start?Math.max(0,Math.min(1,(cur-start)/(g.w-start))):1;
  var fc=g.doneAt?null:forecast(exId,g.w);
  var fcText=g.doneAt?'Цель взята '+fmtDate(g.doneAt)+' 🎉':(fc&&fc.date?'Прогноз: к '+fmtDate(fc.date)+(g.by?(fc.date<=g.by?' — успеваешь ✓':' — к '+fmtDate(g.by)+' нужно быстрее'):''):'Для прогноза нужно ещё пару тренировок с ростом веса');
  return '<div class="card goal"><div class="hrow"><b>🎯 Цель: '+fmtNum(g.w)+' кг'+(g.by?' к '+fmtDate(g.by):'')+'</b><button class="linkbtn" data-act="goaledit" data-e="'+exId+'">изменить</button></div>'+
    '<div class="gbar"><i style="width:'+Math.round(frac*100)+'%"></i></div><div class="gnums"><span>'+fmtNum(start)+' кг</span><span><b>сейчас '+fmtNum(cur)+'</b></span><span>'+fmtNum(g.w)+' кг</span></div><p class="fc">'+fcText+'</p></div>';
}
function renderProgress(){
  var h='';
  var load=muscleLoad(7);
  h+='<div class="sec-title">Нагрузка за 7 дней</div><div class="card mapcard">'+bodySvg(load)+
    '<div class="mlegend"><span><i style="background:var(--mm-empty)"></i>нет</span><span><i style="background:'+muscleFill(2)+'"></i>1–3 подхода</span><span><i style="background:'+muscleFill(5)+'"></i>4–8</span><span><i style="background:var(--accent)"></i>9+</span></div>'+
    '<p class="hint left" id="mmInfo">Нажми на мышцу, чтобы увидеть подходы</p></div>';
  h+=volumeHtml();
  var gs=groups();var withHist={};
  gs.forEach(function(g){g.ex.forEach(function(e){if(exHistory(e.id).length)withHist[e.id]=true;});});
  if(!state.progEx||!withHist[state.progEx])state.progEx=Object.keys(withHist)[0]||null;
  var goalIds=Object.keys(state.config.goals).filter(function(id){return findEx(id)&&exHistory(id).length;});
  if(goalIds.length){
    h+='<div class="sec-title">Мои цели</div><div class="card"><div class="lines">'+goalIds.map(function(id){var g=state.config.goals[id];var hh=exHistory(id);var cur=hh[hh.length-1].top;
      return '<div><span><button class="linkbtn plain" data-act="progto" data-e="'+id+'">'+esc(exName(id))+'</button></span><span>'+(g.doneAt?'✓ ':'')+fmtNum(cur)+' / '+fmtNum(g.w)+' кг</span></div>';}).join("")+'</div></div>';
  }
  if(!state.progEx){view.innerHTML=h+'<div class="empty">Графики появятся после первой записанной тренировки.<br>Для каждого упражнения будет видно, как растёт рабочий вес.</div>'+achHtml();return;}
  var opts=gs.map(function(g){
    var o=g.ex.filter(function(e){return withHist[e.id];}).map(function(e){return '<option value="'+e.id+'"'+(e.id===state.progEx?' selected':'')+'>'+esc(e.name)+'</option>';}).join("");
    return o?'<optgroup label="'+esc(g.name)+'">'+o+'</optgroup>':'';
  }).join("");
  var hist=exHistory(state.progEx);
  var exm=exMode(state.progEx);
  var useReps=exm!=="w"||hist.every(function(p){return p.top<=0;});
  var best=hist.reduce(function(b,p){var v=useReps?p.reps:p.top,bv=useReps?b.reps:b.top;return v>bv||(v===bv&&p.reps>b.reps)?p:b;},hist[0]);
  var first=hist[0],last=hist[hist.length-1];
  var diff=useReps?last.reps-first.reps:Math.round((last.top-first.top)*100)/100;
  var unit=exm==="time"?" сек":useReps?" раз":" кг";
  var g=state.config.goals[state.progEx];
  h+='<div class="sec-title">Упражнение</div><select class="sel" id="progSel" aria-label="Упражнение">'+opts+'</select>'+
    '<div class="stats"><div class="stat"><small>Тренировок</small><b>'+hist.length+'</b></div>'+
    '<div class="stat"><small>Рекорд</small><b>'+(useReps?best.reps+unit:fmtNum(best.top)+'×'+best.reps)+'</b></div>'+
    '<div class="stat"><small>Прирост</small><b>'+(diff>0?'+':'')+fmtNum(diff)+unit+'</b></div></div>'+
    '<div class="chart">'+chartSvg(hist,useReps,g&&g.w)+'</div>'+goalCardHtml(state.progEx,hist,useReps)+
    '<details class="card plainlist"><summary>Все тренировки с этим упражнением ('+hist.length+')</summary><div class="lines">'+
    hist.slice().reverse().map(function(p){return '<div><span>'+fmtDate(p.date,true)+'</span><span>'+esc(setsText(p.entry))+'</span></div>';}).join("")+'</div></details>';
  var rows=comparison(state.cmpMonths);
  h+='<div class="sec-title">Было → стало</div><div class="card"><div class="seg">'+[[1,"Месяц"],[3,"3 месяца"],[6,"Полгода"]].map(function(o){return '<button class="'+(state.cmpMonths===o[0]?'on':'')+'" data-act="cmp" data-m="'+o[0]+'">'+o[1]+'</button>';}).join("")+'</div>'+
    (rows.length?'<div class="cmp">'+rows.map(function(r){var up=r.diff>0,dn=r.diff<0;
      return '<div class="crow"><span class="cname">'+esc(exName(r.exId))+(r.since?'<small>с '+fmtDate(r.fromDate)+'</small>':'')+'</span><span class="cval">'+fmtNum(r.from)+' → <b>'+fmtNum(r.to)+'</b> '+r.unit+'</span><span class="cdiff '+(up?'up':dn?'down':'')+'">'+(up?'+':'')+fmtNum(r.diff)+(r.pct?' ('+(up?'+':'')+r.pct+'%)':'')+'</span></div>';}).join("")+'</div>':'<p class="hint left">Сравнение появится, когда по упражнению будет хотя бы две тренировки.</p>')+'</div>';
  h+=achHtml();
  view.innerHTML=h;
}
function achHtml(){
  var s=allStats();var got=ACH.filter(function(a){return a.test(s);}).length;
  return '<div class="sec-title">Достижения · '+got+' из '+ACH.length+'</div><div class="achgrid">'+ACH.map(function(a){
    var ok=a.test(s);var pr=!ok&&a.prog?a.prog(s):null;
    return '<div class="ach'+(ok?' ok':'')+'" title="'+esc(a.desc)+'"><span class="aic">'+a.ic+'</span><b>'+esc(a.name)+'</b><small>'+(ok?'получено':pr?Math.min(pr[0],pr[1])+' / '+pr[1]:esc(a.desc))+'</small>'+(pr?'<i class="apb"><i style="width:'+Math.min(100,Math.round(pr[0]/pr[1]*100))+'%"></i></i>':'')+'</div>';
  }).join("")+'</div>';
}
