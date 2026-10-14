'use strict';
// Run: node docking-core.test.js
const assert=require('node:assert/strict');
const dock=require('./docking-core.js');
const ships=require('./ship-core.js');
const starter=ships.starterDesign();
const basicHardware=ships.dockingHardware(starter);
assert.equal(basicHardware.ok,true);
const station=(t)=>({x:100+2*t,y:30,vx:2,vy:0,t});
const ship=(t,dx=1,dy=0,dvx=.2,dvy=0)=>({
 x:100+2*t+dx,y:30+dy,vx:2+dvx,vy:dvy,t
});
const sample=(t,overrides={})=>({
 ship:ship(t),station:station(t),manualFlight:true,safeOrbit:true,
 dockOperational:true,targetWorld:'home',stationWorld:'home',
 stationId:'home:orbital-dock',hardware:basicHardware,...overrides
});
const assessment=dock.evaluateApproach(sample(1));
assert.equal(assessment.eligible,true);
assert.equal(assessment.separation,1);
assert.ok(Math.abs(assessment.relativeSpeed-.2)<1e-9);
assert.equal(dock.evaluateApproach(sample(1,{manualFlight:false})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{safeOrbit:false})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{dockOperational:false})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{targetWorld:'cinder'})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{ship:ship(1,15)})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{ship:ship(1,5)})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{ship:ship(1,1,0,1.5)})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{ship:{...ship(1),vx:NaN}})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{station:station(2)})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{config:{assistRadius:20}})).eligible,false);
assert.equal(dock.beginAttempt({targetWorld:'home',stationId:'home:orbital-dock'}).docked,false);
assert.equal(dock.beginAttempt({targetWorld:'',stationId:'home'}),null);
let attempt=dock.beginAttempt({targetWorld:'home',stationId:'home:orbital-dock'});
let result=dock.advanceAttempt(attempt,sample(0,{ship:ship(0,10)}));
assert.equal(result.ok,true);
assert.equal(result.docked,false);
assert.equal(result.attempt.approachObserved,true);
attempt=result.attempt;
result=dock.advanceAttempt(attempt,sample(.25,{ship:ship(.25,5)}));
assert.equal(result.docked,false);
attempt=result.attempt;
result=dock.advanceAttempt(attempt,sample(.50));
assert.equal(result.docked,false);
attempt=result.attempt;
result=dock.advanceAttempt(attempt,sample(.75));
assert.equal(result.docked,false);
attempt=result.attempt;
result=dock.advanceAttempt(attempt,sample(1));
assert.equal(result.docked,false);
attempt=result.attempt;
result=dock.advanceAttempt(attempt,sample(1.25));
assert.equal(result.docked,true);
assert.equal(result.dockingEvent.stationId,'home:orbital-dock');
assert.equal(result.dockingEvent.targetWorld,'home');
assert.equal(result.dockingEvent.moduleId,'basic-docking-port');
assert.equal(result.dockingEvent.electricalEnergyCost,2);
assert.equal(result.assessment.chargeRemainingAfterDock,4);
assert.equal(result.attempt.holdSeconds,.75);
assert.equal(dock.advanceAttempt(result.attempt,sample(1.5)).dockingEvent,undefined,
 'Docking event should fire only once for the same attempt');
const stationary=sample(0,{ship:ship(0,1,0,3)});
assert.equal(dock.advanceAttempt(dock.beginAttempt({targetWorld:'home',stationId:'home:orbital-dock'}),stationary).docked,false,
 'High-speed pass through docking point must not latch');
const start=dock.beginAttempt({targetWorld:'home',stationId:'home:orbital-dock'});
assert.equal(dock.advanceAttempt(start,sample(0,{manualFlight:false})).docked,false,
 'A stable orbit with no manually piloted flight is not a dock');
assert.equal(dock.advanceAttempt(start,sample(0,{stationId:'different'})).ok,false);
const t0=dock.advanceAttempt(start,sample(0)).attempt;
assert.equal(dock.advanceAttempt(t0,sample(0)).ok,false,
 'Repeating the same tick must not advance the hold timer');
const far=dock.advanceAttempt(t0,sample(.25,{ship:ship(.25,40)})).attempt;
assert.equal(far.holdSeconds,0);
assert.equal(far.approachObserved,false);
const revisit=dock.advanceAttempt(far,sample(.5)).attempt;
assert.equal(revisit.holdSeconds,0,'Re-entering the corridor restarts the hold timer');
const bigStep=dock.advanceAttempt(t0,sample(100));
assert.equal(bigStep.docked,false,'Time skip does not instantly dock');
assert.equal(bigStep.attempt.holdSeconds,.25);
const closeNoSafe=dock.advanceAttempt(t0,sample(.25,{safeOrbit:false}));
assert.equal(closeNoSafe.docked,false);
assert.equal(closeNoSafe.attempt.holdSeconds,0);
// No ship module or power -> no assisted docking. Engine fuel cannot substitute.
assert.equal(dock.evaluateApproach(sample(1,{hardware:null})).eligible,false);
assert.ok(dock.evaluateApproach(sample(1,{hardware:null})).reason.includes('module'));
const emptyPower=ships.dockingHardware({...starter,powerUnits:0});
assert.equal(emptyPower.ok,false);
assert.equal(dock.evaluateApproach(sample(1,{hardware:{...basicHardware,charge:1}})).eligible,false);
assert.ok(dock.evaluateApproach(sample(1,{hardware:{...basicHardware,charge:1}})).reason.includes('charge'));
assert.equal(dock.evaluateApproach(sample(1,{hardware:{...basicHardware,charge:2}})).eligible,true);
assert.equal(dock.evaluateApproach(sample(1,{hardware:{...basicHardware,cost:0}})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{hardware:{...basicHardware,moduleId:'unavailable'}})).eligible,false);
const pureShip=ships.evaluateDesign(starter).stats;
let dockAttempt=dock.beginAttempt({targetWorld:'home',stationId:'home:orbital-dock'});
for(const time of [0,.25,.5,.75]) {
 const tick=dock.advanceAttempt(dockAttempt,sample(time,{hardware:{...basicHardware,charge:2}}));
 dockAttempt=tick.attempt;
 if(time===.75) {
  assert.equal(tick.docked,true);
  assert.equal(tick.dockingEvent.electricalEnergyCost,2);
 }
}
assert.equal(ships.evaluateDesign(starter).stats.fuelLoaded,pureShip.fuelLoaded);
assert.equal(starter.powerUnits,6,'Docking event cannot mutate the ship design');
const precision=ships.dockingHardware({...starter,docking:'precision-docking-port'},
 {technology:['precision-docking']});
assert.equal(precision.ok,true);
assert.equal(precision.cost,1);
const nearby=sample(1,{ship:ship(1,3,0,0,0),hardware:precision});
assert.equal(dock.evaluateApproach(nearby).eligible,true,
 'Precision docking hardware has a larger final capture radius');
assert.equal(dock.evaluateApproach(sample(1,{ship:ship(1,3)})).eligible,false);
assert.equal(dock.evaluateApproach(sample(1,{hardware:{...precision,charge:1}})).eligible,true);
assert.equal(Object.keys(dock.DEFAULT_LIMITS).length,5);
console.log('Manual approach / assisted docking regression tests passed.');
