/* Slingshot Empires — modular spacecraft design model, v0.16 development.
 * Pure, UI-agnostic computations. Not connected to v0.15 flight physics yet.
 * All numbers are provisional gameplay balance values in simulation units.
 * CommonJS in Node; global SlingshotShips in a browser.
 */
(function(root,make){
 const api=make();
 if(typeof module==='object'&&module&&module.exports)module.exports=api;
 else root.SlingshotShips=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SCHEMA_VERSION=1;
 const MATERIAL_MASS=Object.freeze({ice:1,silicon:1,helium3:.25,iron:1.2,copper:1.1,sulfur:.8});
 // Part IDs are stable save/recipe keys; display and assembly UI can change later.
 const PARTS=Object.freeze({
  'starter-frame':Object.freeze({type:'frame',name:'Courier Frame',dryMass:3.5,tankMounts:2,bayMounts:1,maxCargoMass:12}),
  'cargo-frame':Object.freeze({type:'frame',name:'Freighter Frame',dryMass:6,tankMounts:4,bayMounts:3,maxCargoMass:45,requires:'expanded-shipbuilding'}),
  'chemical-engine':Object.freeze({type:'engine',name:'Chemical Engine',dryMass:2.5,exhaustVelocity:38,thrust:22}),
  'vacuum-engine':Object.freeze({type:'engine',name:'Vacuum Engine',dryMass:1.7,exhaustVelocity:65,thrust:6,requires:'vacuum-propulsion'}),
  'compact-tank':Object.freeze({type:'tank',name:'Compact Tank',dryMass:.5,fuelCapacity:3}),
  'standard-tank':Object.freeze({type:'tank',name:'Standard Tank',dryMass:1,fuelCapacity:7}),
  'large-tank':Object.freeze({type:'tank',name:'Large Tank',dryMass:2.2,fuelCapacity:17,requires:'cryogenic-tankage'}),
  'cargo-pod':Object.freeze({type:'bay',name:'Cargo Pod',dryMass:1.2,cargoCapacity:12}),
  'bulk-container':Object.freeze({type:'bay',name:'Bulk Container',dryMass:2.5,cargoCapacity:30,requires:'expanded-shipbuilding'})
 });
 const ids=Object.keys(PARTS);
 const fin=v=>typeof v==='number'&&Number.isFinite(v);
 const starterDesign=()=>({frame:'starter-frame',engine:'chemical-engine',
  tanks:['standard-tank'],bays:['cargo-pod'],fuelUnits:7,payload:{}});
 // Mount position only affects non-flight operational efficiency. It is NOT
 // used in delta-v, thrust, acceleration, drag, steering, or trajectory math.
 // Slot zero is nearest the nose; the highest index is nearest the engine.
 const POSITION_PREFERENCES=Object.freeze({
  'compact-tank':Object.freeze({ideal:0,benefit:'Thermal protection',reason:'Forward mounting keeps a compact tank away from engine heat'}),
  'standard-tank':Object.freeze({ideal:1,benefit:'Fuel servicing',reason:'Aft mounting shortens the service manifold for standard tanks'}),
  'large-tank':Object.freeze({ideal:.5,benefit:'Access and insulation',reason:'Central mounting balances external servicing and thermal protection'}),
  'cargo-pod':Object.freeze({ideal:0,benefit:'Cargo handling',reason:'Forward docking access speeds light-cargo transfers'}),
  'bulk-container':Object.freeze({ideal:1,benefit:'Cargo handling',reason:'Aft handling access suits heavy containers'})
 });
 const mountPosition=(index,count)=>count<=1?.5:index/(count-1);
 const slotLabel=(position)=>position<=.15?'FORWARD':position>=.85?'AFT':'MIDSHIP';
 const mountScore=(position,ideal)=>Math.round((112-24*Math.abs(position-ideal))*10)/10;
 function evaluateLayout(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,reason:'No spacecraft layout'};
  const frame=PARTS[input.frame];
  if(!frame||frame.type!=='frame')return {ok:false,reason:'Invalid frame'};
  const slots={},groups={tank:[],bay:[]};
  for(const [kind,list,mounts] of [['tank',input.tanks,frame.tankMounts],['bay',input.bays,frame.bayMounts]]){
   if(!Array.isArray(list)||list.length>mounts)return {ok:false,reason:'Invalid '+kind+' sockets'};
   for(let index=0;index<mounts;index++){
    const partId=list[index];
    if(partId===null||partId===undefined)continue;
    const part=PARTS[partId],profile=POSITION_PREFERENCES[partId];
    if(!part||part.type!==kind||!profile)return {ok:false,reason:'Invalid '+kind+' module'};
    const position=mountPosition(index,mounts);
    const percent=mountScore(position,profile.ideal);
    const key=kind+':'+index;
    const data={slot:key,part:partId,percent,position:slotLabel(position),
      bestPosition:slotLabel(profile.ideal),benefit:profile.benefit,reason:profile.reason};
    slots[key]=data;
    groups[kind].push({percent,weight:kind==='tank'?part.fuelCapacity:part.cargoCapacity});
   }
  }
  function groupAverage(items){
   if(!items.length)return null;
   const denominator=items.reduce((n,p)=>n+p.weight,0);
   return Math.round(items.reduce((n,p)=>n+p.percent*p.weight,0)/denominator*10)/10;
  }
  const fuelHandling=groupAverage(groups.tank),cargoHandling=groupAverage(groups.bay);
  const active=[fuelHandling,cargoHandling].filter(x=>x!==null);
  return {ok:true,fuelHandling,cargoHandling,
   overall:active.length?Math.round(active.reduce((a,b)=>a+b,0)/active.length*10)/10:null,
   slots,notes:'Placement affects ground and station servicing only; no impact on flight physics'};
 }
 const distinctErrors=xs=>[...new Set(xs)];
 function evaluateDesign(input,{technology=[]}={}){
  const issues=[];
  if(!input||typeof input!=='object'||Array.isArray(input))
   return {ok:false,issues:['Design is missing'],stats:null};
  const unlocked=new Set(Array.isArray(technology)?technology:[]);
  const moduleById=(id,type)=>{
   const part=PARTS[id];
   if(!part||part.type!==type){issues.push('Unknown '+type+' module: '+String(id));return null;}
   if(part.requires&&!unlocked.has(part.requires))issues.push(part.name+' requires '+part.requires);
   return part;
  };
  const frame=moduleById(input.frame,'frame'),engine=moduleById(input.engine,'engine');
  const tanks=Array.isArray(input.tanks)?input.tanks.map(x=>moduleById(x,'tank')):[];
  const bays=Array.isArray(input.bays)?input.bays.map(x=>moduleById(x,'bay')):[];
  if(!Array.isArray(input.tanks)||!tanks.length)issues.push('At least one fuel tank is required');
  if(!Array.isArray(input.bays))issues.push('Cargo bays must be a list');
  if(frame&&tanks.length>frame.tankMounts)issues.push('Too many tanks for frame');
  if(frame&&bays.length>frame.bayMounts)issues.push('Too many cargo bays for frame');
  const capacity=tanks.reduce((n,p)=>n+(p?.fuelCapacity||0),0);
  const cargoCapacity=bays.reduce((n,p)=>n+(p?.cargoCapacity||0),0);
  const fuel=input.fuelUnits;
  if(!fin(fuel)||fuel<0||fuel>capacity)issues.push('Fuel load is outside installed tank capacity');
  const payload=input.payload;
  if(!payload||typeof payload!=='object'||Array.isArray(payload))issues.push('Payload must be a manifest');
  let units=0,payloadMass=0;
  if(payload&&typeof payload==='object'&&!Array.isArray(payload)){
   for(const [name,quantity] of Object.entries(payload)){
    if(!Object.hasOwn(MATERIAL_MASS,name)||!fin(quantity)||quantity<=0||quantity>1000000){
     issues.push('Invalid cargo resource or quantity: '+name);continue;
    }
    units+=quantity;payloadMass+=quantity*MATERIAL_MASS[name];
   }
  }
  if(units>cargoCapacity+1e-9)issues.push('Cargo units exceed bay capacity');
  if(frame&&payloadMass>frame.maxCargoMass+1e-9)issues.push('Cargo mass exceeds frame limit');
  const dryMass=(frame?.dryMass||0)+(engine?.dryMass||0)+
   tanks.reduce((n,p)=>n+(p?.dryMass||0),0)+
   bays.reduce((n,p)=>n+(p?.dryMass||0),0)+payloadMass;
  const fuelMass=fin(fuel)&&fuel>=0?fuel:0;
  if(!fin(dryMass)||dryMass<=0)issues.push('Mass calculation invalid');
  if(issues.length)return {ok:false,issues:distinctErrors(issues),stats:null};
  const wetMass=dryMass+fuelMass;
  const deltaV=engine.exhaustVelocity*Math.log(wetMass/dryMass);
  return {ok:true,issues:[],stats:{
    dryMass,wetMass,payloadMass,cargoUnits:units,cargoCapacity,maxCargoMass:frame.maxCargoMass,
    fuelCapacity:capacity,fuelLoaded:fuelMass,deltaV,
    thrust:engine.thrust,initialAcceleration:engine.thrust/wetMass,
    exhaustVelocity:engine.exhaustVelocity,
    frames:1,engines:1,tankCount:tanks.length,bayCount:bays.length
   }};
 }
 // Manual burns consume propellant using Tsiolkovsky's rocket equation.
 // No burns, docking, or staging occur inside this calculation.
 function previewBurn(stats,remainingFuel,requestDeltaV){
  if(!stats||!fin(stats.dryMass)||stats.dryMass<=0||
     !fin(stats.exhaustVelocity)||stats.exhaustVelocity<=0||
     !fin(remainingFuel)||remainingFuel<0||remainingFuel>stats.fuelCapacity||
     !fin(requestDeltaV)||requestDeltaV<0)
   return {ok:false,reason:'Invalid burn inputs'};
  const wetMass=stats.dryMass+remainingFuel;
  const available=stats.exhaustVelocity*Math.log(wetMass/stats.dryMass);
  if(requestDeltaV>available+1e-8)return {ok:false,reason:'Insufficient fuel for burn',availableDeltaV:available};
  const spent=requestDeltaV===0?0:wetMass*(1-Math.exp(-requestDeltaV/stats.exhaustVelocity));
  const remaining=Math.max(0,remainingFuel-spent);
  return {ok:true,spent,remainingFuel:remaining,availableDeltaV:available,
   remainingDeltaV:stats.exhaustVelocity*Math.log((stats.dryMass+remaining)/stats.dryMass)};
 }
 return Object.freeze({SCHEMA_VERSION,MATERIAL_MASS,PARTS,PART_IDS:Object.freeze(ids),
  starterDesign,evaluateDesign,evaluateLayout,POSITION_PREFERENCES,previewBurn});
});
