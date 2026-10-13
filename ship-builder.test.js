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
console.log('2D shipyard interaction tests passed.');
