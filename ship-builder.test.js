'use strict';
// Run with: node ship-builder.test.js
// Headless interaction checks for the stand-alone 2D shipyard prototype.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ships=require('./ship-core.js');
const html=fs.readFileSync(path.join(__dirname,'ship-builder.html'),'utf8');
const script=html.split('<script>\n')[1]?.split('</script>')[0];
assert.ok(script,'Inline shipyard script must be present');
function create(initial={}){
 const nodes=new Map(),handlers={},save={...initial};
 let hit=null;
 function elem(id){
  if(!nodes.has(id)){
   const classes=new Set();
   nodes.set(id,{id,value:'',textContent:'',innerHTML:'',hidden:false,style:{},max:'',contains(){return true},
    classList:{toggle(key,on){if(on===undefined)on=!classes.has(key);on?classes.add(key):classes.delete(key)},
     contains(k){return classes.has(k)},add(k){classes.add(k)},remove(k){classes.delete(k)}},
    addEventListener(k,cb){handlers[id+':'+k]=cb},querySelectorAll(){return []},closest(){return null}});
  }
  return nodes.get(id);
 }
 const win={SlingshotShips:ships,addEventListener(n,cb){handlers['window:'+n]=cb}};
 const doc={getElementById:elem,elementFromPoint(){return hit}};
 const storage={getItem(k){return save[k]||null},setItem(k,v){save[k]=v}};
 new Function('window','document','localStorage',script)(win,doc,storage);
 return {api:win.__shipBuilder,elem,handlers,save,setHit(x){hit=x}};
}
const t=create(),ui=t.api;
assert.equal(ui.evaluate().ok,true);
assert.ok(t.elem('partTray').innerHTML.includes('Compact Tank'));
assert.equal((t.elem('tankSockets').innerHTML.match(/data-slot="tank:/g)||[]).length,2);
function tile(part){
 const src={dataset:{part},closest(key){return key==='[data-part]'?this:null}};
 return src;
}
function mount(id){
 return {dataset:{slot:id},classList:{add(){},remove(){}},
  closest(key){return key==='[data-slot]'?this:null}};
}
function pointer(target,x=10,y=10){
 return {pointerId:101,clientX:x,clientY:y,button:0,target,preventDefault(){}};
}
const compact=tile('compact-tank');
t.handlers['partTray:pointerdown'](pointer(compact));
t.setHit(mount('tank:1'));
t.handlers['window:pointermove'](pointer(compact,50,90));
t.handlers['window:pointerup'](pointer(compact,50,90));
assert.equal(ui.snapshot().tanks[1],'compact-tank');
assert.equal(t.elem('dragGhost').hidden,true);
assert.equal(ui.evaluate().stats.fuelCapacity,10);
// Tapping a palette part and then an already occupied socket replaces it.
ui.select('standard-tank');
const target=mount('tank:1');
const installed={dataset:{installed:'compact-tank'},closest(k){
 return k==='[data-installed]'?this:k==='[data-slot]'?target:null;
}};
t.handlers['rocket:pointerdown'](pointer(installed));
t.handlers['rocket:click']({target:{closest(k){return k==='[data-slot]'?target:null}}});
assert.equal(ui.snapshot().tanks[1],'standard-tank');
assert.equal(ui.select('cargo-pod'),true);
assert.equal(ui.select('cargo-pod'),true);
assert.equal(t.elem('stageTip').textContent.includes('Drag a part'),true);
assert.equal(ui.place('cargo-pod','engine:0'),false);
assert.equal(ui.snapshot().engine,'chemical-engine');
assert.equal(ui.select('vacuum-engine'),false);
assert.equal(ui.remove('tank:0'),true);
assert.ok(ui.snapshot().fuelUnits<=7);
assert.equal(ui.setCargo('iron',20),true);
assert.equal(ui.evaluate().ok,false);
t.handlers['saveBlueprint:click']();
assert.equal(t.save['slingshot-shipyard-prototype-v016'],undefined,'Do not save invalid rocket');
ui.setCargo('iron',4);
assert.equal(ui.evaluate().ok,true);
t.handlers['saveBlueprint:click']();
const reloaded=create(t.save);
assert.equal(reloaded.api.snapshot().payload.iron,4);
assert.equal(reloaded.api.evaluate().ok,true);
assert.equal(t.save['slingshot-flight-lab-v04'],undefined,'Prototype must not change live game saves');
// New player choice: mounting order affects servicing but never rocket movement.
const fresh=create(),initial=fresh.api.layout();
const initialFlight=fresh.api.evaluate().stats;
assert.equal(initial.ok,true);
assert.ok(fresh.elem('layoutFuel').textContent.includes('%'));
assert.ok(fresh.elem('tankSockets').innerHTML.includes('Fuel servicing'));
assert.ok(fresh.elem('layoutAdvice').textContent.includes('AFT'));
assert.equal(fresh.api.select('standard-tank'),true);
assert.ok(fresh.elem('tankSockets').innerHTML.includes('DROP FIT 112.0%'));
assert.ok(fresh.elem('tankSockets').innerHTML.includes('DROP FIT 88.0%'));
assert.equal(fresh.api.select('standard-tank'),true);
const initialFuelTime=fresh.elem('fuelServiceTime').textContent;
const initialRetained=fresh.elem('fuelPreserved').textContent;
assert.equal(fresh.api.place('standard-tank','tank:1','tank:0'),true);
const optimized=fresh.api.layout(),afterMove=fresh.api.evaluate().stats;
assert.ok(parseFloat(fresh.elem('fuelServiceTime').textContent)<parseFloat(initialFuelTime));
assert.ok(parseFloat(fresh.elem('fuelPreserved').textContent.match(/estimated loss ([0-9.]+)%/)[1])<
 parseFloat(initialRetained.match(/estimated loss ([0-9.]+)%/)[1]));
assert.ok(fresh.elem('cargoServiceTime').textContent.includes('0.0 min'));
assert.ok(fresh.elem('cargoPreserved').textContent.includes('No cargo loaded'));
assert.equal(fresh.api.setCargo('ice',8),true);
assert.ok(parseFloat(fresh.elem('cargoServiceTime').textContent)>0);
assert.ok(fresh.elem('cargoPreserved').textContent.includes('estimated loss'));

assert.ok(optimized.overall>initial.overall);
assert.ok(optimized.fuelHandling>initial.fuelHandling);
assert.equal(optimized.cargoHandling,initial.cargoHandling);
assert.equal(fresh.elem('layoutFuel').textContent,optimized.fuelHandling.toFixed(1)+'%');
for(const key of ['deltaV','wetMass','initialAcceleration','thrust','fuelLoaded'])
 assert.equal(afterMove[key],initialFlight[key],'Moving an unchanged part must not affect '+key);
assert.equal(fresh.api.place('compact-tank','tank:0'),true);
const wellArranged=fresh.api.layout(),goodFlight=fresh.api.evaluate().stats;
assert.equal(wellArranged.slots['tank:0'].position,'FORWARD');
assert.equal(wellArranged.slots['tank:1'].position,'AFT');
assert.equal(wellArranged.fuelHandling,112);
assert.equal(fresh.api.place('standard-tank','tank:0','tank:1'),true);
const poorlyArranged=fresh.api.layout(),badFlight=fresh.api.evaluate().stats;
assert.ok(wellArranged.overall>poorlyArranged.overall);
assert.equal(poorlyArranged.fuelHandling,88);
for(const key of ['deltaV','wetMass','initialAcceleration','fuelCapacity','cargoCapacity'])
 assert.equal(goodFlight[key],badFlight[key],'Swapping modules must not change '+key);
// Approved battery-first electrical subsystem and modular docking interface.
const electricallyEquipped=create(),ed=electricallyEquipped.api;
assert.equal(ed.snapshot().docking,'basic-docking-port');
assert.equal(ed.snapshot().powerUnits,6);
assert.equal(ed.evaluate().stats.batteryCapacity,6);
assert.equal(ed.evaluate().stats.dockingInstalled,true);
assert.equal(ed.dock().ok,true);
assert.equal(ed.dock().cost,2);
assert.equal(ed.dock().assistRadius,2.5);
assert.ok(electricallyEquipped.elem('dockSocket').innerHTML.includes('Docking Coupler'));
assert.ok(electricallyEquipped.elem('partTray').innerHTML.includes('Precision Docking System'));
assert.ok(electricallyEquipped.elem('partTray').innerHTML.includes('Research locked'));
const unchangedFuel=ed.snapshot().fuelUnits;
assert.equal(ed.setPower(1),true);
assert.equal(ed.dock().ok,false,'Insufficient electrical charge blocks docking');
assert.equal(ed.evaluate().ok,true,'Low charge does not invalidate the basic spacecraft');
assert.equal(ed.evaluate().stats.fuelLoaded,unchangedFuel,'Electrical charge must not spend main propellant');
assert.ok(electricallyEquipped.elem('dockPowerStatus').textContent.includes('charge'));
assert.equal(ed.setPower(2),true);
assert.equal(ed.dock().ok,true);
assert.equal(ed.select('precision-docking-port'),false,'Advanced precision docking stays research locked');
assert.equal(ed.place('standard-tank','dock:0'),false,'Tank cannot fill docking socket');
assert.equal(ed.remove('dock:0'),true);
assert.equal(ed.snapshot().docking,null);
assert.equal(ed.dock().ok,false,'Missing coupler blocks docking');
assert.equal(ed.place('basic-docking-port','dock:0'),true);
assert.equal(ed.dock().ok,true);
assert.equal(ed.setPower(7),true);
assert.equal(ed.snapshot().powerUnits,6,'Cannot charge beyond built-in battery capacity');
// Existing prototype users must inherit starter equipment without deleting their designs.
const legacy=create({'slingshot-shipyard-prototype-v016':JSON.stringify({
 frame:'starter-frame',engine:'chemical-engine',tanks:['compact-tank','standard-tank'],
 bays:['cargo-pod'],fuelUnits:9,payload:{iron:2}
})});
assert.equal(legacy.api.snapshot().docking,'basic-docking-port');
assert.equal(legacy.api.snapshot().powerUnits,6);
assert.deepEqual(legacy.api.snapshot().tanks,['compact-tank','standard-tank']);
assert.equal(legacy.api.snapshot().payload.iron,2);
// An intentional cargo craft without docking gear remains a valid build.
const sansCoupler=create();
assert.equal(sansCoupler.api.remove('dock:0'),true);
assert.equal(sansCoupler.api.evaluate().ok,true);
assert.equal(sansCoupler.api.dock().ok,false);
sansCoupler.handlers['saveBlueprint:click']();
const sansReload=create(sansCoupler.save);
assert.equal(sansReload.api.snapshot().docking,null,'Explicitly removed docking hardware stays removed');
assert.equal(sansReload.api.dock().ok,false);
console.log('2D shipyard interaction tests passed.');
