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
 // Home dock begins operational, but only with basic receiving/storage.
 // Upgrade material requirements are PROVISIONAL raw-material placeholders:
 // refined/processed component recipes will replace these after chemistry design.
 const HOME_FACILITIES=Object.freeze({
  'fuel-depot':Object.freeze({id:'fuel-depot',name:'Orbital Fuel Depot',
   research:'orbital-fuel-handling',cost:Object.freeze({iron:12,silicon:4}),
   description:'Adds fuel holding and refueling services to the Home dock',
   addsCapacity:60,capabilities:Object.freeze(['fuel-storage','fuel-transfer'])}),
  'shipyard':Object.freeze({id:'shipyard',name:'Orbital Assembly Yard',
   research:'orbital-assembly',cost:Object.freeze({iron:18,copper:10,silicon:6}),
   description:'Adds spacecraft component assembly and service berths',
   addsCapacity:100,capabilities:Object.freeze(['orbital-shipbuilding'])}),
  'research-lab':Object.freeze({id:'research-lab',name:'Orbital Research Laboratory',
   research:'orbital-research',cost:Object.freeze({copper:12,silicon:12}),
   description:'Adds an orbital experiments laboratory linked to Home research',
   addsCapacity:40,capabilities:Object.freeze(['orbital-research'])})
 });
 const HOME_DOCK_INITIAL_CAPACITY=80;
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
   homeHub:emptyStock(),homeDock:{facilities:[]},provenRoutes:Object.create(null)};
 }
 function homeDockSummary(cargo){
  const valid=new Set(Array.isArray(cargo?.homeDock?.facilities)?
   cargo.homeDock.facilities.filter(k=>Object.hasOwn(HOME_FACILITIES,k)):[]);
  const capabilities=['cargo-receiving','basic-docking'];
  let storageCapacity=HOME_DOCK_INITIAL_CAPACITY;
  for(const id of Object.keys(HOME_FACILITIES))if(valid.has(id)){
   storageCapacity+=HOME_FACILITIES[id].addsCapacity;
   capabilities.push(...HOME_FACILITIES[id].capabilities);
  }
  return {operational:true,name:'Home Orbital Dock',starter:true,
   capacity:storageCapacity,facilities:[...valid],capabilities,
   upgrades:Object.keys(HOME_FACILITIES).filter(id=>!valid.has(id))};
 }
 function homeDockUpgradeCheck(cargo,id,technology=[]){
  const facility=HOME_FACILITIES[id];
  if(!facility)return {ok:false,reason:'Unknown Home dock facility'};
  if(homeDockSummary(cargo).facilities.includes(id))
   return {ok:false,reason:'Already installed',facility:id};
  if(!Array.isArray(technology)||!technology.includes(facility.research))
   return {ok:false,reason:'Research required',research:facility.research,facility:id};
  const inventory=safeStock(cargo?.stationHold?.home);
  const missing=Object.fromEntries(Object.entries(facility.cost)
   .filter(([resource,units])=>(inventory[resource]||0)+1e-9<units)
   .map(([resource,units])=>[resource,Math.max(0,units-(inventory[resource]||0))]));
  return Object.keys(missing).length?
   {ok:false,reason:'Deliver required materials to Home orbital dock',facility:id,missing,cost:{...facility.cost}}:
   {ok:true,facility:id,cost:{...facility.cost}};
 }
 function upgradeHomeDock(cargo,id,technology=[]){
  const check=homeDockUpgradeCheck(cargo,id,technology);
  if(!check.ok)return {ok:false,reason:check.reason,check};
  const state=loadCargoState(cargo);
  for(const [resource,units] of Object.entries(HOME_FACILITIES[id].cost)){
   const remaining=state.stationHold.home[resource]-units;
   state.stationHold.home[resource]=remaining>1e-9?remaining:0;
  }
  state.homeDock.facilities.push(id);
  return {ok:true,state,facility:id,summary:homeDockSummary(state)};
 }
 function loadCargoState(raw){
  const state=newCargoState();
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return state;
  const holds=raw.stationHold&&typeof raw.stationHold==='object'?raw.stationHold:{};
  for(const world of WORLDS)state.stationHold[world]=safeStock(holds[world]);
  state.homeHub=safeStock(raw.homeHub);
  // Facility completion is stored only when the prototype's explicit upgrade
  // action has completed; we sanitize unknown IDs and repeated entries.
  state.homeDock.facilities=[...new Set(Array.isArray(raw.homeDock?.facilities)?
    raw.homeDock.facilities.filter(id=>typeof id==='string'&&Object.hasOwn(HOME_FACILITIES,id)):[])];
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
  // Home's receiving dock is free from the first mission. Planetary stations
  // still require three successful construction deliveries.
  const ready=new Set(Array.isArray(readyStations)?readyStations:[]);
  ready.add('home');
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
  HOME_FACILITIES,HOME_DOCK_INITIAL_CAPACITY,newCargoState,loadCargoState,getNodeInventory,classifyLeg,checkCargoPlan,
  homeDockSummary,homeDockUpgradeCheck,upgradeHomeDock});
});
