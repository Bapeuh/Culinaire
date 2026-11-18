export type Source = {id:string;ingredientId:string;name:string;quantity:number;unit:string;optional:boolean};
export type Input = {itemId:string;quantity:number};
export type Action = {id:string;type:string;inputs:Input[];outputs:{id:string;name:string}[];durationMinutes:number|null;temperatureC:number|null;details:string;equipment?:string};
export type Exit = {itemId:string;kind:"served"|"discarded";quantity:number};
export type RecipeGraph = {version:1;sources:Source[];actions:Action[];exits:Exit[]};
export type Item = {id:string;name:string;quantity:number;remaining:number;unit:string;origins:Record<string,number>;createdBy:string|null};
export type GraphReport = {items:Item[];issues:string[];warnings:string[];steps:{actionType:string;description:string;durationMinutes:number|null;temperatureC:number|null;equipment:string|null}[];served:string[]};
export const ACTIONS = [
 ["COUPER","🔪 Couper","split"],["EMINCER","🔪 Émincer","split"],["HACHER","🔪 Hacher","split"],
 ["MIXER","🌀 Mixer","merge"],["MELANGER","🥣 Mélanger","merge"],["FOUETTER","🥄 Fouetter","merge"],
 ["PETRIR","🍞 Pétrir","merge"],["CUIRE_POELE","🍳 Cuire à la poêle","merge"],
 ["CUIRE_FOUR","♨️ Cuire au four","merge"],["BOUILLIR","💧 Bouillir","merge"],
 ["MIJOTER","🍲 Mijoter","merge"],["ASSEMBLER","🧩 Assembler","merge"],
 ["DRESSER","✨ Dresser","merge"],["SERVIR","🍽️ Servir","merge"],
 ["REPOSER","⏳ Laisser reposer","split"],["REFROIDIR","❄️ Refroidir","split"],
 ["AUTRE","✍️ Autre action","split"]
] as const;
export function isSplit(type:string){return ACTIONS.find(a=>a[0]===type)?.[2]==="split"}
export function expectedOutputCount(action:Action){return isSplit(action.type)?action.inputs.length:action.inputs.length?1:0}
export const EQUIPMENT:Record<string,string[]>={
 COUPER:["Couteau de cuisine","Planche à découper","Mandoline"],EMINCER:["Couteau de cuisine","Planche à découper","Mandoline"],HACHER:["Couteau de cuisine","Hachoir","Robot multifonction"],MIXER:["Mixeur plongeant","Blender","Robot multifonction"],MELANGER:["Saladier","Cuillère","Spatule"],FOUETTER:["Fouet","Batteur électrique","Robot pâtissier"],PETRIR:["Mains","Robot pâtissier"],CUIRE_POELE:["Poêle","Sauteuse","Wok"],CUIRE_FOUR:["Four","Plat à four","Plaque de cuisson"],BOUILLIR:["Casserole","Marmite"],MIJOTER:["Cocotte","Casserole","Sauteuse"],ASSEMBLER:["Saladier","Plat"],DRESSER:["Assiette","Plat de service"],SERVIR:["Plat de service","Assiette"],REPOSER:["Saladier","Récipient"],REFROIDIR:["Réfrigérateur","Grille"],AUTRE:[]
};
export function defaultEquipment(type:string){return ["COUPER","EMINCER"].includes(type)?"Couteau de cuisine, Planche à découper":EQUIPMENT[type]?.[0]??""}
const round=(value:number)=>Math.round(value*1e6)/1e6;
const pretty=(value:number)=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:2}).format(value);
function allocate(origs:Record<string,number>, fraction:number){return Object.fromEntries(Object.entries(origs).map(([k,v])=>[k,round(v*fraction)]))}
function addComposition(target:Record<string,number>,source:Record<string,number>){for(const [id,q] of Object.entries(source))target[id]=round((target[id]??0)+q)}
export function describeAction(action:Action,inputs:Item[],outputs:Item[]):string{
 const name=ACTIONS.find(a=>a[0]===action.type)?.[1].replace(/^\S+\s/,"")??"Préparer";
 const object=inputs.map((x,i)=>`${pretty(action.inputs[i].quantity)} ${x.unit} de ${x.name}`).join(", ");
 const time=action.durationMinutes?` pendant ${action.durationMinutes} min`:"";
 const temp=action.temperatureC?` à ${action.temperatureC} °C`:"";
 const equipment=action.equipment?` avec ${action.equipment}`:"";
 const result=outputs.length?` → ${outputs.map(x=>x.name).join(" et ")}`:"";
 return `${name} ${object}${equipment}${time}${temp}.${result}${action.details?` ${action.details}`:""}`;
}
export function evaluateGraph(graph:RecipeGraph):GraphReport{
 const issues:string[]=[],warnings:string[]=[],steps:GraphReport["steps"]=[],items=new Map<string,Item>();
 const sourceIds=new Set<string>(), seenActions=new Set<string>();
 for(const src of graph.sources){
  if(sourceIds.has(src.id)||items.has(src.id)){issues.push("Identifiant d'ingrédient dupliqué.");continue}
  sourceIds.add(src.id);
  if(!(src.quantity>0)||!Number.isFinite(src.quantity)||!src.unit||!src.name||!src.ingredientId){issues.push(`Ingrédient invalide : ${src.name||"sans nom"}`);continue}
  items.set(src.id,{id:src.id,name:src.name,quantity:src.quantity,remaining:src.quantity,unit:src.unit,createdBy:null,origins:{[src.id]:src.quantity}});
 }
 for(const [index,action] of graph.actions.entries()){
  if(seenActions.has(action.id)){issues.push("Identifiant d'action dupliqué.");continue}
  seenActions.add(action.id);
  if(!ACTIONS.some(a=>a[0]===action.type)){issues.push(`Étape ${index+1} : action inconnue.`);continue}
  if(!action.inputs.length){issues.push(`Étape ${index+1} : choisissez au moins un élément.`);continue}
  const selected:Item[]=[],compositions:Record<string,number>[]=[];
  let valid=true;const used=new Map<string,number>();
  for(const input of action.inputs){
   const item=items.get(input.itemId);
   if(!item||!Number.isFinite(input.quantity)||input.quantity<=0){issues.push(`Étape ${index+1} : ingrédient manquant ou quantité invalide.`);valid=false;continue}
   const total=(used.get(input.itemId)??0)+input.quantity;
   used.set(input.itemId,total);
   if(total>item.remaining+1e-6){issues.push(`Étape ${index+1} : pas assez de « ${item.name} » (${pretty(item.remaining)} ${item.unit} disponibles).`);valid=false}
   selected.push(item);compositions.push(allocate(item.origins,input.quantity/item.quantity));
  }
  const n=expectedOutputCount(action);
  if(action.outputs.length!==n||action.outputs.some(o=>!o.id||!o.name.trim())){issues.push(`Étape ${index+1} : ${n} résultat(s) attendu(s), tous nommés.`);valid=false}
  if(!valid)continue;
  for(const [id,q] of used)items.get(id)!.remaining=round(items.get(id)!.remaining-q);
  const created:Item[]=[];
  for(let o=0;o<n;o++){
   const out=action.outputs[o];
   if(items.has(out.id)){issues.push(`Étape ${index+1} : identifiant de résultat dupliqué.`);continue}
   const origins:Record<string,number>={};
   if(isSplit(action.type))addComposition(origins,compositions[o]);
   else compositions.forEach(c=>addComposition(origins,c));
   const qty=isSplit(action.type)?action.inputs[o].quantity:1;
   const unit=isSplit(action.type)?selected[o].unit:"préparation";
   const result={id:out.id,name:out.name,quantity:qty,remaining:qty,unit,origins,createdBy:action.id};
   items.set(out.id,result);created.push(result);
  }
  steps.push({actionType:action.type,description:describeAction(action,selected,created),durationMinutes:action.durationMinutes,temperatureC:action.temperatureC,equipment:action.equipment??null});
 }
 const served:string[]=[];const retired=new Map<string,number>();
 const servedSources=new Set<string>();
 for(const exit of graph.exits){
  const item=items.get(exit.itemId);
  if(!item){issues.push("Un élément final n'existe plus.");continue}
  if(!(exit.quantity>0)||!Number.isFinite(exit.quantity)){issues.push(`Quantité de sortie invalide pour ${item.name}.`);continue}
  const total=(retired.get(exit.itemId)??0)+exit.quantity;retired.set(exit.itemId,total);
  if(total>item.remaining+1e-6){issues.push(`Sortie de ${item.name} supérieure à la quantité disponible.`);continue}
  if(exit.kind==="served"){served.push(item.name);Object.keys(item.origins).forEach(id=>servedSources.add(id))}
 }
 for(const [id,q] of retired){const item=items.get(id)!;item.remaining=round(item.remaining-q)}
 for(const source of graph.sources){
  const s=items.get(source.id);if(!s)continue;
  if(s.remaining>1e-6)warnings.push(`Ingrédient non entièrement utilisé : ${source.name} (${pretty(s.remaining)} ${s.unit}).`);
  if(!servedSources.has(source.id))warnings.push(`${source.name} n'apparaît dans aucun plat servi.`);
 }
 for(const item of items.values())if(item.createdBy&&item.remaining>1e-6)warnings.push(`Préparation sans destination : ${item.name} (${pretty(item.remaining)} ${item.unit}).`);
 if(!served.length)warnings.push("Indiquez au moins un élément servi en fin de recette.");
 return {items:[...items.values()],issues,warnings,steps,served};
}
export function blankGraph():RecipeGraph{return {version:1,sources:[],actions:[],exits:[]}}
