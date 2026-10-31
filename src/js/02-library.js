/* ---------- библиотека программ ---------- */
/* slots: [группа, сколько упражнений, [рекомендованные упражнения]] */
var TEMPLATES = [
  {id:"t_full_new",name:"Фулбади для новичка",freq:"2–3 раза в неделю",level:"Новичок",back:"safe",
   desc:"Одна тренировка на всё тело, в основном тренажёры. Хороший старт и минимум техники.",
   programs:[{name:"Фулбади",slots:[["q",1,["q1"]],["g",1,["g1"]],["h",1,["h1"]],["b",1,["b1"]],["c",1,["c1"]],["s",1,["s3"]],["ab",1,["ab1"]]]}]},
  {id:"t_full_ab",name:"Фулбади А/Б",freq:"3 раза в неделю, чередуя",level:"Новичок+",back:"care",
   desc:"Две разные тренировки на всё тело по очереди: А, Б, А — потом Б, А, Б.",
   programs:[
    {name:"Фулбади А",slots:[["q",1,["q1"]],["h",1,["h2","h1"]],["b",1,["b1"]],["c",1,["c1"]],["s",1,["s2"]],["ab",1,["ab3"]]]},
    {name:"Фулбади Б",slots:[["q",1,["q3","q5"]],["g",1,["g1"]],["b",1,["b5"]],["c",1,["c2","c4"]],["s",1,["s3"]],["tr",1,["tr1"]],["bi",1,["bi2"]]]}]},
  {id:"t_full_3",name:"Фулбади на 3 дня с акцентом на ягодицы",freq:"3 раза в неделю",level:"Средний",back:"care",
   desc:"Три разные тренировки на всё тело, в каждой — ягодицы первыми. По мотивам популярных женских программ.",
   programs:[
    {name:"День 1",slots:[["g",2,["g4","g2"]],["q",1,["q1"]],["b",2,["b6","b3"]],["s",1,["s3"]],["tr",1,["tr3"]],["ab",1,["ab6"]]]},
    {name:"День 2",slots:[["h",1,["h2"]],["g",1,["g3"]],["q",1,["q3"]],["c",2,["c5","c3"]],["b",1,["b7"]],["bi",1,["bi1"]],["ab",1,["ab5"]]]},
    {name:"День 3",slots:[["g",1,["g5"]],["q",1,["q5"]],["l",1,["l1"]],["s",2,["s2","s5"]],["b",1,["b5"]],["tr",1,["tr2"]],["ab",1,["ab2"]]]}]},
  {id:"t_ul",name:"Верх / Низ",freq:"4 раза в неделю",level:"Средний",back:"care",
   desc:"Классический сплит: верх тела и низ по очереди. Каждая мышца — 2 раза в неделю.",
   programs:[
    {name:"Верх",slots:[["b",2,["b1","b5"]],["c",2,["c1","c2"]],["s",1,["s3"]],["bi",1,["bi1"]],["tr",1,["tr1"]]]},
    {name:"Низ",slots:[["q",2,["q1","q2"]],["g",1,["g4"]],["h",1,["h1"]],["ca",1,["ca1"]],["ab",1,["ab4"]]]}]},
  {id:"t_phul",name:"Сила + объём (как PHUL)",freq:"4 раза в неделю",level:"Средний+",back:"care",
   desc:"Два силовых дня (тяжело, 5–8 повторов) и два объёмных (10–15). Верх и низ в каждом блоке.",
   programs:[
    {name:"Верх · сила",reps:{lo:5,hi:8,sets:4},slots:[["c",1,["c1"]],["b",2,["b2","b1"]],["s",1,["s2"]],["tr",1,["tr2"]]]},
    {name:"Низ · сила",reps:{lo:5,hi:8,sets:4},slots:[["q",1,["q1"]],["g",1,["g4"]],["h",1,["h1"]],["ca",1,["ca2"]]]},
    {name:"Верх · объём",reps:{lo:10,hi:15,sets:3},slots:[["c",2,["c5","c3"]],["b",2,["b5","b7"]],["s",2,["s3","s6"]],["bi",1,["bi2"]],["tr",1,["tr1"]]]},
    {name:"Низ · объём",reps:{lo:10,hi:15,sets:3},slots:[["q",2,["q3","q2"]],["g",1,["g3"]],["h",1,["h1"]],["l",1,["l1"]],["ab",1,["ab3"]]]}]},
  {id:"t_ppl",name:"Тяни / Толкай / Ноги (PPL)",freq:"3 или 6 раз в неделю",level:"Средний",back:"care",
   desc:"Жим (грудь, плечи, трицепс), тяга (спина, бицепс, задняя дельта) и ноги. Можно проходить круг 1 или 2 раза в неделю.",
   programs:[
    {name:"Толкай",slots:[["c",2,["c1","c2"]],["s",2,["s2","s3"]],["tr",2,["tr1","tr3"]]]},
    {name:"Тяни",slots:[["b",3,["b1","b2","b5"]],["s",1,["s6"]],["bi",2,["bi1","bi2"]]]},
    {name:"Ноги",slots:[["q",2,["q1","q2"]],["g",1,["g1"]],["h",1,["h1"]],["ca",1,["ca1"]],["ab",1,["ab1"]]]}]},
  {id:"t_bro",name:"Сплит по группам мышц (5 дней)",freq:"5 раз в неделю",level:"Опытный",back:"care",
   desc:"Каждый день — одна-две группы мышц, большой объём на группу. Для тех, кто ходит в зал почти каждый день.",
   programs:[
    {name:"Грудь",slots:[["c",4,["c1","c5","c2","c3"]],["ab",1,["ab5"]]]},
    {name:"Спина",slots:[["b",4,["b1","b2","b5","b7"]]]},
    {name:"Ноги",slots:[["q",2,["q1","q2"]],["g",1,["g4"]],["h",1,["h1"]],["ca",1,["ca1"]]]},
    {name:"Плечи",slots:[["s",4,["s2","s3","s5","s6"]],["ab",1,["ab3"]]]},
    {name:"Руки",slots:[["bi",3,["bi1","bi2","bi4"]],["tr",3,["tr1","tr2","tr3"]]]}]},
  {id:"t_glute3",name:"Акцент на ягодицы (3 дня)",freq:"3 раза в неделю",level:"Новичок+",back:"care",
   desc:"Два дня ягодиц и ног и один день верха. Для тех, кто хочет в первую очередь ягодицы.",
   programs:[
    {name:"Ягодицы и задняя поверхность",slots:[["g",2,["g4","g3"]],["h",2,["h2","h1"]],["l",1,["l1"]],["ab",1,["ab3"]]]},
    {name:"Верх",slots:[["b",2,["b1","b5"]],["c",1,["c1"]],["s",2,["s3","s5"]],["tr",1,["tr1"]]]},
    {name:"Ягодицы и квадрицепс",slots:[["q",2,["q1","q3"]],["g",2,["g5","g2"]],["l",1,["l2"]],["ca",1,["ca1"]]]}]},
  {id:"t_glute4",name:"Ягодицы ×2 + верх ×2",freq:"4 раза в неделю",level:"Средний",back:"care",
   desc:"Чередуем: низ с упором на ягодицы и верх тела. Ягодицы в работе 2 раза в неделю.",
   programs:[
    {name:"Низ А",slots:[["g",2,["g4","g3"]],["q",1,["q1"]],["h",1,["h1"]],["l",1,["l1"]]]},
    {name:"Верх А",slots:[["b",2,["b1","b3"]],["c",1,["c1"]],["s",1,["s3"]],["bi",1,["bi1"]],["tr",1,["tr1"]]]},
    {name:"Низ Б",slots:[["g",2,["g1","g5"]],["h",1,["h2"]],["q",1,["q4"]],["l",1,["l2"]],["ab",1,["ab3"]]]},
    {name:"Верх Б",slots:[["b",2,["b2","b5"]],["c",1,["c2"]],["s",2,["s2","s5"]],["tr",1,["tr2"]]]}]},
  {id:"t_back",name:"Бережно к спине",freq:"2–3 раза в неделю",level:"Любой",back:"safe",
   desc:"Без осевой нагрузки на позвоночник: тренажёры, упор на скамью, укрепление мышц корпуса.",
   programs:[{name:"Бережная тренировка",slots:[["q",1,["q1"]],["g",1,["g1"]],["h",1,["h1"]],["l",1,["l1"]],["b",2,["b1","b2"]],["c",1,["c2"]],["s",1,["s3"]],["ab",2,["ab3","ab4"]]]}]},
  {id:"t_express",name:"Экспресс на 45 минут",freq:"2–4 раза в неделю",level:"Любой",back:"safe",
   desc:"Пять упражнений на главные группы мышц — когда мало времени.",
   programs:[{name:"Экспресс",reps:{lo:10,hi:12,sets:3},slots:[["q",1,["q1"]],["b",1,["b1"]],["c",1,["c1"]],["g",1,["g1"]],["s",1,["s3"]]]}]},
  {id:"t_5x5",name:"Сила 5×5 со штангой",freq:"3 раза в неделю, чередуя А и Б",level:"Новичок+",back:"risky",
   desc:"Классическая силовая схема: 3 базовых упражнения со штангой, 5 подходов по 5. Не подходит при проблемах с поясницей.",
   programs:[
    {name:"5×5 · А",reps:{lo:5,hi:5,sets:5},slots:[["q",1,["q8"]],["c",1,["c6"]],["b",1,["b4"]]]},
    {name:"5×5 · Б",reps:{lo:5,hi:5,sets:5},slots:[["q",1,["q8"]],["s",1,["s1"]],["h",1,["h3"]]]}]},
  {id:"t_ul3",name:"Верх / Низ на 3 дня",freq:"3 раза в неделю",level:"Новичок+",back:"care",
   desc:"Неделя 1: верх, низ, верх. Неделя 2: низ, верх, низ. Приложение само предложит, какую тренировку делать.",
   programs:[
    {name:"Верх",slots:[["b",2,["b1","b3"]],["c",1,["c1"]],["s",1,["s3"]],["bi",1,["bi2"]],["tr",1,["tr1"]]]},
    {name:"Низ",slots:[["q",1,["q1"]],["g",1,["g1"]],["h",1,["h1"]],["l",1,["l1"]],["ab",1,["ab1"]]]}]}
];
var BACK_LABEL={safe:"Бережно для спины",care:"Следить за техникой",risky:"Нагрузка на поясницу"};

/* ---------- планы на месяц ---------- */
var PLANS = [
  {id:"pl_classic",name:"3 недели роста + разгрузка",desc:"Самая популярная схема: нагрузка растёт 3 недели, на 4-й даём телу восстановиться.",
   weeks:[{lo:12,hi:15,sets:3,label:"Втягиваемся"},{lo:10,hi:12,sets:3,label:"Прибавляем вес"},{lo:8,hi:10,sets:4,label:"Тяжёлая неделя"},{lo:12,hi:12,sets:2,load:0.6,label:"Разгрузка: 60% веса"}]},
  {id:"pl_new",name:"Первый месяц в зале",desc:"Для новичков: сначала техника и привычка, потом понемногу добавляем.",
   weeks:[{lo:12,hi:15,sets:2,label:"Учим технику, лёгкие веса"},{lo:12,hi:15,sets:3,label:"Добавляем подход"},{lo:10,hi:12,sets:3,label:"Чуть тяжелее"},{lo:10,hi:12,sets:3,label:"Закрепляем"}]},
  {id:"pl_strength",name:"Силовой месяц",desc:"Повторов меньше, веса больше. В конце — разгрузка.",
   weeks:[{lo:8,hi:10,sets:4,label:"Готовимся"},{lo:6,hi:8,sets:4,label:"Тяжело"},{lo:5,hi:6,sets:5,label:"Очень тяжело"},{lo:8,hi:8,sets:2,load:0.6,label:"Разгрузка: 60% веса"}]},
  {id:"pl_volume",name:"Объём и рельеф",desc:"Много повторов и подходов — для выносливости и формы мышц.",
   weeks:[{lo:12,hi:15,sets:3,label:"Разгон"},{lo:12,hi:15,sets:4,label:"Больше подходов"},{lo:15,hi:20,sets:4,label:"Пик объёма"},{lo:12,hi:12,sets:2,load:0.7,label:"Лёгкая неделя"}]}
];
function planDef(id){return PLANS.filter(function(p){return p.id===id;})[0]||null;}
function planWeek(date){
  var pl=state.config.plan;if(!pl)return null;
  var def=planDef(pl.id);if(!def)return null;
  var d=daysBetween(pl.start,date);if(d<0)return null;
  var idx=Math.floor(d/7);
  if(idx>=def.weeks.length)return null;
  return {n:idx+1,total:def.weeks.length,week:def.weeks[idx],plan:def};
}
function planFinished(){
  var pl=state.config.plan;if(!pl)return false;var def=planDef(pl.id);if(!def)return false;
  return daysBetween(pl.start,todayIso())>=def.weeks.length*7;
}

/* Установка шаблона: возвращаем удалённые упражнения и группы, если они нужны программе */
function ensureEx(gid,exId){
  var g=group(gid);
  var dg=DEFAULT_GROUPS.filter(function(x){return x.id===gid;})[0];
  if(!g){if(!dg)return false;g=clone(dg);g.ex=[];state.config.groups.push(g);}
  if(g.archived)g.archived=false;
  var e=g.ex.filter(function(x){return x.id===exId;})[0];
  if(e){if(e.archived)e.archived=false;return true;}
  var de=dg&&dg.ex.filter(function(x){return x.id===exId;})[0];
  if(!de)return false;
  g.ex.push(clone(de));return true;
}
function installTemplate(tid,replace){
  var t=TEMPLATES.filter(function(x){return x.id===tid;})[0];if(!t)return;
  if(replace)state.config.programs.forEach(function(p){p.archived=true;});
  var existingNames={};programs().forEach(function(p){existingNames[p.name]=true;});
  var firstId=null;
  t.programs.forEach(function(tp){
    var slots=[];
    tp.slots.forEach(function(s){
      var pref=(s[2]||[]).filter(function(exId){return ensureEx(s[0],exId);});
      if(!group(s[0]))return;
      slots.push({gid:s[0],count:s[1]||1,pref:pref});
    });
    var name=tp.name;if(existingNames[name])name=tp.name+" · "+t.name.split(" ")[0];
    var p={id:uid("p"),name:name,slots:slots,from:t.id};
    if(tp.reps)p.reps=clone(tp.reps);
    state.config.programs.push(p);
    if(!firstId)firstId=p.id;
  });
  state.config.lastProgram=firstId;
  state.config.onboarded=true;
  return firstId;
}

function defExName(id){var f=findEx(id);if(f)return f.e.name;for(var i=0;i<DEFAULT_GROUPS.length;i++){var e=DEFAULT_GROUPS[i].ex.filter(function(x){return x.id===id;})[0];if(e)return e.name;}return id;}
function defGroupName(gid){var g=DEFAULT_GROUPS.filter(function(x){return x.id===gid;})[0];return g?g.name:(group(gid)?group(gid).name:gid);}
function templatePreview(t){
  return '<details class="tprev"><summary>Посмотреть программу</summary>'+t.programs.map(function(p){
    var R=p.reps||{lo:settings().repLo,hi:settings().repHi,sets:settings().sets};
    var rows=p.slots.map(function(s){
      var ex=(s[2]||[]).slice(0,s[1]).map(defExName);
      return '<li><b>'+esc(defGroupName(s[0]))+(s[1]>1?' ×'+s[1]:'')+'</b><span>'+esc(ex.join(", "))+'</span></li>';
    }).join("");
    return '<div class="tday"><div class="tdh"><b>'+esc(p.name)+'</b><span>'+R.sets+' × '+(R.lo===R.hi?R.lo:R.lo+'–'+R.hi)+'</span></div><ul>'+rows+'</ul></div>';
  }).join("")+'</details>';
}

/* ---------- сколько подходов в неделю нужно мышце ----------
   Ориентиры по исследованиям объёма тренировок (MEV / MAV / MRV):
   min — минимум для роста, lo–hi — оптимально, max — больше обычно уже не восстановиться */
var VOLUME = {
  chest:{min:6,lo:12,hi:18,max:22}, back:{min:8,lo:14,hi:20,max:24}, quads:{min:6,lo:12,hi:18,max:22},
  hams:{min:4,lo:10,hi:14,max:18}, glutes:{min:6,lo:10,hi:16,max:20}, hips:{min:4,lo:8,hi:14,max:18},
  shoulders:{min:6,lo:12,hi:16,max:21}, biceps:{min:4,lo:10,hi:14,max:18}, triceps:{min:4,lo:10,hi:12,max:16},
  calves:{min:6,lo:12,hi:16,max:22}, abs:{min:4,lo:8,hi:16,max:20}
};
/* Базовые упражнения частично нагружают соседние мышцы — считаем за ½ подхода */
var INDIRECT = {back:["biceps"],chest:["triceps"],shoulders:["triceps"],quads:["glutes"],hams:["glutes"],glutes:["hams"]};
