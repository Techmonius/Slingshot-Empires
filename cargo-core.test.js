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

// Confirmed: Home begins with a usable but expandable orbital dock.
const starter=cargo.homeDockSummary(state);
assert.equal(starter.operational,true);
assert.equal(starter.starter,true);
assert.equal(starter.capacity,80);
assert.deepEqual(starter.facilities,[]);
assert.ok(starter.capabilities.includes('cargo-receiving'));
assert.equal(starter.capabilities.includes('orbital-shipbuilding'),false);
const homeTransfer={fromId:'home:orbit',toId:'aurora:orbit',
 readyStations:['aurora'],manifest:{iron:2},sourceInventory:{iron:2},maxPayload:5};
assert.equal(cargo.checkCargoPlan(homeTransfer).ok,true,
 'Home dock must work with no three-delivery Home station requirement');
assert.equal(cargo.checkCargoPlan({...homeTransfer,readyStations:[]}).ok,false,
 'Unbuilt Aurora station must stay locked');
assert.equal(cargo.canReceiveHomeCargo(state,{iron:75}).ok,true);
assert.equal(cargo.canReceiveHomeCargo(state,{iron:81}).ok,false);
assert.equal(cargo.canReceiveHomeCargo(state,{ice:0}).ok,false);
const funded=cargo.newCargoState();
funded.stationHold.home={iron:40,silicon:30,copper:25};
assert.equal(cargo.homeDockUpgradeCheck(funded,'fuel-depot',[]).ok,false,
 'Research must be required');
assert.equal(cargo.homeDockUpgradeCheck(state,'fuel-depot',['orbital-fuel-handling']).ok,false,
 'Research alone cannot fabricate from nothing');
const before=JSON.stringify(funded);
const upgraded=cargo.upgradeHomeDock(funded,'fuel-depot',['orbital-fuel-handling']);
assert.equal(upgraded.ok,true);
assert.equal(upgraded.state.stationHold.home.iron,28);
assert.equal(upgraded.state.stationHold.home.silicon,26);
assert.equal(upgraded.summary.capacity,140);
assert.ok(upgraded.summary.capabilities.includes('fuel-storage'));
assert.equal(upgraded.summary.capabilities.includes('orbital-shipbuilding'),false);
assert.equal(JSON.stringify(funded),before,'Upgrade action must not mutate caller-owned state');
assert.equal(cargo.upgradeHomeDock(upgraded.state,'fuel-depot',['orbital-fuel-handling']).ok,false);
assert.equal(cargo.upgradeHomeDock(funded,'shipyard',['orbital-fuel-handling']).ok,false,
 'A depot research unlock does not grant a shipyard');
assert.equal(cargo.homeDockStorage(upgraded.state).occupied,79);
assert.equal(cargo.homeDockStorage(upgraded.state).available,61);
assert.equal(cargo.canReceiveHomeCargo(upgraded.state,{ice:60}).ok,true);
assert.equal(cargo.canReceiveHomeCargo(upgraded.state,{ice:62}).ok,false);
assert.equal(cargo.canReceiveHomeCargo(upgraded.state,{unknown:1}).ok,false);
const oldSave=cargo.loadCargoState({stationHold:{home:{iron:11}},homeHub:{copper:3}});
assert.equal(cargo.homeDockSummary(oldSave).operational,true);
assert.equal(cargo.homeDockSummary(oldSave).facilities.length,0);
assert.equal(oldSave.stationHold.home.iron,11);
assert.equal(oldSave.homeHub.copper,3);
const corrupted=cargo.loadCargoState({homeDock:{facilities:['fuel-depot','fuel-depot','unknown','shipyard']}});
assert.deepEqual(corrupted.homeDock.facilities,['fuel-depot','shipyard']);
assert.equal(cargo.homeDockSummary(corrupted).capacity,240);
assert.equal(Object.keys(upgraded.state.provenRoutes).length,0,
 'Facility construction must not fabricate a proven cargo route');
console.log('Cargo architecture tests passed.');
