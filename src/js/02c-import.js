/* ---------- перенос тренировок из заметок (Telegram и т.п.) ----------
   Понимает строки вида:
   11.03
   Гравитрон подтягивания 60кг×15раз
   Сгиб ног 26кг ×15 8подх
   Экстензия б/в ×15 4подх
   Махи 6кг-4кг-2кг по 12раз ×4подх     (дроп-сет)
   Подтяг узк хв на резинке 12р/10р/8р/8р
   Ягодичный мост 50/60кг ×15/12р×5подх
   (Сет)Махи 5кг×15раз и сразу Блин перед собой 5кг×15раз   (суперсет) */
var IMPORT_SYN = [
  [/\bэкстенз\w*/g,"гиперэкстензия"],[/\bгиперэкстенз\w*/g,"гиперэкстензия"],
  [/\bразгиб\w*\s+рук\w*/g,"разгибания на блоке"],[/\bразведени\w*\s+два\s+веса/g,"отведение бёдер"],
  [/\bжим\s+лежа(?:\s+от\s+груди)?(?!\s+штанг)/g,"жим гантелей"],
  [/\bсгиб(?:ание|ания)?\b/g,"сгибание"],[/\bразгиб(?:ание|ания)?\b/g,"разгибание"],
  [/\bвертик\w*\s+тяга|\bтяга\s+вертик\w*|\bвертикальн\w*|\bвертик\b/g,"тяга верхнего блока"],
  [/\bузк\w*\s*(?:хв\w*)?|\bузк\b/g,"узким хватом"],[/\bширок\w*\s*(?:хв\w*)?/g,"широким хватом"],
  [/\bкраб\w*/g,""],[/\bхв\b|\bхватом\b/g,"хватом"],
  [/\bпротяжк\w*/g,"тяга к подбородку"],
  [/\bразведени\w*\s+ног\w*/g,"отведение бёдер"],[/\bсведени\w*\s+ног\w*/g,"сведение бёдер"],
  [/\bразведени\w*\s+рук\w*/g,"разводка гантелей"],
  [/\bколодц\w*/g,"смите"],[/\bсмит\w*/g,"смите"],
  [/\bхаммер\w*/g,"рычажная тяга"],[/\bотжим\b|\bотжимани\w*/g,"отжимания"],
  [/\bлавочк\w*|\bскамь\w*/g,"скамьи"],
  [/\bгравитрон\w*/g,"гравитроне"],[/\bподтяг\w*/g,"подтягивания"],[/\bрезин\w*|\bрез\b/g,"резинкой"],
  [/\bгориз\w*/g,"горизонтальный"],[/\bнеги?ативн\w*/g,"негативные"],
  [/\bприсед\b|\bприседани\w*/g,"приседания"],[/\bягод\b|\bягодичн\w*/g,"ягодичный"],
  [/\bноск\w*/g,"носки"],[/\bподъ[её]м\w*/g,"подъёмы"],[/\bфранцуз\w*/g,"французский"],
  [/\bзадн\w*\s+дельт\w*/g,"задняя дельта разводка в кроссовере"],
  [/\bтрицепс\b(?=.*(?:кроссовер|канат|блок))/g,"разгибания на блоке"],[/\bбицепс\b(?=.*скамь)/g,"сгибания"],
  [/\bшаги\b/g,"шаги"],[/\bарнольд\w*/g,"арнольда"],[/\bармейск\w*/g,"армейский"],
  [/\bгир\w*/g,"гоблет"],[/\bканат\w*\s+перед\s+собой/g,"подъём каната перед собой"],[/\bблин\w*\s+перед\s+собой/g,"подъём блина перед собой"],
  [/\bприведени\w*\s+гантел\w*\s+к\s+поясу/g,"тяга гантели"],[/\bлопатк\w*/g,"лопатками"],
  [/\bпуловер\w*/g,"пуловер"],[/\bмахи\b(?!\s+(?:в\s+наклоне|перед))/g,"махи в стороны"],
  [/\bпресс\s+боков\w*/g,"боковая планка"],[/\bвыпады\b/g,"выпады"]
];
var STOP={"в":1,"на":1,"с":1,"со":1,"по":1,"и":1,"к":1,"от":1,"у":1,"для":1,"рук":1,"руки":1,"ног":1,"ноги":1,"лежа":1,"лёжа":1,"сидя":1,"стоя":1,"тренажере":1,"тренажёре":1,"тренажер":1,"штанга":1,"штанги":1,"гриф":1,"грифом":1,"одной":1,"одну":1,"сет":1,"сразу":1,"плечи":1,"другом":1,"кроссовере":1};
function stemTokens(s){
  s=" "+String(s).toLowerCase().replace(/ё/g,"е")+" ";
  return s.replace(/[^a-zа-я0-9]+/g," ").trim().split(" ").filter(function(w){return w&&!STOP[w]&&!/^\d+$/.test(w);}).map(function(w){return w.length>5?w.slice(0,5):w;});
}
/* \b в JS не понимает русские буквы — делаем свою границу слова */
var WB="(?:(?<![а-яёa-z0-9])(?=[а-яёa-z0-9])|(?<=[а-яёa-z0-9])(?![а-яёa-z0-9]))";
var IMPORT_SYN_RE=IMPORT_SYN.map(function(r){return [new RegExp(r[0].source.replace(/\\w/g,"[а-яёa-z0-9_]").replace(/\\b/g,WB),"g"),r[1]];});
function expandName(raw){var s=" "+raw.toLowerCase().replace(/ё/g,"е")+" ";IMPORT_SYN_RE.forEach(function(r){s=s.replace(r[0],r[1]?" "+r[1]+" ":" ");});return s.replace(/\s+/g," ").trim();}
/* Все известные упражнения: свои + каталог */
function knownExercises(){
  var out=[],seen={};
  groups().forEach(function(g){if(g.archived)return;g.ex.forEach(function(e){if(e.archived)return;out.push({src:"my",id:e.id,gid:g.id,name:e.name,mode:e.mode||"w"});seen[normName(e.name)]=1;});});
  CATALOG.forEach(function(c){if(seen[normName(c.name)])return;out.push({src:"cat",id:c.id,muscle:c.muscle,name:c.name,mode:c.mode});});
  return out;
}
function matchScore(qt,name){
  var nt=stemTokens(name);if(!nt.length||!qt.length)return 0;
  var hit=0;qt.forEach(function(t){if(nt.indexOf(t)>=0)hit++;});
  var miss=nt.filter(function(t){return qt.indexOf(t)<0;}).length;
  return hit/qt.length*0.7+hit/nt.length*0.3-miss*0.02;
}
function rankMatches(raw,known){
  var qt=stemTokens(expandName(raw));
  return known.map(function(k){return {k:k,s:matchScore(qt,k.name)+(k.src==="my"?0.03:0)};}).filter(function(x){return x.s>0.2;}).sort(function(a,b){return b.s-a.s;});
}
function numF(s){return parseFloat(String(s).replace(",","."));}
/* Разбор одной части строки (одного упражнения) */
function parseExPart(raw){
  var t=raw.replace(/[хxX×*]/g,function(c,i,str){var prev=str[i-1]||"",next=str[i+1]||"";return /[\d\s)]/.test(prev)&&/[\d\s(]/.test(next)||/\d/.test(next)?"×":c;});
  t=t.replace(/(\d)\s*кг/gi,"$1кг").replace(/[–—]/g,"-");
  var res={raw:raw.trim(),weights:[],reps:[],sets:null,bw:false,drop:false};
  var plusDrop=/кг.*?\+\s*\d+(?:[.,]\d+)?\s*кг/i.test(t);
  t=t.replace(/\([^)]*\)/g," ");
  if(/б\s*\/\s*в|без веса/i.test(t))res.bw=true;
  /* подходы */
  var mS=t.match(/(\d+)\s*(?:подх\w*|под\b|подход\w*)/i)||t.match(/(\d+)\s*(?:подх|п)\s*$/i);
  if(mS){res.sets=+mS[1];t=t.replace(mS[0]," ");}
  /* веса: 8кг, по8/9кг, 6кг-4кг-2кг, 7/5/3кг, 25(30)кг, 55кг×15р+45кг×15р */
  var wRe=/(?:по\s*)?((?:\d+(?:[.,]\d+)?\s*(?:кг)?\s*[\/-]\s*)*\d+(?:[.,]\d+)?)\s*(?:\(\s*(\d+(?:[.,]\d+)?)\s*\))?\s*кг/gi;
  var m,ws=[];
  while((m=wRe.exec(t))){var parts=m[1].split(/[\/-]/).map(function(x){return numF(x);}).filter(function(x){return !isNaN(x);});
    if(m[0].indexOf("-")>=0||(/\/\s*\d/.test(m[1])&&parts.length>=3))res.drop=parts.length>1;
    if(m[2])parts=[numF(m[2])];
    ws.push(parts);}
  t=t.replace(wRe," ");
  if(ws.length>1){res.weights=ws.map(function(p){return p[0];});res.multi=true;if(plusDrop)res.drop=true;}
  else if(ws.length===1){res.weights=ws[0];}
  /* повторы: 12р/10р/8р, 10/9/7/6, ×15, 15р, 50раз, 15/12р */
  var mSeq=t.match(/(\d+)\s*р?\s*(?:\/\s*(\d+)\s*р?\s*){1,}/i);
  if(mSeq){res.reps=mSeq[0].split("/").map(function(x){return parseInt(x,10);}).filter(function(x){return x>0;});t=t.replace(mSeq[0]," ");}
  else{
    var all=[];var rRe=/(?:×\s*)?(?:по\s*)?(\d+)\s*(р\b|раз\w*|p\b)?/gi;var q;
    while((q=rRe.exec(t))){if(q[0].trim()==="")continue;all.push({n:+q[1],unit:!!q[2],x:q[0].indexOf("×")>=0});}
    if(all.length){
      res.reps=[all[0].n];
      if(res.sets===null&&all.length>1){var sc=all[all.length-1];if(sc.n<=8)res.sets=sc.n;}
    }
  }
  /* название — всё до первой цифры / «б/в» / «по» перед числом */
  var name=raw.replace(/\((?:сет|суперсет)\)/ig,"").split(/\s(?:по\s*)?\d|^\d|б\s*\/\s*в|без веса|[×xх]\s*\d|\(\d/i)[0];
  name=name.replace(/[\s,.:;+(-]+$/,"").replace(/^[\s\d.)]+/,"").trim();
  res.name=name;
  return res;
}
/* Превращаем разобранную часть в подходы приложения */
function partToSets(p){
  var n=p.sets||(p.reps.length>1?p.reps.length:(p.reps.length?3:0));
  if(!n||!p.reps.length)return [];
  var sets=[];
  for(var i=0;i<n;i++){
    var r=p.reps.length>1?(p.reps[i]!==undefined?p.reps[i]:p.reps[p.reps.length-1]):p.reps[0];
    var s={w:null,r:r};
    if(!p.bw&&p.weights.length){
      if(p.drop&&p.weights.length>1){s.w=p.weights[0];s.drops=p.weights.slice(1).map(function(w){return {w:w,r:r};});}
      else if(p.weights.length>1){/* 50/60 кг: первые подходы с первым весом, остальные — со вторым */var k=Math.min(p.weights.length-1,Math.floor(i*p.weights.length/n));s.w=p.weights[k];}
      else s.w=p.weights[0];
    }
    sets.push(s);
  }
  return sets;
}
function parseNotes(text,refYear){
  var lines=String(text).replace(/\r/g,"").split("\n");
  var out=[],cur=null;var today=todayIso();
  lines.forEach(function(line){
    var l=line.trim();if(!l)return;
    var md=l.match(/^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?\.?$/);
    if(md){
      var d=+md[1],mo=+md[2],y=md[3]?(+md[3]<100?2000+(+md[3]):+md[3]):refYear;
      if(d<1||d>31||mo<1||mo>12)return;
      var iso=y+"-"+pad(mo)+"-"+pad(d);
      if(!md[3]&&iso>today)iso=(y-1)+"-"+pad(mo)+"-"+pad(d);
      cur={date:iso,items:[]};out.push(cur);return;
    }
    if(!cur)return;
    if(!/[а-яa-z]/i.test(l))return;
    var parts=l.split(/\s+(?:и\s+)?сразу\s+|\s*\+\s*(?=[а-яё])/i);
    var ss=parts.length>1?"ss"+out.length+"_"+cur.items.length:null;
    parts.forEach(function(pt){var p=parseExPart(pt);if(!p.name)return;p.ss=ss;cur.items.push(p);});
  });
  return out.filter(function(w){return w.items.length;});
}
/* Предпросмотр: подбираем упражнение для каждой строки */
function buildImportPreview(text){
  var parsed=parseNotes(text,+todayIso().slice(0,4));
  var known=knownExercises();
  parsed.forEach(function(w){w.items.forEach(function(it){
    var ms=rankMatches(it.name,known);
    it.cands=ms.slice(0,6).map(function(m){return m.k;});
    it.choice=ms.length&&ms[0].s>=0.45?0:-1;  /* -1 = новое упражнение с именем из заметки */
    it.sets=partToSets(it);
  });});
  return parsed;
}
var MUSCLE_GROUP={quads:"q",glutes:"g",hams:"h",hips:"l",back:"b",chest:"c",shoulders:"s",biceps:"bi",triceps:"tr",calves:"ca",abs:"ab"};
function importTargetGroup(muscle){
  var g=muscle&&liveGroups().filter(function(x){return x.muscle===muscle;})[0];
  if(g)return g.id;
  var gid=muscle?MUSCLE_GROUP[muscle]:null;
  if(gid){var ex=group(gid);if(ex){ex.archived=false;return gid;}var dg=DEFAULT_GROUPS.filter(function(x){return x.id===gid;})[0];if(dg){var ng=clone(dg);ng.ex=[];state.config.groups.push(ng);return gid;}}
  var other=groups().filter(function(x){return x.id==="imp";})[0];
  if(!other){other={id:"imp",name:"Из заметок",muscle:null,ex:[]};state.config.groups.push(other);}
  other.archived=false;return "imp";
}
function applyImport(preview,overwrite){
  var added=0,skipped=0,exAdded=0;
  preview.forEach(function(w){
    if(!w.items.some(function(it){return it.choice!==-2&&it.sets.length;}))return;
    if(state.workouts[w.date]&&isWorkoutDone(state.workouts[w.date])&&!overwrite){skipped++;return;}
    var entries=[];
    w.items.forEach(function(it){
      if(it.choice===-2||!it.sets.length)return;
      var gid,exId;
      if(it.choice>=0){
        var k=it.cands[it.choice];
        if(k.src==="my"){gid=k.gid;exId=k.id;}
        else{gid=importTargetGroup(k.muscle);exId=addFromCatalog(gid,k.id);exAdded++;}
      }else{
        gid=importTargetGroup(it.cands[0]&&it.cands[0].muscle||(it.cands[0]&&findEx(it.cands[0].id)?exMuscle(it.cands[0].id):null));
        var g=group(gid);var nm=it.name.charAt(0).toUpperCase()+it.name.slice(1);
        var same=g.ex.filter(function(e){return normName(e.name)===normName(nm);})[0];
        if(same)exId=same.id;else{exId=uid("x");var o={id:exId,name:nm,kind:"mid"};if(it.bw)o.mode="bw";g.ex.push(o);exAdded++;}
      }
      if(!exId)return;
      if(it.bw){var f=findEx(exId);if(f&&(!f.e.mode||f.e.mode==="w")&&!it.weights.length&&f.e.mode!=="assist")f.e.mode="bw";}
      var en={gid:gid,exId:exId,sets:clone(it.sets)};if(it.ss)en.ss=it.ss;
      if(entries.some(function(x){return x.exId===exId&&x.gid===gid;}))return;
      entries.push(en);
    });
    if(!entries.length)return;
    state.workouts[w.date]={date:w.date,programId:null,entries:entries,imported:true};
    added++;
  });
  return {added:added,skipped:skipped,exAdded:exAdded};
}
