/* ---------- настройки ---------- */
function confirmBtns(kind,id,label){
  var ask=state.confirm&&state.confirm.kind===kind&&state.confirm.id===id;
  return ask?'<span class="btns"><button class="btn solid-danger" data-act="del-'+kind+'" data-id="'+id+'">Удалить</button><button class="btn" data-act="cancel">Нет</button></span>'
            :'<button class="rm" data-act="ask" data-k="'+kind+'" data-id="'+id+'">'+(label||"Удалить")+'</button>';
}
function renderSettings(){
  var h='<div class="sec-title">Мои тренировки</div>'+
    '<p class="hint left">Тренировка — это набор групп мышц. Перед занятием выбираешь, какую делаешь сегодня. ★ — упражнения, рекомендованные программой.</p>'+
    '<button class="btn primary wide" data-act="lib">📚 Готовые программы и планы на месяц</button>';
  programs().forEach(function(p){
    var usedIds={};p.slots.forEach(function(s){usedIds[s.gid]=true;});
    var slots=p.slots.map(function(s,i){
      var g=group(s.gid);if(!g||g.archived)return "";
      var pref=(s.pref||[]).map(exName).join(", ");
      return '<div class="slot"><span class="sname">'+esc(g.name)+(pref?'<small>★ '+esc(pref)+'</small>':'')+'</span>'+
        '<span class="stepper" title="Сколько упражнений из группы"><button data-act="cnt" data-p="'+p.id+'" data-i="'+i+'" data-d="-1" aria-label="Меньше упражнений"'+(s.count<=1?' disabled':'')+'>−</button><b>'+s.count+'</b><button data-act="cnt" data-p="'+p.id+'" data-i="'+i+'" data-d="1" aria-label="Больше упражнений"'+(s.count>=5?' disabled':'')+'>+</button></span>'+
        '<span class="mv"><button data-act="mv" data-p="'+p.id+'" data-i="'+i+'" data-d="-1" aria-label="Выше"'+(i===0?' disabled':'')+'>↑</button><button data-act="mv" data-p="'+p.id+'" data-i="'+i+'" data-d="1" aria-label="Ниже"'+(i===p.slots.length-1?' disabled':'')+'>↓</button></span>'+
        '<button class="x2" data-act="rmslot" data-p="'+p.id+'" data-i="'+i+'" aria-label="Убрать группу из тренировки">×</button></div>';
    }).join("");
    var free=liveGroups().filter(function(g){return !usedIds[g.id];});
    var R=p.reps;
    h+='<div class="card prog"><div class="hrow"><input class="nameinp" id="pn-'+p.id+'" data-ren="p" data-id="'+p.id+'" value="'+esc(p.name)+'" aria-label="Название тренировки">'+
      (programs().length>1?confirmBtns("p",p.id):'')+'</div>'+
      (R?'<div class="preps">Свои повторы: '+R.sets+' × '+(R.lo===R.hi?R.lo:R.lo+'–'+R.hi)+' <button class="linkbtn" data-act="repsoff" data-p="'+p.id+'">как в общих настройках</button></div>':'')+
      '<div class="slothead"><span>Группа мышц</span><span>Упражнений</span></div>'+
      '<div class="slots">'+(slots||'<p>Добавь группы мышц ниже</p>')+'</div>'+
      (free.length?'<select class="sel small" id="add-slot-'+p.id+'" data-addslot="'+p.id+'" aria-label="Добавить группу"><option value="">+ Добавить группу мышц…</option>'+free.map(function(g){return '<option value="'+g.id+'">'+esc(g.name)+'</option>';}).join("")+'</select>':'')+
      '</div>';
  });
  h+='<form class="addrow" data-form="prog"><input id="newProg" placeholder="Название новой тренировки" aria-label="Название новой тренировки"><button class="btn primary" type="submit">Создать</button></form>';

  var pw=state.config.plan&&planDef(state.config.plan.id);
  h+='<div class="sec-title">План на месяц</div><div class="card">'+(pw
      ?'<p><b style="color:var(--ink)">'+esc(pw.name)+'</b> · начат '+fmtDate(state.config.plan.start)+'</p><div class="pweeks">'+pw.weeks.map(function(w,i){return '<span><b>Нед. '+(i+1)+'</b>'+w.sets+'×'+(w.lo===w.hi?w.lo:w.lo+'–'+w.hi)+(w.load<1?'<small>'+Math.round(w.load*100)+'% веса</small>':'')+'</span>';}).join("")+'</div><div class="btns"><button class="btn" data-act="lib" data-lt="plans">Сменить план</button><button class="btn danger" data-act="planoff">Убрать план</button></div>'
      :'<p>План меняет повторы и подходы по неделям: 3 недели нагрузка растёт, 4-я — разгрузка. Подходит к любой программе.</p><button class="btn" data-act="lib" data-lt="plans">Выбрать план</button>')+'</div>';

  h+='<div class="sec-title">Группы мышц и упражнения</div><p class="hint left">У каждого упражнения два переключателя, нажми чтобы поменять: <b>кг / без веса / сек</b> — как записывать подходы; <b>Тяж. / Сред. / Изол. / Лёгк.</b> — сколько отдыхать.</p>';
  liveGroups().forEach(function(g,gi){
    var rows=g.ex.filter(function(e){return !e.archived;}).map(function(e){
      return '<div class="exrow"><span>'+esc(e.name)+(e.backRisk?' <span class="risk" title="Нагрузка на поясницу">⚠️</span>':'')+'</span>'+modeChip(e.id)+kindChip(e.id,"button")+confirmBtns("e",e.id)+'</div>'+modePicker(e.id);
    }).join("");
    var mopts='<option value="">не показывать</option>'+Object.keys(MUSCLES).map(function(k){return '<option value="'+k+'"'+(g.muscle===k?' selected':'')+'>'+MUSCLES[k]+'</option>';}).join("");
    h+='<details class="card gcard"'+(state.openGroup===g.id?' open':'')+' data-gd="'+g.id+'"><summary>'+plate(gi)+'<span class="gsum">'+esc(g.name)+'</span><em>'+g.ex.filter(function(e){return !e.archived;}).length+'</em></summary>'+
      '<div class="gbody"><div class="hrow"><input class="nameinp" id="gn-'+g.id+'" data-ren="g" data-id="'+g.id+'" value="'+esc(g.name)+'" aria-label="Название группы">'+confirmBtns("g",g.id,"Удалить группу")+'</div>'+
      '<label class="mline">На карте мышц<select class="sel small" id="gm-'+g.id+'" data-gmuscle="'+g.id+'">'+mopts+'</select></label>'+
      '<div>'+(rows||'<div class="hint">Пока пусто</div>')+'</div>'+
      '<form class="addrow" data-form="ex" data-g="'+g.id+'"><input id="add-'+g.id+'" placeholder="Новое упражнение" aria-label="Новое упражнение"><button class="btn primary" type="submit">Добавить</button></form></div></details>';
  });
  h+='<form class="addrow" data-form="group"><input id="newGroup" placeholder="Новая группа мышц" aria-label="Новая группа мышц"><button class="btn primary" type="submit">Создать</button></form>';

  var s=settings();
  h+='<div class="sec-title">Подходы, повторы, цель</div><div class="card">'+
    '<div class="setgrid four">'+
    '<label>Повторов от<input id="setRepLo" type="number" inputmode="numeric" min="1" max="50" value="'+s.repLo+'"></label>'+
    '<label>Повторов до<input id="setRepHi" type="number" inputmode="numeric" min="1" max="50" value="'+s.repHi+'"></label>'+
    '<label>Подходов<input id="setSets" type="number" inputmode="numeric" min="1" max="10" value="'+s.sets+'"></label>'+
    '<label>Тренировок в неделю<input id="setWeek" type="number" inputmode="numeric" min="1" max="7" value="'+s.weekGoal+'"></label>'+
    '</div><p>Когда сделаешь верхнюю границу во всех подходах, приложение предложит прибавить вес. Если у программы или плана свои повторы, действуют они.</p></div>';

  h+='<div class="sec-title">Оформление</div><div class="card"><div class="swatches">'+ACCENTS.map(function(a){return '<button class="sw sw-'+a[0]+(s.accent===a[0]?' on':'')+'" data-act="accent" data-a="'+a[0]+'" aria-label="'+a[1]+'" title="'+a[1]+'"></button>';}).join("")+'</div>'+
    (IS_ARTIFACT?'':'<div class="seg">'+[["auto","Как в системе"],["light","Светлая"],["dark","Тёмная"]].map(function(o){return '<button class="'+(s.theme===o[0]?'on':'')+'" data-act="theme" data-th="'+o[0]+'">'+o[1]+'</button>';}).join("")+'</div>')+'</div>';

  h+='<div class="sec-title">Резервная копия</div><div class="card">'+
    '<p>'+(IS_ARTIFACT?'Скопируй данные, чтобы перенести их в отдельное приложение или на другой телефон.':'Все записи хранятся только на этом телефоне. Время от времени сохраняй копию — с ней данные можно перенести на новый телефон.')+'</p>'+
    '<div class="btns">'+((IS_ARTIFACT||window.Capacitor)?'':'<button class="btn primary" data-act="export">Сохранить файлом</button><label class="btn" for="importFile">Загрузить из файла</label><input type="file" id="importFile" accept=".json,application/json,text/plain" hidden>')+
    '<button class="btn'+((IS_ARTIFACT||window.Capacitor)?' primary':'')+'" data-act="copyData">Скопировать текстом</button></div>'+
    '<details><summary class="sumlink">Вставить данные текстом</summary>'+
    '<div class="col"><textarea id="importText" placeholder="Вставь сюда скопированные данные"></textarea>'+
    '<button class="btn" data-act="importText">Загрузить</button></div></details>'+
    (state.pendingImport?'<div class="card warn"><p><b>Заменить данные?</b> В копии тренировок: '+Object.keys(state.pendingImport.workouts).length+'. Текущие записи будут заменены.</p><div class="btns"><button class="btn solid-danger" data-act="importYes">Заменить</button><button class="btn" data-act="importNo">Отмена</button></div></div>':'')+
    '<span class="msg '+(state.msg&&state.msg.ok?'ok':'err')+'" id="backupMsg">'+(state.msg?esc(state.msg.text):'')+'</span></div>';
  view.innerHTML=h;
}

/* ---------- окна ---------- */
function openModal(m){state.modal=m;renderModal();}
function closeModal(){state.modal=null;renderModal();}
function renderModal(){
  var el=document.getElementById("modal");var m=state.modal;
  if(!m){el.hidden=true;el.innerHTML="";document.body.classList.remove("noscroll");return;}
  document.body.classList.add("noscroll");el.hidden=false;
  var inner="";
  if(m.type==="summary"){
    var w=state.workouts[m.date]||state.draft;var dur=workoutDuration(w);var recs=workoutRecords(w);
    inner='<div class="mhead"><h2>'+(m.fresh?'Тренировка завершена 💪':'Итог тренировки')+'</h2><button class="x" data-act="mclose" aria-label="Закрыть">×</button></div>'+
      '<p class="msub">'+fmtDate(w.date,true)+(programName(w.programId)?' · '+esc(programName(w.programId)):'')+'</p>'+
      '<div class="sumgrid"><div><small>Время</small><b>'+(dur?fmtDur(dur):'—')+'</b></div><div><small>Поднято</small><b>'+fmtBig(tonnage(w))+' кг</b></div><div><small>Упражнений</small><b>'+doneEntries(w).length+'</b></div><div><small>Подходов</small><b>'+setsCount(w)+'</b></div></div>'+
      (function(){var cm=pickThing(tonnage(w),Math.floor(Math.random()*1e9));return cm?'<div class="cmpline"><span class="cmpic">'+cm.t.ic+'</span><span>Это как поднять <b>'+esc(cm.text)+'</b><small>по ≈ '+fmtBig(cm.each)+' кг</small></span></div>':'';})()+
      '<p class="quote">«'+esc(pickQuote(Math.floor(Math.random()*1e9)))+'»</p>'+
      (recs.length?'<div class="recs"><b>🏆 '+recs.length+' '+plural(recs.length,'рекорд','рекорда','рекордов')+'</b>'+recs.map(function(r){return '<div><span>'+esc(exName(r.exId))+'</span><span>'+fmtSet(r.exId,r.w,r.r)+'</span></div>';}).join("")+'</div>':'')+
      (m.fresh&&m.ach&&m.ach.length?'<div class="recs ach"><b>Новые достижения</b>'+m.ach.map(function(id){var a=ACH.filter(function(x){return x.id===id;})[0];return '<div><span>'+a.ic+' '+esc(a.name)+'</span></div>';}).join("")+'</div>':'')+
      '<div class="btns"><button class="btn primary" data-act="card" data-d="'+w.date+'">Сделать карточку</button><button class="btn" data-act="mclose">Закрыть</button></div>';
  }else if(m.type==="card"){
    inner='<div class="mhead"><h2>Карточка тренировки</h2><button class="x" data-act="mclose" aria-label="Закрыть">×</button></div>'+
      '<div class="seg"><button class="'+(state.cardFormat!=="story"?'on':'')+'" data-act="cardfmt" data-f="post">Пост 4:5</button><button class="'+(state.cardFormat==="story"?'on':'')+'" data-act="cardfmt" data-f="story">Сторис 9:16</button></div>'+
      '<div class="cardprev'+(state.cardFormat==="story"?' story':'')+'">'+(m.url?'<img src="'+m.url+'" alt="Карточка тренировки">':'<div class="hint">Рисую…</div>')+'</div>'+
      '<div class="btns"><button class="btn primary" data-act="cardshare"'+(m.url?'':' disabled')+'>'+(IS_ARTIFACT?'Скачать картинку':'Поделиться')+'</button><button class="btn" data-act="cardre">🎲 Другой вариант</button></div><span class="msg" id="cardMsg"></span>';
  }else if(m.type==="library"){
    var lt=state.libTab;
    inner='<div class="mhead"><h2>Готовые программы</h2><button class="x" data-act="mclose" aria-label="Закрыть">×</button></div>'+
      '<div class="seg"><button class="'+(lt==="programs"?'on':'')+'" data-act="libtab" data-lt="programs">Программы ('+TEMPLATES.length+')</button><button class="'+(lt==="plans"?'on':'')+'" data-act="libtab" data-lt="plans">Планы на месяц ('+PLANS.length+')</button></div>';
    if(lt==="programs"){
      inner+='<p class="msub">«Добавить» — программа появится рядом с твоими тренировками. «Заменить мои» — уберёт текущие (история сохранится).</p><div class="tlist">'+TEMPLATES.map(templateCard).join("")+'</div>';
    }else{
      var cur=state.config.plan&&state.config.plan.id;
      inner+='<p class="msub">План работает поверх любой программы: меняет повторы, подходы и вес по неделям. Начнётся с этой недели.</p><div class="tlist">'+PLANS.map(function(p){
        return '<div class="tcard"><div class="thead"><b>'+esc(p.name)+'</b>'+(cur===p.id?'<span class="back b-safe">Сейчас</span>':'')+'</div><p>'+esc(p.desc)+'</p><div class="pweeks">'+p.weeks.map(function(w,i){return '<span><b>Нед. '+(i+1)+'</b>'+w.sets+'×'+(w.lo===w.hi?w.lo:w.lo+'–'+w.hi)+'<small>'+esc(w.label)+'</small></span>';}).join("")+'</div>'+
          '<div class="btns"><button class="btn primary" data-act="planset" data-pl="'+p.id+'">'+(cur===p.id?'Начать заново':'Выбрать')+'</button></div></div>';
      }).join("")+'</div>';
    }
  }
  el.innerHTML='<div class="mback" data-act="mclose"></div><div class="mbox" role="dialog" aria-modal="true">'+inner+'</div>';
}
function openCard(date,keepSeed){
  var w=date===state.date?state.draft:state.workouts[date];if(!w)return;
  if(!keepSeed)state.cardSeed=Math.floor(Math.random()*1e9);
  var keepScroll=state.modal&&state.modal.type==="card";
  openModal({type:"card",date:date,url:keepScroll&&state.modal.url||null});
  cardFonts().then(function(){var c=drawCard(w,{seed:state.cardSeed,format:state.cardFormat});state.cardCanvas=c;if(state.modal&&state.modal.type==="card"){state.modal.url=c.toDataURL("image/png");renderModal();}});
}

/* ---------- резервная копия ---------- */
function backupData(){return {app:"dnevnik-zala",version:3,exported:new Date().toISOString(),config:state.config,workouts:state.workouts};}
function prepareImport(text){
  var d=null;try{d=JSON.parse(String(text).trim());}catch(e){}
  if(!d||!d.config||!d.config.groups||typeof d.workouts!=="object"){state.msg={ok:false,text:"Не получилось прочитать копию. Проверь, что это данные из «Дневника зала»."};state.pendingImport=null;}
  else{state.pendingImport={config:migrate(d.config),workouts:d.workouts||{}};state.msg=null;}
  rerender(renderSettings);
}
function copyData(){
  flush();
  var text=JSON.stringify(backupData());
  var done=function(){state.msg={ok:true,text:"Скопировано ✓ Сохрани текст в заметках или отправь себе в мессенджер"};rerender(renderSettings);};
  var fallback=function(){
    var ta=document.getElementById("importText");var det=ta&&ta.closest("details");
    if(det)det.open=true;if(ta){ta.value=text;ta.focus();ta.select();}
    var m=document.getElementById("backupMsg");if(m){m.className="msg ok";m.textContent="Текст выделен — скопируй его";}
  };
  try{navigator.clipboard.writeText(text).then(done,fallback);}catch(e){fallback();}
}
function doExport(){
  flush();
  var name="dnevnik-zala-"+todayIso()+".json";
  var blob=new Blob([JSON.stringify(backupData())],{type:"application/json"});
  try{var file=new File([blob],name,{type:"application/json"});
    if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:"Дневник зала — копия"}).then(function(){state.msg={ok:true,text:"Копия сохранена"};rerender(renderSettings);},function(){});return;}
  }catch(e){}
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);
  state.msg={ok:true,text:"Файл "+name+" сохранён в загрузки"};rerender(renderSettings);
}
