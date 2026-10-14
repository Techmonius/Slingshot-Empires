'use strict';
// Execute: node cargo-flight.test.js
// Exercises the actual production HTML script with a deterministic DOM shim.
// The cargo flight is intentionally a read-only, opt-in in-map playtest.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const app=html.split("<script>\n(()=>{")[1]?.split('</script>')[0];
assert.ok(app,'The production orbital flight script must remain available');
function create({dev=true,stock=9,surveyed=true,commissioned=true}={}){
 const handlers={},elements=new Map(),storage=Object.create(null);
 storage['slingshot-flight-lab-v04']=JSON.stringify({
  shots:17,wins:[],grades:{},
  stations:{aurora:{deliveries:commissioned?3:2,best:commissioned?[90,87,86]:[90,87]},
   cinder:{deliveries:0,best:[]}},
  mines:{aurora:{surveyed,rigs:[],stock:{ice:stock,silicon:2},extracted:{ice:stock,silicon:2},lastAt:Date.now()}}
 });
 const ctx={setTransform(){}},classes=new Map();
 function el(id){
  if(!elements.has(id)){
   const classSet=new Set();classes.set(id,classSet);
   elements.set(id,{
    style:{},hidden:false,disabled:false,value:'',textContent:'',innerHTML:'',scrollTop:0,width:390,height:600,
    setAttribute(){},
    classList:{add:k=>classSet.add(k),remove:k=>classSet.delete(k),
     toggle(k,v){if(v===undefined)v=!classSet.has(k);if(v)classSet.add(k);else classSet.delete(k)},
     contains:k=>classSet.has(k)},
    addEventListener(k,fn){handlers[id+':'+k]=fn},
    getBoundingClientRect(){return {width:390,height:600,left:0,top:0}},
    getContext(){return ctx}
   });
  }
  return elements.get(id);
 }
 const doc={getElementById:el,addEventListener(){}};
 const win={devicePixelRatio:1,addEventListener(){}};
 const loc={search:dev===true?'?cargoDev=1':dev===false?'?cargoDev=0':'',protocol:'file:'};
 const db={getItem:k=>storage[k]??null,setItem(k,v){storage[k]=v}};
 new Function('window','document','localStorage','location','navigator','requestAnimationFrame',
  'setInterval','performance','URLSearchParams',"(()=>{"+app)(
  win,doc,db,loc,{},()=>0,()=>0,{now:()=>0},URLSearchParams);
 assert.ok(win.__flightLab,'Flight diagnostics must be accessible');
 return {api:win.__flightLab,storage,el,handlers};
}
function plan(t,units=2,resource='ice'){
 t.api.openMiningScreen('aurora');
 t.el('cargoPlaytestResource').value=resource;
 t.el('cargoPlaytestAmount').value=String(units);
 t.handlers['cargoPlaytestStart:click']();
 return t.api.getState();
}
const cargo=create();
assert.equal(cargo.api.getState().shots,17);
const aim=plan(cargo);
assert.equal(cargo.el('cargoPlaytestControls').hidden,false);
assert.equal(aim.phase,'aiming');
assert.equal(aim.target,'aurora');
assert.equal(aim.viewMode,'orbit');
assert.deepEqual(aim.cargoFlight,{world:'aurora',resource:'ice',amount:2});
assert.equal(cargo.api.getState().mining.aurora.deposits[0].stock,9);
assert.equal(cargo.api.getState().stationStats.aurora.deliveries,3);
cargo.handlers['launchButton:click']();
const flying=cargo.api.getState();
assert.equal(flying.phase,'flying');
assert.equal(flying.localEncounter,true,'Local planet physics starts on the first frame');
assert.equal(flying.orbit.stable,true,'A tangential local launch can establish orbit');
assert.equal(flying.shots,17,'Dev flight may not increment real mission statistics');
assert.equal(flying.mining.aurora.deposits[0].stock,9,'Planning and launch never debit cargo');
cargo.api.advanceTest(100);
assert.equal(cargo.api.getState().phase,'flying','Safe orbit alone cannot complete cargo delivery');
assert.equal(cargo.api.getState().mining.aurora.deposits[0].stock,9);
assert.deepEqual(cargo.api.getState().wins,[]);
assert.equal(JSON.parse(cargo.storage['slingshot-flight-lab-v04']).shots,17);
const badAmount=create();
assert.equal(plan(badAmount,15).cargoFlight,null);
assert.equal(plan(badAmount,10).cargoFlight,null);
assert.equal(plan(badAmount,1.5).cargoFlight,null);
assert.equal(plan(badAmount,2,'iron').cargoFlight,null);
const notReady=create({commissioned:false});
assert.equal(plan(notReady).cargoFlight,null);
const notSurveyed=create({surveyed:false});
assert.equal(plan(notSurveyed).cargoFlight,null);
const unstocked=create({stock:0});
assert.equal(plan(unstocked,1,'ice').cargoFlight,null);
const ordinary=create({dev:false});
assert.equal(plan(ordinary).cargoFlight,null,'Without playtest flag cargo flights are inaccessible');
assert.equal(ordinary.el('cargoPlaytestControls').hidden,true);
ordinary.handlers['launchButton:click']();
assert.equal(ordinary.api.getState().shots,18,'Original Home mission stats are still recorded');
assert.equal(ordinary.api.getState().localEncounter,false,'Normal interplanetary flight starts on the system map');
assert.equal(ordinary.api.getState().target,'aurora');
cargo.api.chooseTarget('cinder');
assert.equal(cargo.api.getState().cargoFlight,null);
assert.equal(cargo.api.getState().viewMode,'system');
// Interim release: the in-app test does not require mining, surveying or stations.
const newPlayer=create({dev:null,stock:0,surveyed:false,commissioned:false});
newPlayer.api.openStationDashboard();
assert.equal(newPlayer.el('demoCargoLaunch').disabled,false);
assert.equal(newPlayer.el('demoCargoPlanet').value,'',
 'The DOM stub does not simulate default select values; the real markup has Aurora selected');
// User selects Aurora from the in-app playtest card.
newPlayer.el('demoCargoPlanet').value='aurora';
newPlayer.handlers['demoCargoLaunch:click']();
const training=newPlayer.api.getState();
assert.equal(training.phase,'aiming');
assert.equal(training.target,'aurora');
assert.equal(training.viewMode,'orbit');
assert.equal(training.cargoFlight.training,true);
assert.equal(training.cargoFlight.amount,2);
assert.equal(training.cargoFlight.resource,'ice');
newPlayer.handlers['launchButton:click']();
assert.equal(newPlayer.api.getState().phase,'flying');
assert.equal(newPlayer.api.getState().localEncounter,true);
assert.equal(newPlayer.api.getState().shots,17);
assert.equal(newPlayer.api.getState().stationStats.aurora.deliveries,2);
newPlayer.api.advanceTest(100);
assert.equal(newPlayer.api.getState().mining.aurora.deposits[0].stock,0);
assert.deepEqual(newPlayer.api.getState().wins,[]);
assert.equal(newPlayer.api.getState().phase,'flying');
newPlayer.api.chooseTarget('aurora');
assert.equal(newPlayer.api.getState().cargoFlight,null);
assert.equal(newPlayer.el('exitCargoTest').hidden,true);
const onRelease=create({dev:null});
onRelease.api.openMiningScreen('aurora');
assert.equal(onRelease.el('cargoPlaytestControls').hidden,false,
 'The released app shows cargo playtest controls without query flags');
assert.ok(html.includes('href="./ship-builder.html"'),'Shipyard must be discoverable from game UI');
assert.ok(html.includes('V0.15.1 · PLAYTEST'),'Interim release must be clearly labeled');
console.log('In-map cargo playtest and default-on release regression tests passed.');
