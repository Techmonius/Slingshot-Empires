'use strict';
// Run with: node cargo-core.test.js
const assert=require('node:assert/strict');
const cargo=require('./cargo-core.js');
const state=cargo.newCargoState();
const mines={aurora:{stock:{ice:31,silicon:10}},cinder:{stock:{iron:20,copper:8}}};
const plan={fromId:'aurora:surface',toId:'aurora:orbit',manifest:{ice:4,silicon:1},
 sourceInventory:mines.aurora.stock,maxPayload:10,readyStations:['aurora']};
assert.equal(cargo.LOCATIONS.length,6);
assert.equal(cargo.getNodeInventory('aurora:surface',mines,state).ice,31);
assert.equal(cargo.getNodeInventory('aurora:orbit',mines,state).ice,undefined);
assert.equal(cargo.getNodeInventory('home:surface',mines,state).ice,undefined);
assert.equal(cargo.classifyLeg('aurora:surface','aurora:orbit').kind,'ascent');
assert.equal(cargo.classifyLeg('aurora:orbit','cinder:orbit').kind,'interplanetary');
assert.equal(cargo.classifyLeg('cinder:orbit','cinder:surface').kind,'descent');
assert.equal(cargo.classifyLeg('aurora:surface','cinder:surface').ok,false);
assert.equal(cargo.classifyLeg('aurora:surface','cinder:surface',{directDeliveryUnlocked:true}).kind,'direct-delivery');
assert.equal(cargo.classifyLeg('aurora:surface','cinder:orbit').ok,false);
assert.equal(cargo.checkCargoPlan(plan).ok,true);
assert.equal(cargo.checkCargoPlan(plan).units,5);
assert.equal(cargo.checkCargoPlan({...plan,maxPayload:4}).ok,false);
assert.equal(cargo.checkCargoPlan({...plan,readyStations:[]}).ok,false);
assert.equal(cargo.checkCargoPlan({...plan,manifest:{ice:32}}).ok,false);
for(const invalid of [NaN,Infinity,-1,0])
 assert.equal(cargo.checkCargoPlan({...plan,manifest:{ice:invalid}}).ok,false);
assert.equal(cargo.checkCargoPlan({...plan,manifest:{unobtainium:1}}).ok,false);
assert.equal(mines.aurora.stock.ice,31,'Planning may not spend resources');
assert.equal(Object.keys(state.provenRoutes).length,0,'Planning may not prove routes');
const untrusted=cargo.loadCargoState({stationHold:{aurora:{ice:10,copper:-5,iron:Infinity,unknown:55}},
 provenRoutes:{'aurora:orbit>cinder:orbit':{completed:true}}});
assert.equal(untrusted.stationHold.aurora.ice,10);
assert.equal(untrusted.stationHold.aurora.copper,undefined);
assert.equal(untrusted.stationHold.aurora.unknown,undefined);
assert.equal(Object.keys(untrusted.provenRoutes).length,0);
console.log('Cargo architecture tests passed.');
