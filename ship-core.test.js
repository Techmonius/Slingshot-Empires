'use strict';
// Run: node ship-core.test.js
// Pure ship-design regression tests; does not modify the playable game.
const assert=require('node:assert/strict');
const ships=require('./ship-core.js');
const base=ships.starterDesign();
const result=ships.evaluateDesign(base);
assert.equal(result.ok,true);
assert.equal(result.stats.fuelLoaded,7);
assert.equal(result.stats.fuelCapacity,7);
assert.equal(result.stats.cargoCapacity,12);
const loaded=ships.evaluateDesign({...base,payload:{iron:8}});
assert.equal(loaded.ok,true);
assert.ok(loaded.stats.deltaV<result.stats.deltaV,'Cargo must cost delta-v');
assert.ok(loaded.stats.initialAcceleration<result.stats.initialAcceleration,'Cargo must reduce acceleration');
const lighterFuel=ships.evaluateDesign({...base,fuelUnits:3});
assert.ok(lighterFuel.stats.deltaV<result.stats.deltaV);
assert.ok(lighterFuel.stats.initialAcceleration>result.stats.initialAcceleration);
const addedTank=ships.evaluateDesign({...base,tanks:['standard-tank','compact-tank'],fuelUnits:10});
assert.ok(addedTank.stats.deltaV>result.stats.deltaV);
assert.equal(ships.evaluateDesign({...base,tanks:['standard-tank','standard-tank','standard-tank']}).ok,false);
assert.equal(ships.evaluateDesign({...base,payload:{ice:13}}).ok,false);
assert.equal(ships.evaluateDesign({...base,fuelUnits:99}).ok,false);
assert.equal(ships.evaluateDesign({...base,fuelUnits:0}).stats.deltaV,0);
assert.equal(ships.evaluateDesign({...base,engine:'vacuum-engine'}).ok,false);
assert.equal(ships.evaluateDesign({...base,engine:'vacuum-engine'},{technology:['vacuum-propulsion']}).ok,true);
assert.equal(ships.evaluateDesign({...base,frame:'cargo-frame'}).ok,false);
assert.equal(ships.evaluateDesign({...base,frame:'cargo-frame'},{technology:['expanded-shipbuilding']}).ok,true);
assert.equal(ships.evaluateDesign({...base,payload:{unobtainium:1}}).ok,false);
for(const invalid of [NaN,Infinity,-1])
 assert.equal(ships.evaluateDesign({...base,fuelUnits:invalid}).ok,false);
const zero=ships.previewBurn(result.stats,7,0);
assert.equal(zero.ok,true);
assert.equal(zero.spent,0);
const first=ships.previewBurn(result.stats,7,5);
const second=ships.previewBurn(result.stats,first.remainingFuel,4);
assert.equal(first.ok,true);assert.equal(second.ok,true);
assert.ok(first.spent>0&&second.spent>0);
assert.ok(Math.abs(result.stats.deltaV-9-second.remainingDeltaV)<1e-9);
assert.equal(ships.previewBurn(result.stats,7,100).ok,false);
assert.equal(ships.previewBurn(result.stats,7,-1).ok,false);
assert.equal(ships.previewBurn(result.stats,-1,2).ok,false);
assert.equal(base.tanks.length,1);
assert.equal(base.fuelUnits,7);
assert.equal(Object.keys(base.payload).length,0);
// Attachment position is operational-only: servicing and handling can improve
// without altering any movement/propulsion statistics for identical hardware.
const forward=ships.evaluateLayout({...base,tanks:['standard-tank',null]});
const aft=ships.evaluateLayout({...base,tanks:[null,'standard-tank']});
assert.equal(forward.ok,true);assert.equal(aft.ok,true);
assert.ok(aft.fuelHandling>forward.fuelHandling);
assert.ok(aft.overall>forward.overall);
assert.equal(aft.cargoHandling,112,'One forward cargo socket has no impossible relocation');
assert.equal(aft.slots['tank:1'].bestPosition,'AFT');
const ideal={...base,tanks:['compact-tank','standard-tank'],fuelUnits:10};
const swapped={...base,tanks:['standard-tank','compact-tank'],fuelUnits:10};
const optimalLayout=ships.evaluateLayout(ideal),badLayout=ships.evaluateLayout(swapped);
assert.ok(optimalLayout.overall>badLayout.overall);
assert.equal(optimalLayout.fuelHandling,112);
assert.equal(badLayout.fuelHandling,88);
const optimalFlight=ships.evaluateDesign(ideal),badFlight=ships.evaluateDesign(swapped);
assert.equal(optimalFlight.ok,true);assert.equal(badFlight.ok,true);
for(const k of ['dryMass','wetMass','payloadMass','deltaV','thrust','initialAcceleration','fuelCapacity','fuelLoaded'])
 assert.equal(optimalFlight.stats[k],badFlight.stats[k],'Placement must not affect '+k);
assert.deepEqual(ships.previewBurn(optimalFlight.stats,10,5),ships.previewBurn(badFlight.stats,10,5));
assert.equal(ships.evaluateLayout({...base,tanks:[null,null],bays:[]}).overall,null);
assert.equal(ships.evaluateLayout({...base,tanks:['cargo-pod']}).ok,false);
assert.equal(ships.evaluateLayout({...base,tanks:['standard-tank','standard-tank','standard-tank']}).ok,false);
// Confirm both agreed operational outcomes: faster servicing AND fewer losses.
// The exact rates are provisional, and no cargo or propellant moves here.
const equipped={...ideal,payload:{ice:8}};
const equippedSwap={...swapped,payload:{ice:8}};
const quick=ships.projectService(equipped),slow=ships.projectService(equippedSwap);
assert.equal(quick.ok,true);assert.equal(slow.ok,true);
assert.ok(quick.fuel.minutes<slow.fuel.minutes,'Good layout shortens fuel turnaround');
assert.ok(quick.fuel.lostUnits<slow.fuel.lostUnits,'Good layout preserves more propellant');
assert.ok(quick.fuel.deliveredUnits>slow.fuel.deliveredUnits);
assert.equal(quick.cargo.minutes,slow.cargo.minutes,'Same cargo mount is unaffected by tank position');
assert.equal(quick.cargo.lostUnits,slow.cargo.lostUnits);
for(const result of [quick,slow]){
 for(const kind of ['fuel','cargo']){
  const op=result[kind];
  assert.ok(op.deliveredUnits<=op.amount,'Efficiency must not create resources');
  assert.ok(op.lostUnits>=0&&op.lostUnits<=op.amount);
  assert.ok(Math.abs(op.deliveredUnits+op.lostUnits-op.amount)<1e-9);
  assert.ok(op.minutes>=0);
 }
}
assert.equal(ships.projectService({...base,fuelUnits:0}).fuel.lostUnits,0);
assert.equal(ships.projectService(base).cargo.lostUnits,0);
assert.equal(ships.projectService({...base,tanks:[],fuelUnits:7}).ok,false);
assert.equal(ships.projectService({...base,bays:[],payload:{ice:2}}).ok,false);
for(const invalid of [NaN,Infinity,-1])assert.equal(ships.projectService(base,{fuelUnits:invalid}).ok,false);
assert.equal(ships.projectService(base,{cargoUnits:1000001}).ok,false);
assert.equal(ships.projectService(null).ok,false);
assert.deepEqual(ships.evaluateDesign(equipped).stats,ships.evaluateDesign(equippedSwap).stats);
console.log('Modular spacecraft regression tests passed.');
