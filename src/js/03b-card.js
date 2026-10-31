/* ---------- карточка: сравнения и цитаты ---------- */
/* вес в кг (примерный), формы: [1 …, 2 … / 1,5 …, 5 …], картинка */
var THINGS = [
  {kg:4,f:["кошку","кошки","кошек"],ic:"🐈"},
  {kg:12,f:["корги","корги","корги"],ic:"🐕"},
  {kg:30,f:["арбузную гору","арбузные горы","арбузных гор"],ic:"🍉",skip:true},
  {kg:100,f:["панду","панды","панд"],ic:"🐼"},
  {kg:160,f:["гориллу","гориллы","горилл"],ic:"🦍"},
  {kg:250,f:["пианино","пианино","пианино"],ic:"🎹"},
  {kg:300,f:["бурого медведя","бурых медведя","бурых медведей"],ic:"🐻"},
  {kg:500,f:["лошадь","лошади","лошадей"],ic:"🐎"},
  {kg:700,f:["корову","коровы","коров"],ic:"🐄"},
  {kg:1200,f:["жирафа","жирафа","жирафов"],ic:"🦒"},
  {kg:1300,f:["машину","машины","машин"],ic:"🚗"},
  {kg:1500,f:["бегемота","бегемота","бегемотов"],ic:"🦛"},
  {kg:2300,f:["носорога","носорога","носорогов"],ic:"🦏"},
  {kg:5000,f:["слона","слона","слонов"],ic:"🐘"},
  {kg:8000,f:["тираннозавра","тираннозавра","тираннозавров"],ic:"🦖"},
  {kg:11000,f:["автобус","автобуса","автобусов"],ic:"🚌"},
  {kg:150000,f:["синего кита","синих кита","синих китов"],ic:"🐳"}
].filter(function(t){return !t.skip;});
var QUOTES = [
  "Сильными не рождаются — сильными приходят на тренировку.",
  "Каждый подход — голос за того, кем ты становишься.",
  "Не обязательно быть лучше всех. Достаточно быть лучше, чем вчера.",
  "Медленно — это тоже вперёд.",
  "Тяжело сейчас — легко потом.",
  "Мотивация приходит и уходит. Привычка остаётся.",
  "Сегодня ты в зале, а не на диване. Это уже победа.",
  "Гриф не знает, какой у тебя был день. Он просто ждёт.",
  "Результат любит регулярность больше, чем героизм.",
  "Сегодняшние килограммы — завтрашняя лёгкость.",
  "Маленькие шаги каждую неделю складываются в большие перемены.",
  "Твоё тело слышит всё, что ты делаешь. Сегодня оно услышало «спасибо».",
  "Идеальных дней не бывает — бывают сделанные тренировки.",
  "Прогресс не всегда видно в зеркале. Зато его видно в цифрах.",
  "Каждый рекорд когда-то казался невозможным.",
  "Ты сильнее, чем думаешь. Проверь это ещё одним подходом.",
  "Дисциплина — это помнить, чего ты на самом деле хочешь.",
  "Через месяц ты скажешь себе спасибо за сегодня.",
  "Сравнивай себя не с другими, а с собой месяц назад.",
  "Сделано лучше, чем идеально.",
  "Сила начинается в голове, а заканчивается на грифе.",
  "Тренировка — вложение, которое всегда окупается.",
  "Ты поднимаешь не только вес — ты поднимаешь планку.",
  "Устал — отдохни. Но не сдавайся.",
  "Неважно, как медленно ты идёшь, пока ты не останавливаешься.",
  "Самый тяжёлый вес в зале — входная дверь. Сегодня она тебе поддалась."
];
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function pickThing(ton,seed){
  if(ton<4)return null;
  var r=rng(seed);
  var ok=THINGS.filter(function(t){var n=ton/t.kg;return n>=1&&n<=12;});
  if(!ok.length){var below=THINGS.filter(function(t){return t.kg<=ton;});ok=[below[below.length-1]];}
  var t=ok[Math.floor(r()*ok.length)];
  var n=ton/t.kg;var whole=Math.abs(n-Math.round(n))<0.15||n>=10;
  var num=whole?Math.round(n):Math.round(n*2)/2;
  var word=whole?plural(num,t.f[0],t.f[1],t.f[2]):t.f[1];
  return {t:t,n:num,text:fmtNum(num)+" "+word,each:t.kg};
}
function pickQuote(seed){var r=rng(seed*7+3);r();return QUOTES[Math.floor(r()*QUOTES.length)];}
function wrapText(x,txt,max){var words=txt.split(" "),lines=[],cur="";words.forEach(function(w){var t=cur?cur+" "+w:w;if(x.measureText(t).width>max&&cur){lines.push(cur);cur=w;}else cur=t;});if(cur)lines.push(cur);return lines;}

var EMOJI="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
function drawCard(w,opt){
  opt=opt||{};var story=opt.format==="story";var seed=opt.seed||1;
  var W=1080,H=story?1920:1350;var c=document.createElement("canvas");c.width=W;c.height=H;var x=c.getContext("2d");
  var acc=ACCENT_HEX[settings().accent]||ACCENT_HEX.blue;
  var D="'Unbounded','Onest',sans-serif",B="'Onest',system-ui,sans-serif",N="'JetBrains Mono',ui-monospace,monospace";
  /* фон */
  x.fillStyle="#0c0f16";x.fillRect(0,0,W,H);
  var g1=x.createRadialGradient(W*0.95,-40,10,W*0.95,-40,story?1100:820);g1.addColorStop(0,acc.glow+"cc");g1.addColorStop(1,acc.glow+"00");x.fillStyle=g1;x.fillRect(0,0,W,H);
  var g2=x.createRadialGradient(-60,H+60,10,-60,H+60,story?1000:760);g2.addColorStop(0,acc.glow2+"99");g2.addColorStop(1,acc.glow2+"00");x.fillStyle=g2;x.fillRect(0,0,W,H);
  x.strokeStyle="rgba(255,255,255,0.035)";x.lineWidth=2;for(var gy=0;gy<H;gy+=54){x.beginPath();x.moveTo(0,gy);x.lineTo(W,gy);x.stroke();}
  var P=story?96:80;
  var top=story?150:P;
  /* шапка */
  x.fillStyle="rgba(255,255,255,0.62)";x.font="600 30px "+B;x.textBaseline="alphabetic";
  x.save();x.translate(P,top+30);var label="ДНЕВНИК ЗАЛА",lx=0;for(var i=0;i<label.length;i++){x.fillText(label[i],lx,0);lx+=x.measureText(label[i]).width+5;}x.restore();
  x.textAlign="right";x.fillText(fmtDateLong(w.date),W-P,top+30);x.textAlign="left";
  var title=programName(w.programId)||"Тренировка";
  x.fillStyle="#ffffff";var fs=story?112:96;x.font="700 "+fs+"px "+D;while(x.measureText(title).width>W-2*P&&fs>52){fs-=4;x.font="700 "+fs+"px "+D;}
  x.fillText(title,P,top+62+fs);
  var y=top+62+fs+24;
  /* показатели */
  var dur=workoutDuration(w),ton=tonnage(w),exN=doneEntries(w).length;
  var stats=[[dur&&dur>=60000?fmtClockShort(dur):"—","время"],[fmtBig(ton),"кг поднято"],[String(exN),plural(exN,"упражнение","упражнения","упражнений")]];
  var bw=(W-2*P-40)/3,sh=story?150:134;
  stats.forEach(function(s,i){var bx=P+i*(bw+20);
    rr(x,bx,y+16,bw,sh,26);x.fillStyle="rgba(255,255,255,0.07)";x.fill();x.strokeStyle="rgba(255,255,255,0.10)";x.lineWidth=2;x.stroke();
    x.fillStyle="#ffffff";var f2=story?58:52;x.font="600 "+f2+"px "+N;while(x.measureText(s[0]).width>bw-44&&f2>28){f2-=2;x.font="600 "+f2+"px "+N;}
    x.fillText(s[0],bx+22,y+16+sh*0.52);
    x.fillStyle="rgba(255,255,255,0.6)";x.font="500 27px "+B;x.fillText(s[1],bx+22,y+16+sh*0.82);});
  y+=16+sh+36;
  /* сравнение с картинкой */
  var cmp=pickThing(ton,seed);
  if(cmp){
    var ch=story?330:236;
    rr(x,P,y,W-2*P,ch,32);var cg=x.createLinearGradient(P,y,W-P,y+ch);cg.addColorStop(0,acc.glow+"40");cg.addColorStop(1,acc.glow2+"1f");x.fillStyle=cg;x.fill();
    x.strokeStyle=acc.glow+"80";x.lineWidth=2;x.stroke();
    var tx=P+40;
    x.fillStyle="rgba(255,255,255,0.7)";x.font="600 26px "+B;
    x.save();x.translate(tx,y+58);var l2="ЭТО КАК ПОДНЯТЬ",l2x=0;for(var k=0;k<l2.length;k++){x.fillText(l2[k],l2x,0);l2x+=x.measureText(l2[k]).width+4;}x.restore();
    x.fillStyle="#ffffff";var f3=story?68:58;x.font="700 "+f3+"px "+D;
    var maxTw=story?W-2*P-80:W-2*P-80-260;
    while(x.measureText(cmp.text).width>maxTw&&f3>34){f3-=2;x.font="700 "+f3+"px "+D;}
    x.fillText(cmp.text,tx,y+58+f3+14);
    x.fillStyle="rgba(255,255,255,0.6)";x.font="500 26px "+B;x.fillText("по ≈ "+fmtBig(cmp.each)+" кг",tx,y+58+f3+60);
    /* картинка */
    var count=Math.max(1,Math.round(cmp.n));
    if(story){
      var per=Math.min(count,6),es=per>4?100:130;x.font=es+"px "+EMOJI;x.textBaseline="middle";
      var ey=y+ch-80;for(var e=0;e<per;e++)x.fillText(cmp.t.ic,tx+e*(es+14),ey);
      if(count>6){x.font="700 54px "+D;x.fillStyle="#fff";x.fillText("×"+count,tx+per*(es+14)+10,ey);}
      x.textBaseline="alphabetic";
    }else{
      x.textBaseline="middle";x.textAlign="center";
      var cx=W-P-150,cy=y+ch/2;
      if(count<=3){var sz=count===1?170:count===2?120:100;x.font=sz+"px "+EMOJI;
        for(var e2=0;e2<count;e2++){var off=(e2-(count-1)/2)*(sz*0.7);x.fillText(cmp.t.ic,cx+off,cy+(e2%2?18:-12));}}
      else{x.font="150px "+EMOJI;x.fillText(cmp.t.ic,cx-10,cy);
        rr(x,cx+40,cy+28,104,58,29);x.fillStyle="#ffffff";x.fill();x.fillStyle="#0c0f16";x.font="700 34px "+D;x.fillText("×"+count,cx+92,cy+58);}
      x.textAlign="left";x.textBaseline="alphabetic";
    }
    y+=ch+40;
  }
  /* низ: цитата + подпись */
  var quote=pickQuote(seed);
  x.font="500 "+(story?40:34)+"px "+B;var ql=wrapText(x,quote,W-2*P-70);
  var qlh=story?54:46,qh=ql.length*qlh+20;
  var footY=H-(story?150:P)-10;
  var qy=footY-90-qh;
  /* упражнения */
  var recArr=workoutRecords(w);var recs={};recArr.forEach(function(r){recs[r.exId]=r;});
  var list=doneEntries(w);
  var avail=qy-30-y;
  if(story&&recArr.length&&avail-list.length*80>=250){
    var tr=recArr.slice().sort(function(a,b){return (b.w-b.prev.w)-(a.w-a.prev.w);})[0];
    rr(x,P,y,W-2*P,200,30);var gb=x.createLinearGradient(P,y,W-P,y+200);gb.addColorStop(0,"rgba(245,197,66,0.22)");gb.addColorStop(1,"rgba(240,140,46,0.10)");x.fillStyle=gb;x.fill();
    x.strokeStyle="rgba(245,197,66,0.55)";x.lineWidth=3;x.stroke();
    x.fillStyle="#f5c542";x.font="600 28px "+B;x.fillText("🏆  НОВЫЙ РЕКОРД",P+36,y+54);
    x.fillStyle="#ffffff";x.font="600 38px "+B;x.fillText(fitText(x,exName(tr.exId),W-2*P-72),P+36,y+104);
    x.font="600 54px "+N;x.fillStyle="#f5c542";var big=(tr.w?fmtNum(tr.w)+" кг × ":"")+tr.r;x.fillText(big,P+36,y+170);
    var bwid=x.measureText(big).width;x.font="500 26px "+B;x.fillStyle="rgba(255,255,255,0.6)";
    x.fillText("было "+(tr.prev.w?fmtNum(tr.prev.w)+" × ":"")+tr.prev.r,P+36+bwid+24,y+168);
    y+=200+46;avail=qy-30-y;
  }
  var rowH=Math.max(62,Math.min(story?92:80,Math.floor(avail/Math.max(list.length,1))));
  var maxRows=Math.max(0,Math.floor(avail/rowH));
  if(list.length>maxRows)maxRows=Math.max(0,maxRows-1);
  var shown=list.slice(0,maxRows);
  shown.forEach(function(en,i){
    var ry=y+i*rowH;var isPr=!!recs[en.exId];
    if(i>0){x.strokeStyle="rgba(255,255,255,0.09)";x.lineWidth=2;x.beginPath();x.moveTo(P,ry-rowH*0.3);x.lineTo(W-P,ry-rowH*0.3);x.stroke();}
    var val=setsText(en);
    x.font="600 32px "+N;var vw=x.measureText(val).width;
    x.fillStyle=isPr?"#f5c542":"rgba(255,255,255,0.92)";x.textAlign="right";x.fillText(val,W-P,ry+24);x.textAlign="left";
    x.font="500 34px "+B;x.fillStyle="#ffffff";
    x.fillText(fitText(x,(isPr?"🏆 ":"")+exName(en.exId),W-2*P-vw-40),P,ry+24);
  });
  if(list.length>shown.length){x.fillStyle="rgba(255,255,255,0.55)";x.font="500 28px "+B;var more=list.length-shown.length;x.fillText((shown.length?"и ещё ":"")+more+" "+plural(more,"упражнение","упражнения","упражнений"),P,y+shown.length*rowH+18);}
  /* цитата */
  x.fillStyle=acc.glow;x.font="700 120px "+D;x.fillText("“",P-6,qy+78);
  x.fillStyle="rgba(255,255,255,0.88)";x.font="500 "+(story?40:34)+"px "+B;
  ql.forEach(function(l,i){x.fillText(l,P+66,qy+44+i*qlh);});
  /* подпись */
  var nPr=recArr.length;
  if(nPr){var t=nPr+" "+plural(nPr,"новый рекорд","новых рекорда","новых рекордов");x.font="600 30px "+B;var tw=x.measureText(t).width+100;
    rr(x,P,footY-30,tw,60,30);var gg=x.createLinearGradient(P,0,P+tw,0);gg.addColorStop(0,"#f5c542");gg.addColorStop(1,"#f08c2e");x.fillStyle=gg;x.fill();
    x.fillStyle="#1d1405";x.fillText("🏆  "+t,P+28,footY+10);}
  x.fillStyle="rgba(255,255,255,0.45)";x.font="500 25px "+B;x.textAlign="right";x.fillText("сделано в «Дневнике зала»",W-P,footY+9);x.textAlign="left";
  return c;
}
