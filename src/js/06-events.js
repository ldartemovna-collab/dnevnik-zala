/* ---------- события ---------- */
document.querySelector(".tabs").addEventListener("click",function(e){
  var t=e.target.closest(".tab");if(!t)return;
  flush();state.tab=t.dataset.tab;state.confirm=null;state.msg=null;state.swap=null;state.editGoal=null;render();window.scrollTo(0,0);
});
function goDate(iso){if(!iso)return;flush();state.date=iso;loadDraft();render();window.scrollTo(0,0);}
document.getElementById("dateInput").addEventListener("change",function(e){goDate(e.target.value);});
document.getElementById("prevDay").addEventListener("click",function(){goDate(shiftIso(state.date,-1));});
document.getElementById("nextDay").addEventListener("click",function(){goDate(shiftIso(state.date,1));});
document.getElementById("rbMinus").addEventListener("click",function(){if(rest.done)return;rest.endAt-=15000;rest.total=Math.max(rest.total-15,1);tickRest();});
document.getElementById("rbPlus").addEventListener("click",function(){if(rest.done){rest.done=false;rest.endAt=Date.now()+15000;rest.total=15;}else{rest.endAt+=15000;rest.total+=15;}tickRest();});
document.getElementById("rbStop").addEventListener("click",stopRest);
document.addEventListener("pointerdown",unlockAudio,{passive:true});

function saveCfg(fn){store.saveConfig();rerender(fn||render);}
function findEntry(gid,exId){return state.draft.entries.filter(function(x){return x.gid===gid&&x.exId===exId;})[0]||null;}
function refreshCurrent(){rerender(state.tab==="workout"?renderWorkout:state.tab==="history"?renderHistory:state.tab==="progress"?renderProgress:renderSettings);}

document.addEventListener("click",function(e){
  var mm=e.target.closest&&e.target.closest(".mm");
  if(mm){var m=mm.dataset.m;var n=muscleLoad(7)[m]||0;var info=document.getElementById("mmInfo");if(info)info.textContent=MUSCLES[m]+": "+(n?n+" "+plural(n,"подход","подхода","подходов")+" за неделю":"не было за неделю");return;}
  var b=e.target.closest&&e.target.closest("[data-act]");if(!b||b.disabled)return;
  if(b.closest(".tabs"))return;
  var act=b.dataset.act,gid=b.dataset.g,exId=b.dataset.e,id=b.dataset.id;
  var ents=state.draft.entries;
  switch(act){
  case "prog":{
    state.draft.programId=b.dataset.p;state.config.lastProgram=b.dataset.p;
    /* убираем невыполненные упражнения, которых нет в выбранной программе */
    var np=program(b.dataset.p);var before=ents.length;
    state.draft.entries=ents.filter(function(en){return entryDone(en)||(np&&np.slots.some(function(s){return s.gid===en.gid;}));});
    if(before||state.draft.entries.length!==before)touch();store.saveConfig();rerender(renderWorkout);
    var kept=state.draft.entries.filter(function(en){return np&&!np.slots.some(function(s){return s.gid===en.gid;});}).length;
    if(kept)toast("Начатые упражнения из другой тренировки оставила — их можно убрать кнопкой ✕");
    break;}
  case "rmentry":{
    var key=gid+"|"+exId;var er=findEntry(gid,exId);if(!er)return;
    if(entryDone(er)&&state.rmAsk!==key){state.rmAsk=key;rerender(renderWorkout);toast("В упражнении уже есть подходы — нажми ✕ ещё раз, чтобы убрать");return;}
    state.rmAsk=null;state.draft.entries=state.draft.entries.filter(function(x){return x!==er;});touch();rerender(renderWorkout);break;}
  case "pick":{
    var count=+b.dataset.c||1;
    var idx=-1;ents.forEach(function(en,i){if(en.gid===gid&&en.exId===exId)idx=i;});
    if(idx>=0)ents.splice(idx,1);
    else if(count>1){if(ents.filter(function(en){return en.gid===gid;}).length>=count){toast("В этой группе уже "+count+" "+plural(count,"упражнение","упражнения","упражнений")+" — сними одно, чтобы выбрать другое");return;}ents.push(newEntry(gid,exId));}
    else{state.draft.entries=ents.filter(function(en){return en.gid!==gid;});state.draft.entries.push(newEntry(gid,exId));}
    touch();rerender(renderWorkout);break;}
  case "fill":
    currentSlots().forEach(function(s){
      if(!s.pref||!s.pref.length)return;
      if(state.draft.entries.some(function(en){return en.gid===s.gid;}))return;
      s.pref.filter(function(x){var f=findEx(x);return f&&!f.e.archived;}).slice(0,s.count).forEach(function(x){state.draft.entries.push(newEntry(s.gid,x));});
    });
    touch();rerender(renderWorkout);break;
  case "addset":case "delset":{
    var en=findEntry(gid,exId);if(!en)return;
    if(act==="addset"){var lw=en.sets.length?en.sets[en.sets.length-1].w:null;en.sets.push({w:lw,r:null});}
    else en.sets.splice(+b.dataset.i,1);
    touch();rerender(renderWorkout);break;}
  case "wminus":case "wplus":{
    var en2=findEntry(gid,exId);if(!en2)return;var i=+b.dataset.i;var s=en2.sets[i];var old=s.w||0;
    var st=act==="wplus"?stepFor(old):stepFor(Math.max(0,old-0.01));
    var nw=Math.max(0,Math.round((old+(act==="wplus"?st:-st))*100)/100);
    s.w=nw||null;
    for(var j=i+1;j<en2.sets.length;j++){var sj=en2.sets[j];if(!(sj.r>0)&&(sj.w||0)===old)sj.w=s.w;}
    en2.sets.forEach(function(sx,k){var inp=document.getElementById("w-"+exId+"-"+k);if(inp)inp.value=fmtNum(sx.w);});
    touch();break;}
  case "note":
    state.editNote=exId;rerender(renderWorkout);
    var ni=document.getElementById("note-"+exId);if(ni){ni.focus();ni.select();}break;
  case "noteok":{var inp2=document.querySelector("[data-note]");if(inp2)saveNote(inp2.dataset.note,inp2.value);break;}
  case "dropadd":{
    var ed=findEntry(gid,exId);if(!ed)return;var sd=ed.sets[+b.dataset.i];sd.drops=sd.drops||[];
    var lastW=sd.drops.length?sd.drops[sd.drops.length-1].w:sd.w;var nw2=lastW?Math.max(0,roundW(lastW*0.7)):null;if(nw2===lastW&&nw2>0)nw2=Math.max(0,nw2-stepFor(nw2));
    sd.drops.push({w:nw2,r:null});touch();rerender(renderWorkout);
    var di=document.getElementById("dr-"+exId+"-"+b.dataset.i+"-"+(sd.drops.length-1));if(di)di.focus();break;}
  case "dropdel":{var ed2=findEntry(gid,exId);if(!ed2)return;var sd2=ed2.sets[+b.dataset.i];if(sd2.drops)sd2.drops.splice(+b.dataset.d,1);touch();rerender(renderWorkout);break;}
  case "collapse":case "expand":{var ec=findEntry(gid,exId);if(!ec)return;ec.collapsed=act==="collapse";touch();rerender(renderWorkout);break;}
  case "collapseall":case "expandall":state.draft.entries.forEach(function(en){en.collapsed=act==="collapseall";});touch();rerender(renderWorkout);break;
  case "reorder":state.reorder=!state.reorder;rerender(renderWorkout);break;
  case "orddone":state.reorder=false;rerender(renderWorkout);break;
  case "ordsave":{
    var pr2=program(state.draft.programId);if(!pr2)return;var keys=workoutItems().map(function(it){return it.k;});
    pr2.order=keys;var gOrd=[];keys.forEach(function(k){var gid2=k.slice(2).split("|")[0];if(gOrd.indexOf(gid2)<0)gOrd.push(gid2);});
    pr2.slots.sort(function(x,y){var ix=gOrd.indexOf(x.gid),iy=gOrd.indexOf(y.gid);return (ix<0?99:ix)-(iy<0?99:iy);});
    store.saveConfig();toast("Порядок сохранён в программе «"+esc(pr2.name)+"»");break;}
  case "catalog":state.catQuery="";state.catAll=false;state.catHome=false;openModal({type:"catalog",gid:gid,count:+b.dataset.c||0,ctx:b.dataset.ctx||"workout"});break;
  case "catall":state.catAll=!state.catAll;renderModal();applyCatFilter();break;
  case "cathome":state.catHome=!state.catHome;renderModal();applyCatFilter();break;
  case "catadd":{
    var mm=state.modal;if(!mm)return;var newId=addFromCatalog(mm.gid,b.dataset.c);if(!newId)return;
    store.saveConfig();
    if(mm.ctx==="workout"){
      var cnt=mm.count||1;var inG=state.draft.entries.filter(function(en){return en.gid===mm.gid;});
      if(!inG.some(function(en){return en.exId===newId;})){
        if(cnt<=1){state.draft.entries=state.draft.entries.filter(function(en){return en.gid!==mm.gid||entryDone(en);});state.draft.entries.push(newEntry(mm.gid,newId));}
        else if(inG.length<cnt)state.draft.entries.push(newEntry(mm.gid,newId));
        touch();
      }
      closeModal();rerender(renderWorkout);toast("«"+esc(exName(newId))+"» добавлено в группу");
    }else{renderModal();applyCatFilter();refreshCurrent();}
    break;}
  case "mode":state.modePick=state.modePick===exId?null:exId;refreshCurrent();break;
  case "modeset":{
    var fm=findEx(exId);if(!fm)return;fm.e.mode=b.dataset.m;state.modePick=null;
    if(fm.e.mode!=="w")state.draft.entries.forEach(function(en){if(en.exId===exId)en.sets.forEach(function(sx){if(!(sx.r>0))sx.w=null;});});
    else state.draft.entries.forEach(function(en){if(en.exId===exId){var nr=newEntry(en.gid,exId);en.sets.forEach(function(sx,k){if(!(sx.r>0)&&nr.sets[k])sx.w=nr.sets[k].w;});}});
    if(state.draft.entries.some(function(en){return en.exId===exId;}))touch();
    store.saveConfig();refreshCurrent();toast(MODES[fm.e.mode].name+": «"+esc(exName(exId))+"»");break;}
  case "kind":{var f=findEx(exId);if(!f)return;var k=KIND_ORDER.indexOf(f.e.kind);f.e.kind=KIND_ORDER[(k+1)%KIND_ORDER.length];delete state.config.restLearn[exId];saveCfg(renderSettings);break;}
  case "swap":state.swap=gid+"|"+exId;rerender(renderWorkout);break;
  case "swapcancel":state.swap=null;rerender(renderWorkout);break;
  case "swapto":{
    var en3=findEntry(gid,exId);if(!en3)return;
    var to=b.dataset.to;var fresh=newEntry(gid,to);
    en3.exId=to;en3.sets=fresh.sets;
    state.swap=null;touch();rerender(renderWorkout);toast("Заменила на «"+esc(exName(to))+"»");break;}
  case "sspick":state.ssPick=state.ssPick===gid+"|"+exId?null:gid+"|"+exId;rerender(renderWorkout);break;
  case "sscancel":state.ssPick=null;rerender(renderWorkout);break;
  case "sslink":{
    var p=state.ssPick.split("|");var a=findEntry(p[0],p[1]),c=findEntry(gid,exId);
    if(a&&c){var sid=uid("ss");a.ss=sid;c.ss=sid;}
    state.ssPick=null;touch();rerender(renderWorkout);toast("🔗 Суперсет: делай подходы по очереди, отдых — после пары");break;}
  case "ssoff":{var en4=findEntry(gid,exId);var pa=en4&&partnerOf(en4);if(en4)delete en4.ss;if(pa)delete pa.ss;touch();rerender(renderWorkout);break;}
  case "finish":finishWorkout();break;
  case "summary":openModal({type:"summary",date:state.date});break;
  case "card":openCard(b.dataset.d||state.date);break;
  case "cardshare":{
    var msg=document.getElementById("cardMsg");if(!state.cardCanvas)return;
    shareImage(state.cardCanvas,"trenirovka-"+(state.modal&&state.modal.date||todayIso())+".png").then(function(r){if(msg){msg.className="msg ok";msg.textContent=r==="saved"?"Картинка сохранена":"Готово";}}).catch(function(err){
      if(err&&(err.code==="declined"||err.name==="AbortError"||/cancel/i.test(err.message||"")))return;
      if(msg){msg.className="msg err";msg.textContent="Не получилось. Сделай скриншот картинки выше.";}
    });break;}
  case "cardfmt":state.cardFormat=b.dataset.f;openCard(state.modal.date,true);break;
  case "cardre":openCard(state.modal.date,false);break;
  case "impopen":state.impPreview=null;openModal({type:"import"});break;
  case "impparse":{var ta2=document.getElementById("impText");state.impText=ta2?ta2.value:"";if(!state.impText.trim())return;
    state.impPreview=buildImportPreview(state.impText);
    if(!state.impPreview.length){state.impPreview=null;toast("Не нашла дат. Каждая тренировка должна начинаться со строки вида 11.03");return;}
    renderModal();document.querySelector(".mbox").scrollTop=0;break;}
  case "impback":state.impPreview=null;renderModal();break;
  case "impgo":{
    var res=applyImport(state.impPreview,!!state.impOver);
    store.replaceAll();checkAchievements(true);
    state.impPreview=null;state.impText="";closeModal();render();
    toast("Перенесено тренировок: "+res.added+(res.skipped?" · пропущено (уже были): "+res.skipped:"")+(res.exAdded?" · новых упражнений: "+res.exAdded:""));break;}
  case "mclose":closeModal();break;
  case "lib":state.libTab=b.dataset.lt||"programs";openModal({type:"library"});break;
  case "libtab":state.libTab=b.dataset.lt;renderModal();break;
  case "tpl":{
    var replace=b.dataset.mode==="replace";
    var first=installTemplate(b.dataset.t,replace);
    if(first&&(!state.draft.entries.length||replace))state.draft.programId=first;
    store.saveConfig();closeModal();state.tab="workout";render();window.scrollTo(0,0);
    toast(replace?"Программа установлена 💪":"Программа добавлена — выбирай её вверху");break;}
  case "onbskip":state.config.onboarded=true;saveCfg(renderWorkout);break;
  case "planset":state.config.plan={id:b.dataset.pl,start:mondayOf(todayIso())};store.saveConfig();closeModal();render();toast("План на месяц начат — неделя 1");break;
  case "planrestart":state.config.plan.start=mondayOf(todayIso());saveCfg();break;
  case "planoff":state.config.plan=null;saveCfg();break;
  case "repsoff":{var pr=program(b.dataset.p);if(pr)delete pr.reps;saveCfg(renderSettings);break;}
  case "calprev":case "calnext":{var d0=dateObj(state.calMonth);d0.setMonth(d0.getMonth()+(act==="calnext"?1:-1));d0.setDate(1);state.calMonth=isoOf(d0);rerender(renderHistory);break;}
  case "openw":flush();state.date=b.dataset.d;loadDraft();state.tab="workout";render();window.scrollTo(0,0);break;
  case "ask":state.confirm={kind:b.dataset.k,id:id};refreshCurrent();break;
  case "cancel":state.confirm=null;refreshCurrent();break;
  case "delw":{
    var dd=b.dataset.d;delete state.workouts[dd];state.confirm=null;
    if(dd===state.date){clearTimeout(saveTimer);saveTimer=null;state.draft.entries=[];delete state.draft.startedAt;delete state.draft.finishedAt;state.dirty=0;}
    store.saveWorkout({date:dd,entries:[]});rerender(renderHistory);break;}
  case "del-e":{var fe=findEx(id);if(fe)fe.e.archived=true;state.confirm=null;
    state.draft.entries=state.draft.entries.filter(function(x){return !(x.exId===id&&!entryDone(x));});saveCfg(renderSettings);break;}
  case "del-g":{var g=group(id);if(g)g.archived=true;state.confirm=null;
    state.config.programs.forEach(function(p){p.slots=p.slots.filter(function(s){return s.gid!==id;});});saveCfg(renderSettings);break;}
  case "del-p":{var pp=program(id);if(pp&&programs().length>1)pp.archived=true;state.confirm=null;
    if(state.config.lastProgram===id)state.config.lastProgram=programs()[0].id;
    if(state.draft.programId===id)state.draft.programId=state.config.lastProgram;saveCfg(renderSettings);break;}
  case "cnt":{var p2=program(b.dataset.p);var sl=p2.slots[+b.dataset.i];sl.count=Math.max(1,Math.min(5,sl.count+(+b.dataset.d)));saveCfg(renderSettings);break;}
  case "mv":{var p3=program(b.dataset.p);var a1=+b.dataset.i,a2=a1+(+b.dataset.d);if(a2<0||a2>=p3.slots.length)return;var t=p3.slots[a1];p3.slots[a1]=p3.slots[a2];p3.slots[a2]=t;saveCfg(renderSettings);break;}
  case "rmslot":{var p4=program(b.dataset.p);p4.slots.splice(+b.dataset.i,1);saveCfg(renderSettings);break;}
  case "allmuscles":state.showAllMuscles=!state.showAllMuscles;rerender(renderProgress);break;
  case "cmp":state.cmpMonths=+b.dataset.m;rerender(renderProgress);break;
  case "progto":state.progEx=exId;renderProgress();var ps=document.getElementById("progSel");if(ps)ps.scrollIntoView({block:"center"});break;
  case "goaledit":state.editGoal=exId;rerender(renderProgress);break;
  case "goaldel":delete state.config.goals[exId];state.editGoal=null;saveCfg(renderProgress);break;
  case "accent":settings().accent=b.dataset.a;applyLook();saveCfg(renderSettings);break;
  case "theme":settings().theme=b.dataset.th;applyLook();saveCfg(renderSettings);break;
  case "export":doExport();break;
  case "copyData":copyData();break;
  case "importText":{var ta=document.getElementById("importText");if(ta&&ta.value.trim())prepareImport(ta.value);break;}
  case "importNo":state.pendingImport=null;rerender(renderSettings);break;
  case "importYes":
    if(!state.pendingImport)return;
    clearTimeout(saveTimer);saveTimer=null;
    state.config=clone(state.pendingImport.config);state.workouts=clone(state.pendingImport.workouts);
    state.pendingImport=null;applyLook();loadDraft();store.replaceAll();
    state.msg={ok:true,text:"Данные загружены: тренировок "+Object.keys(state.workouts).length};rerender(renderSettings);break;
  }
});
function ensureSessBar(){
  if(!state.draft.startedAt||document.querySelector(".sess"))return;
  var sum=view.querySelector(".summary");if(!sum)return;
  sum.insertAdjacentHTML("beforebegin",sessionHtml());
}
function saveNote(exId,val){var f=findEx(exId);if(f){var v=String(val).trim();if(v)f.e.note=v;else delete f.e.note;}state.editNote=null;store.saveConfig();rerender(renderWorkout);}
function finishWorkout(){
  var w=state.draft;
  if(!w.startedAt){var ts=[];w.entries.forEach(function(en){en.sets.forEach(function(s){if(s.t)ts.push(s.t);});});if(ts.length){w.startedAt=Math.min.apply(null,ts);w.lastAt=Math.max.apply(null,ts);}}
  w.finishedAt=w.date===todayIso()?Date.now():(w.lastAt||null);
  state.dirty++;
  state.workouts[w.date]=clone(w);
  var fresh=checkAchievements(true);
  flush();stopRest();keepAwake(false);
  if(workoutRecords(w).length||fresh.length)confetti();
  openModal({type:"summary",date:w.date,fresh:true,ach:fresh});
  rerender(renderWorkout);
}
/* Подход записан: время, рекорд, отдых */
function onSetLogged(en,i,noRest){
  var s=en.sets[i];var w=state.draft;
  if(w.date===todayIso()){
    if(!s.t)s.t=Date.now();
    if(!w.startedAt)w.startedAt=s.t;
    w.lastAt=Date.now();
    if(w.finishedAt)delete w.finishedAt;
    learnRest(en.exId,en,i);
  }
  /* рекорд */
  var prev=bestBefore(en.exId,w.date);
  w.prs=w.prs||{};
  var cand={w:s.w||0,r:s.r};var bar=w.prs[en.exId]&&betterEx(en.exId,w.prs[en.exId],prev)?w.prs[en.exId]:prev;
  if(prev&&betterEx(en.exId,cand,bar)&&(cand.w!==bar.w||cand.r!==bar.r)){
    w.prs[en.exId]=cand;confetti();buzz([60,40,60]);
    toast('<span class="big">🏆</span><span><b>Новый рекорд!</b><br>'+esc(exName(en.exId))+' — '+fmtSet(en.exId,cand.w,cand.r)+'</span>',"gold");
  }
  /* отдых */
  if(w.date!==todayIso())return;
  if(noRest){stopRest();return;}
  var partner=partnerOf(en);
  if(partner){
    var pi=partner.sets[i];
    if(pi&&!(pi.r>0)){
      stopRest();toast("Теперь «"+esc(exName(partner.exId))+"», подход "+(i+1));
      var target=view.querySelector('[data-entry="'+entryKey(partner).replace(/"/g,'\\"')+'"]');if(target)target.scrollIntoView({behavior:"smooth",block:"center"});
      return;
    }
    var r1=suggestedRest(en.exId,s),r2=suggestedRest(partner.exId,partner.sets[i]||s);
    startRest(Math.max(r1.sec,r2.sec),"Суперсет · после "+(i+1)+"-го круга");return;
  }
  var allDone=en.sets.every(function(x){return x.r>0;});
  var r=suggestedRest(en.exId,s);
  startRest(r.sec,exName(en.exId)+(allDone?" · упражнение готово":" · после "+(i+1)+"-го подхода")+(r.why?" ("+r.why+")":""));
}
view.addEventListener("input",function(e){
  var t=e.target;if(!t.dataset||!t.dataset.f)return;
  var en=findEntry(t.dataset.g,t.dataset.e);if(!en)return;
  var s=en.sets[+t.dataset.i];if(!s)return;
  var v=parseNum(t.value);
  if(t.dataset.f==="dw"||t.dataset.f==="dr"){var d=(s.drops||[])[+t.dataset.d];if(!d)return;if(t.dataset.f==="dr")d.r=v===null?null:Math.round(v);else d.w=v;touch();return;}
  if(t.dataset.f==="r")s.r=v===null?null:Math.round(v);else s.w=v;
  touch();updateSummary();
});
view.addEventListener("change",function(e){
  var t=e.target;
  if(t.dataset&&t.dataset.side){var fsd=findEx(t.dataset.side);if(fsd){fsd.e.side=t.checked;store.saveConfig();refreshCurrent();}return;}
  if(t.dataset&&t.dataset.f==="dr"){
    var end=findEntry(t.dataset.g,t.dataset.e);if(!end)return;var si=+t.dataset.i,dd=+t.dataset.d;var sx=end.sets[si];
    var rowd=t.closest(".set");if(rowd)rowd.classList.toggle("logged",sx.drops[dd].r>0);
    if(sx.drops[dd].r>0&&dd===sx.drops.length-1&&sx.r>0&&state.draft.date===todayIso()){var rr2=suggestedRest(end.exId,sx);startRest(rr2.sec,exName(end.exId)+" · дроп-сет "+(si+1)+"-го подхода");}
    touch();return;
  }
  if(t.dataset&&t.dataset.f==="r"){
    var en=findEntry(t.dataset.g,t.dataset.e);if(!en)return;var i=+t.dataset.i;
    var row=t.closest(".set");if(row)row.classList.toggle("logged",en.sets[i].r>0);
    if(en.sets[i].r>0){onSetLogged(en,i,(en.sets[i].drops||[]).length>0);touch();ensureSessBar();
      if(en.sets.every(function(x){return x.r>0;})&&!en.collapsed){en.collapsed=true;setTimeout(function(){var ae=document.activeElement;if(!(ae&&ae.tagName==="INPUT"&&view.contains(ae)))rerender(renderWorkout);},250);}
    }
    return;
  }
  if(t.dataset&&t.dataset.note){saveNote(t.dataset.note,t.value);return;}
  if(t.id==="progSel"){state.progEx=t.value;state.editGoal=null;renderProgress();}
  else if(t.dataset.ren){
    var name=t.value.trim();var obj=t.dataset.ren==="p"?program(t.dataset.id):group(t.dataset.id);
    if(!obj)return;if(!name){t.value=obj.name;return;}obj.name=name;store.saveConfig();
  }
  else if(t.dataset.addslot){if(!t.value)return;program(t.dataset.addslot).slots.push({gid:t.value,count:1});saveCfg(renderSettings);}
  else if(t.dataset.gmuscle){var g=group(t.dataset.gmuscle);g.muscle=t.value||null;store.saveConfig();}
  else if(["setRepLo","setRepHi","setSets","setWeek"].indexOf(t.id)>=0){
    var lo=parseInt(document.getElementById("setRepLo").value,10),hi=parseInt(document.getElementById("setRepHi").value,10),st=parseInt(document.getElementById("setSets").value,10),wk=parseInt(document.getElementById("setWeek").value,10);
    var s=settings();s.repLo=lo>0?lo:10;s.repHi=hi>=s.repLo?hi:s.repLo;s.sets=st>0?Math.min(st,10):3;s.weekGoal=wk>0?Math.min(wk,7):2;
    saveCfg(renderSettings);
  }
  else if(t.id==="importFile"&&t.files&&t.files[0]){var rd=new FileReader();rd.onload=function(){prepareImport(rd.result);};rd.readAsText(t.files[0]);}
});
view.addEventListener("keydown",function(e){
  if(e.key!=="Enter")return;var t=e.target;
  if(t.dataset&&(t.dataset.ren||t.dataset.f==="r"||t.dataset.f==="dr"||t.dataset.note)){e.preventDefault();t.blur();}
});
view.addEventListener("toggle",function(e){var d=e.target;if(d.dataset&&d.dataset.gd){if(d.open)state.openGroup=d.dataset.gd;else if(state.openGroup===d.dataset.gd)state.openGroup=null;}},true);
view.addEventListener("submit",function(e){
  e.preventDefault();
  var f=e.target;
  if(f.dataset.form==="goal"){
    var gw=parseNum(document.getElementById("goalW").value);if(!(gw>0))return;
    var by=document.getElementById("goalD").value||null;var h=exHistory(f.dataset.e);var cur=h.length?h[h.length-1].top:0;
    var old=state.config.goals[f.dataset.e];
    state.config.goals[f.dataset.e]={w:gw,by:by,startW:old&&!old.doneAt&&old.startW<gw?old.startW:cur,setAt:todayIso()};
    state.editGoal=null;saveCfg(renderProgress);return;
  }
  var inp=f.querySelector("input");var name=inp.value.trim();if(!name)return;
  if(f.dataset.form==="ex"){group(f.dataset.g).ex.push({id:uid("x"),name:name,kind:"mid"});state.openGroup=f.dataset.g;saveCfg(renderSettings);var a=document.getElementById("add-"+f.dataset.g);if(a)a.focus();}
  else if(f.dataset.form==="group"){var ng={id:uid("g"),name:name,muscle:null,ex:[]};state.config.groups.push(ng);state.openGroup=ng.id;saveCfg(renderSettings);var a2=document.getElementById("add-"+ng.id);if(a2)a2.focus();}
  else if(f.dataset.form==="prog"){var np={id:uid("p"),name:name,slots:[]};state.config.programs.push(np);saveCfg(renderSettings);var s2=document.getElementById("add-slot-"+np.id);if(s2)s2.focus();}
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&state.modal)closeModal();});

document.getElementById("modal").addEventListener("change",function(e){
  var t=e.target;
  if(t.dataset&&t.dataset.imp&&state.impPreview){var a=t.dataset.imp.split(":");var it=state.impPreview[+a[0]].items[+a[1]];it.choice=+t.value;t.closest(".impi").classList.toggle("off",it.choice===-2);}
  else if(t.id==="impOver")state.impOver=t.checked;
});
/* ---------- перетаскивание за ⠿ ---------- */
var drag=null;
view.addEventListener("pointerdown",function(e){
  var gr=e.target.closest&&e.target.closest(".grip");if(!gr)return;
  var item=gr.closest("[data-key]");var box=document.getElementById("items");if(!item||!box)return;
  e.preventDefault();
  var r=item.getBoundingClientRect();
  var ph=document.createElement("div");ph.className="dragph";ph.style.height=r.height+"px";
  box.insertBefore(ph,item);
  item.classList.add("dragging");item.style.width=r.width+"px";item.style.left=r.left+"px";item.style.top=r.top+"px";
  drag={item:item,ph:ph,box:box,off:e.clientY-r.top,y:e.clientY,id:e.pointerId,gr:gr};
  try{gr.setPointerCapture(e.pointerId);}catch(err){}
  buzz(15);autoScroll();
});
function autoScroll(){
  if(!drag)return;
  var y=drag.y,H=window.innerHeight,sp=0;
  if(y<90)sp=-Math.ceil((90-y)/6);else if(y>H-160)sp=Math.ceil((y-(H-160))/6);
  if(sp){window.scrollBy(0,sp);placeDrag();}
  requestAnimationFrame(autoScroll);
}
function placeDrag(){
  if(!drag)return;
  drag.item.style.top=(drag.y-drag.off)+"px";
  var sibs=[].slice.call(drag.box.children).filter(function(c){return c!==drag.item&&c!==drag.ph;});
  var before=null;
  for(var i=0;i<sibs.length;i++){var rc=sibs[i].getBoundingClientRect();if(drag.y<rc.top+rc.height/2){before=sibs[i];break;}}
  if(before){if(drag.ph.nextSibling!==before)drag.box.insertBefore(drag.ph,before);}
  else if(drag.box.lastChild!==drag.ph)drag.box.appendChild(drag.ph);
}
window.addEventListener("pointermove",function(e){if(!drag||e.pointerId!==drag.id)return;e.preventDefault();drag.y=e.clientY;placeDrag();},{passive:false});
function endDrag(e){
  if(!drag||(e&&e.pointerId!==drag.id))return;
  var d=drag;drag=null;
  d.box.insertBefore(d.item,d.ph);d.ph.remove();
  d.item.classList.remove("dragging");d.item.style.width=d.item.style.left=d.item.style.top="";
  var keys=[].slice.call(d.box.children).map(function(c){return c.dataset.key;}).filter(Boolean);
  var old=workoutItems().map(function(it){return it.k;}).join(",");
  state.draft.order=keys;
  if(keys.join(",")!==old){if(state.draft.entries.length)touch();}
}
window.addEventListener("pointerup",endDrag);
window.addEventListener("pointercancel",endDrag);

/* ---------- запуск ---------- */
store.loadLocal();
fixModesByHistory();
applyLook();
loadDraft();
checkAchievements(true);
render();
setStatus("ok");
startSessionTicker();
if(sessionActive(state.draft))keepAwake(true);

function applySnapshot(snap){
  var ws={},c=null;
  snap.docs.forEach(function(d){var v=d.data();if(!v)return;
    if(d.id==="config"&&v.config&&v.config.groups)c=v.config;
    else if(v.kind==="workout"&&v.date){var w=clone(v);delete w.kind;w.entries=w.entries||[];ws[v.date]=w;}});
  var needSave=false;
  if(c){needSave=!(c.version>=3);state.config=migrate(c);}
  if(state.dirty&&state.draft&&state.draft.entries.length)ws[state.date]=clone(state.draft);
  state.workouts=ws;if(c&&!state.config.modesChecked)fixModesByHistory();applyLook();
  var ae=document.activeElement;
  var typing=ae&&(view.contains(ae)||document.getElementById("modal").contains(ae))&&(ae.tagName==="INPUT"||ae.tagName==="TEXTAREA"||ae.tagName==="SELECT");
  if(!state.dirty&&!saveTimer)loadDraft();
  if(state.config.seenAch===null)checkAchievements(true);
  if(!typing)rerender(render);
  if(needSave)store.saveConfig();
}
if(IS_ARTIFACT&&window.claude&&typeof window.claude.use==="function"){
  Promise.all([window.claude.use("db"),window.claude.use("user")]).then(function(r){
    var db=r[0],user=r[1];if(!db||!user)return;
    return user.id().then(function(id){
      if(!id)return;
      store.col=db.collection("data/users/"+id);state.mode="db";setStatus("ok");
      store.col.onSnapshot(applySnapshot,function(){store.col=null;state.mode="local";setStatus("err","Нет связи — сохраняю на устройстве");});
    });
  }).catch(function(){});
}
if(!IS_ARTIFACT){
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
  if("serviceWorker" in navigator&&location.protocol==="https:"&&!window.Capacitor){
    window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});
  }
}
