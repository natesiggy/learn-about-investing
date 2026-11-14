'use strict';
// Shared pure model: also exercised by the included verification script.
function project(initial, monthly, years, rate, fee=0, tax=0, cost=0) {
  let balance=initial;
  const rows=[{year:0,contributed:initial,balance}];
  for(let month=1;month<=years*12;month++){
    balance=Math.max(0,balance*(1+(rate-fee-tax)/1200)-cost)+monthly;
    if(month%12===0) rows.push({year:month/12,contributed:initial+month*monthly,balance});
  }
  return rows;
}
function weightedReturn(stocks,bonds,returns){
  return (stocks*returns[0]+bonds*returns[1]+(100-stocks-bonds)*returns[2])/100;
}
if(typeof module!=='undefined') module.exports={project,weightedReturn};
if(typeof document!=='undefined') {
  const $=id=>document.getElementById(id);
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
  const pct=n=>n.toFixed(1)+'%';
  const put=(id,value)=>{$(id).textContent=value;};
  if(new URLSearchParams(location.search).get('embed')==='1') document.body.classList.add('embedded');
  function set(id,value){$(id).value=value;$(id+'-n').value=value;}
  function val(id){return Number($(id).value);}
  function pair(id,fn){
    const range=$(id), number=$(id+'-n');
    range.addEventListener('input',()=>{number.value=range.value;fn(id);});
    const update=()=>{
      if(number.value==='' || !Number.isFinite(number.valueAsNumber)) return;
      const v=Math.min(Number(range.max),Math.max(Number(range.min),number.valueAsNumber));
      range.value=String(v);fn(id);
    };
    number.addEventListener('input',update);
    number.addEventListener('change',()=>{if(number.value==='')number.value=range.value;update();number.value=range.value;});
    number.addEventListener('blur',()=>{number.value=range.value;});
  }
  if($('stocks')){
    const scenarios={down:[-30,3,2],up:[20,4,2],both:[-20,-10,2]};
    function update(changed){
      if(val('stocks')+val('bonds')>100) set(changed==='stocks'?'bonds':'stocks',100-val(changed));
      const s=val('stocks'),b=val('bonds'),c=100-s-b,returns=scenarios[$('scenario').value];
      const r=weightedReturn(s,b,returns),end=1000*(1+r/100);
      put('cash-label',c+'%');put('stock-label',s+'%');
      $('donut').style.background=`conic-gradient(#315e8b 0% ${s}%, #916532 ${s}% ${s+b}%, #b6bec5 ${s+b}% 100%)`;
      put('allocation-text',`Stocks ${s}% · Bonds ${b}% · Cash ${c}%`);
      put('scenario-assumptions',`Scenario returns: stocks ${returns[0]}%, bonds ${returns[1]}%, cash ${returns[2]}%.`);
      put('portfolio-value',money(end));
      put('portfolio-change',`${r>=0?'+':''}${money(end-1000)} (${pct(r)}) from $1,000.`);
      put('risk-note',s>=70?'Most of this portfolio follows stock-market moves. A longer timeline may help you tolerate swings, but it does not guarantee recovery.':s<=30?'This mix has less stock exposure. Cash still faces inflation risk, and bonds can lose value.':'This mix spreads money across assets. Diversification can reduce concentration risk, but cannot prevent all losses.');
      $('portfolio-table').innerHTML=['Stocks','Bonds','Cash'].map((name,i)=>`<tr><th>${name}</th><td>${money([s,b,c][i]*10)}</td><td>${returns[i]}%</td><td>${money([s,b,c][i]*10*returns[i]/100)}</td></tr>`).join('');
    }
    pair('stocks',update);pair('bonds',update);$('scenario').addEventListener('change',()=>update());
    document.querySelectorAll('[data-mix]').forEach(button=>button.addEventListener('click',()=>{const [s,b]=button.dataset.mix.split(',').map(Number);set('stocks',s);set('bonds',b);update();}));
    $('reset-portfolio').addEventListener('click',()=>{set('stocks',60);set('bonds',30);$('scenario').value='down';update();});
    update();
  }
  if($('initial')){
    const defaults={initial:500,monthly:25,years:30,rate:6,fee:.2,tax:0,cost:0};
    function chart(gross,net){
      const max=Math.max(1,...gross.map(x=>x.balance),...net.map(x=>x.balance),...net.map(x=>x.contributed));
      const years=net.at(-1).year;
      const x=i=>70+(years?i/years:0)*510,y=n=>235-n/max*200;
      const line=(rows,key,color,dash='')=>`<polyline fill="none" stroke="${color}" stroke-width="3" ${dash?'stroke-dasharray="'+dash+'"':''} points="${rows.map(r=>x(r.year)+','+y(r[key])).join(' ')}"/>`;
      $('growth-chart').innerHTML=`<title>Growth over ${years} years</title><desc>No-cost final balance ${money(gross.at(-1).balance)}, after-cost balance ${money(net.at(-1).balance)}, contributions ${money(net.at(-1).contributed)}. Annual values are in the table below.</desc>`+[0,.5,1].map(frac=>`<line x1="70" x2="580" y1="${y(max*frac)}" y2="${y(max*frac)}" stroke="#d5d9de"/><text x="62" y="${y(max*frac)+4}" text-anchor="end" font-size="11" fill="#535b64">${money(max*frac)}</text>`).join('')+line(gross,'balance','#916532')+line(net,'balance','#315e8b')+line(net,'contributed','#626a73','5 5')+`<text x="70" y="264" font-size="12" fill="#535b64">Year 0</text><text x="580" y="264" text-anchor="end" font-size="12" fill="#535b64">Year ${years}</text>`;
    }
    function update(){
      const v=Object.fromEntries(Object.keys(defaults).map(id=>[id,val(id)]));
      const gross=project(v.initial,v.monthly,v.years,v.rate),net=project(v.initial,v.monthly,v.years,v.rate,v.fee,v.tax,v.cost);
      const a=gross.at(-1),b=net.at(-1);
      put('final-value',money(b.balance));put('contributed',money(b.contributed));put('baseline',money(a.balance));put('drag',money(a.balance-b.balance));put('growth',money(b.balance-b.contributed));
      if(v.years>=5){const delayed=project(v.initial,v.monthly,v.years-5,v.rate,v.fee,v.tax,v.cost).at(-1);put('delay',`Start five years later with the same initial amount and monthly contribution: ${money(delayed.balance)} after costs by the same end date. That path also contributes ${money(v.monthly*60)} less. `);}else put('delay','Choose at least five years to explore the five-year delay comparison.');
      $('compound-table').innerHTML=net.map((r,i)=>`<tr><th>${r.year}</th><td>${money(r.contributed)}</td><td>${money(gross[i].balance)}</td><td>${money(r.balance)}</td></tr>`).join('');
      chart(gross,net);
    }
    Object.keys(defaults).forEach(id=>pair(id,update));
    $('reset-compound').addEventListener('click',()=>{Object.entries(defaults).forEach(([id,v])=>set(id,v));update();});
    update();
  }
}
