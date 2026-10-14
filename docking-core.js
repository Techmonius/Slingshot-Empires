/* Slingshot Empires — manual approach / assisted final docking, v0.16 groundwork.
 * Data-only pure model: not integrated into current flight UI and NEVER moves
 * inventory, changes rocket velocity, or proves a route.
 * CommonJS in Node and global SlingshotDocking in browsers.
 */
(function(root,build){
 const api=build();
 if(typeof module==='object'&&module&&module.exports)module.exports=api;
 else root.SlingshotDocking=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MODEL_VERSION=1;
 // Gameplay-balance placeholders in existing simulation distance/time units.
 const DEFAULT_LIMITS=Object.freeze({
  approachRadius:12,
  assistRadius:2.5,
  maxRelativeSpeed:.75,
  stableSeconds:.75,
  maxStepSeconds:.25
 });
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 function limits(raw={}){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const out={...DEFAULT_LIMITS,...raw};
  if(!Object.values(out).every(x=>finite(x)&&x>0)||
    out.assistRadius>=out.approachRadius||out.maxStepSeconds>out.stableSeconds)return null;
  return out;
 }
 function vectorState(s){
  return !!s&&typeof s==='object'&&['x','y','vx','vy','t'].every(k=>finite(s[k]));
 }
 function evaluateApproach({ship,station,manualFlight=false,safeOrbit=false,
  dockOperational=false,targetWorld,stationWorld,config}={}){
  const rules=limits(config);
  if(!rules)return {eligible:false,reason:'Invalid docking thresholds'};
  if(!vectorState(ship)||!vectorState(station))
   return {eligible:false,reason:'Missing or invalid spacecraft/station state'};
  if(Math.abs(ship.t-station.t)>1e-6)
   return {eligible:false,reason:'Ship and station must be evaluated at the same simulation time'};
  const dx=ship.x-station.x,dy=ship.y-station.y;
  const dvx=ship.vx-station.vx,dvy=ship.vy-station.vy;
  const separation=Math.hypot(dx,dy),relativeSpeed=Math.hypot(dvx,dvy);
  const approachActive=separation<=rules.approachRadius;
  const inAssistZone=separation<=rules.assistRadius;
  const ready=manualFlight===true&&safeOrbit===true&&dockOperational===true&&
   typeof targetWorld==='string'&&targetWorld.length>0&&targetWorld===stationWorld;
  const withinSpeed=relativeSpeed<=rules.maxRelativeSpeed;
  let reason='Final docking assist available';
  if(!dockOperational)reason='Orbital dock is unavailable';
  else if(!manualFlight)reason='Manually pilot the cargo flight and approach';
  else if(!safeOrbit)reason='Establish a safe bound orbit first';
  else if(!targetWorld||targetWorld!==stationWorld)reason='Approach the selected destination station';
  else if(!approachActive)reason='Navigate toward the station';
  else if(!inAssistZone)reason='Approach closer to engage docking assistance';
  else if(!withinSpeed)reason='Reduce velocity relative to the station';
  return {eligible:ready&&inAssistZone&&withinSpeed,reason,
   separation,relativeSpeed,approachActive,inAssistZone,withinSpeed,
   limits:rules};
 }
 function beginAttempt({targetWorld,stationId}={}){
  if(typeof targetWorld!=='string'||!targetWorld||
   typeof stationId!=='string'||!stationId)return null;
  return {targetWorld,stationId,approachObserved:false,holdSeconds:0,lastT:null,
   docked:false};
 }
 // Input snapshots must come from the actual manually controlled simulation.
 // The approach is observed in the outer corridor; final lock requires sustained
 // low relative speed while close. No instantaneous "orbit captured => dock".
 function advanceAttempt(attempt,input){
  if(!attempt||typeof attempt!=='object'||!attempt.targetWorld||!attempt.stationId)
   return {ok:false,reason:'No active docking attempt'};
  if(attempt.docked)return {ok:true,attempt:{...attempt},docked:true,
   reason:'Already docked'};
  if(!input||input.stationId!==attempt.stationId||
   input.targetWorld!==attempt.targetWorld)
   return {ok:false,reason:'Docking target changed'};
  const status=evaluateApproach(input),t=input.ship?.t;
  if(!finite(t)||!finite(input.station?.t))
   return {ok:false,reason:status.reason,assessment:status};
  if(attempt.lastT!==null&&(!finite(attempt.lastT)||t<=attempt.lastT))
   return {ok:false,reason:'Docking snapshots must advance in simulation time',assessment:status};
  const observed=attempt.approachObserved||(
   status.approachActive&&input.manualFlight===true&&
   input.safeOrbit===true&&input.dockOperational===true);
  // A new approach must be actively observed. Leaving the corridor resets
  // the timing; clipping the target at speed earns no docking reward.
  const contact=observed&&status.eligible;
  const elapsed=attempt.lastT===null?0:Math.min(
    status.limits.maxStepSeconds,Math.max(0,t-attempt.lastT));
  const holdSeconds=contact?attempt.holdSeconds+elapsed:0;
  const docked=contact&&holdSeconds+1e-9>=status.limits.stableSeconds;
  const next={targetWorld:attempt.targetWorld,stationId:attempt.stationId,
   approachObserved:status.approachActive&&observed,
   holdSeconds:docked?status.limits.stableSeconds:holdSeconds,lastT:t,docked};
  return {ok:true,attempt:next,docked,assessment:status,
   reason:docked?'Assist completed final docking':contact?'Holding low relative speed for assist':status.reason,
   // This signal must be verified against the active piloted mission, and
   // processed ONCE by a future inventory/unloading transaction.
   dockingEvent:docked?{targetWorld:next.targetWorld,stationId:next.stationId,time:t}:null};
 }
 return Object.freeze({MODEL_VERSION,DEFAULT_LIMITS,evaluateApproach,beginAttempt,advanceAttempt});
});
