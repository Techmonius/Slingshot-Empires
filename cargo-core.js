/* Slingshot Empires — cargo architecture groundwork for v0.16.
 * The app has not wired a cargo rocket into flight physics yet.
 * Pure model only: NO automatic movements or route completion.
 * CommonJS in Node; global SlingshotCargo in a browser.
 */
(function(root,build){
 const model=build();
 if(typeof module==='object'&&module&&module.exports)module.exports=model;
 else root.SlingshotCargo=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SCHEMA_VERSION=1;
 const WORLDS=Object.freeze(['home','aurora','cinder']);
 const RESOURCES=Object.freeze(['ice','silicon','helium3','iron','copper','sulfur']);
 const MAX_UNITS=1000000000;
 const LOCATIONS=Object.freeze(WORLDS.flatMap(world=>[
  Object.freeze({id:world+':surface',world,kind:'surface'}),
  Object.freeze({id:world+':orbit',world,kind:'orbit'})
 ]));
 const KNOWN_NODES=new Map(LOCATIONS.map(n=>[n.id,n]));
 const KNOWN_RESOURCES=new Set(RESOURCES);
 const emptyStock=()=>Object.create(null);
 const safeStock=raw=>{
  const result=emptyStock();
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
  for(const key of RESOURCES){
   const value=raw[key];
   if(typeof value==='number'&&Number.isFinite(value)&&value>=0)
    result[key]=Math.min(MAX_UNITS,value);
  }
  return result;
 };
 // Surface resources are owned by mines[id].stock in v0.15, not copied here.
 // Home surface is the future research hub; Aurora/Cinder surfaces read mines.
 function newCargoState(){
  return {schema:SCHEMA_VERSION,stationHold:{home:emptyStock(),aurora:emptyStock(),cinder:emptyStock()},
   homeHub:emptyStock(),provenRoutes:Object.create(null)};
 }
 function loadCargoState(raw){
  const state=newCargoState();
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return state;
  const holds=raw.stationHold&&typeof raw.stationHold==='object'?raw.stationHold:{};
  for(const world of WORLDS)state.stationHold[world]=safeStock(holds[world]);
  state.homeHub=safeStock(raw.homeHub);
  // No saved route is trusted as "proven" until a real cargo-flight
  // receipt validation/recording mechanic has been built and tested.
  return state;
 }
 function getNodeInventory(nodeId,mines,cargo){
  const node=KNOWN_NODES.get(nodeId);if(!node)return null;
  if(node.kind==='orbit')return safeStock(cargo?.stationHold?.[node.world]);
  if(node.world==='home')return safeStock(cargo?.homeHub);
  return safeStock(mines?.[node.world]?.stock);
 }
 // Routing has three deliberately distinct manual legs. A new direct
 // surface-to-surface leg will unlock from future spacecraft technology.
 function classifyLeg(fromId,toId,{directDeliveryUnlocked=false}={}){
  const a=KNOWN_NODES.get(fromId),b=KNOWN_NODES.get(toId);
  if(!a||!b||a.id===b.id)return {ok:false,reason:'Invalid or identical locations'};
  if(a.kind==='surface'&&b.kind==='orbit'&&a.world===b.world)
   return {ok:true,kind:'ascent',from:a,to:b};
  if(a.kind==='orbit'&&b.kind==='surface'&&a.world===b.world)
   return {ok:true,kind:'descent',from:a,to:b};
  if(a.kind==='orbit'&&b.kind==='orbit'&&a.world!==b.world)
   return {ok:true,kind:'interplanetary',from:a,to:b};
  if(a.kind==='surface'&&b.kind==='surface'&&a.world!==b.world)
   return directDeliveryUnlocked?{ok:true,kind:'direct-delivery',from:a,to:b}
    :{ok:false,reason:'Direct surface delivery technology is locked'};
  return {ok:false,reason:'Shipment must pass through orbital stations'};
 }
 const totalUnits=manifest=>Object.values(manifest).reduce((total,amount)=>total+amount,0);
 function checkCargoPlan({fromId,toId,manifest,sourceInventory,maxPayload,readyStations=[],directDeliveryUnlocked=false}={}){
  const leg=classifyLeg(fromId,toId,{directDeliveryUnlocked});
  if(!leg.ok)return leg;
  const ready=new Set(Array.isArray(readyStations)?readyStations:[]);
  if([leg.from,leg.to].some(n=>n.kind==='orbit'&&!ready.has(n.world)))
   return {ok:false,reason:'A commissioned orbital station is required'};
  if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))
   return {ok:false,reason:'Select a cargo manifest'};
  const keys=Object.keys(manifest);
  if(!keys.length||keys.some(k=>!KNOWN_RESOURCES.has(k)||
     typeof manifest[k]!=='number'||!Number.isFinite(manifest[k])||
     manifest[k]<=0||manifest[k]>MAX_UNITS))
   return {ok:false,reason:'Cargo manifest contains invalid resource quantities'};
  const units=totalUnits(manifest);
  if(!Number.isFinite(maxPayload)||maxPayload<=0)
   return {ok:false,reason:'Rocket payload capacity is not configured'};
  if(units>maxPayload+1e-9)return {ok:false,reason:'Cargo exceeds rocket payload capacity'};
  const stock=safeStock(sourceInventory);
  if(keys.some(k=>manifest[k]> (stock[k]||0)+1e-9))
   return {ok:false,reason:'Insufficient stock at the departure location'};
  // Validates a candidate; never debits inventory and never establishes a route.
  return {ok:true,kind:leg.kind,fromId,toId,units,manifest:{...manifest}};
 }
 return Object.freeze({SCHEMA_VERSION,WORLDS,RESOURCES,LOCATIONS,
  newCargoState,loadCargoState,getNodeInventory,classifyLeg,checkCargoPlan});
});
