"use client";
import {useMemo,useState} from "react";
import {saveGraphRecipe} from "@/app/graph-actions";
import {ACTIONS,EQUIPMENT,defaultEquipment,blankGraph,evaluateGraph,expectedOutputCount,isSplit,type Action,type RecipeGraph,type Source} from "@/domain/recipe-graph";
import IngredientPicker,{type IngredientOption} from "@/components/IngredientPicker";
import TagPicker from "@/components/TagPicker";

type Meta={id:string;name:string;description:string;category:string;defaultServings:number;prepMinutes:number;cookMinutes:number;restMinutes:number;tags:string;graphJson?:string};
const categories=["Entrée","Plat","Dessert","Soupe","Boisson"];
const units=["g","kg","ml","cl","l","pièce","gousse","c. à soupe","c. à café","tranche","botte"];
const uid=()=>crypto.randomUUID();
const round=(n:number)=>Math.round(n*1e5)/1e5;
const fmt=(n:number)=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:2}).format(n);
function syncOutputs(action:Action,known:Map<string,string>):Action{
 const count=expectedOutputCount(action);
 const outputs=Array.from({length:count},(_,i)=>{
  const previous=action.outputs[i];if(previous)return previous;
  const source=known.get(action.inputs[i]?.itemId)??"préparation";
  const verb=ACTIONS.find(a=>a[0]===action.type)?.[1]?.replace(/^\S+\s/,"").toLowerCase()??"préparé";
  return {id:uid(),name:isSplit(action.type)?`${source} — ${verb}`:`Préparation ${verb}`};
 });
 return {...action,outputs};
}
export default function GraphRecipeForm({ingredients,initial,tagSuggestions=[]}:{ingredients:IngredientOption[];initial?:Meta;tagSuggestions?:string[]}){
 const [catalog,setCatalog]=useState(ingredients);
 const [name,setName]=useState(initial?.name??"");
 const [description,setDescription]=useState(initial?.description??"");
 const [category,setCategory]=useState(initial?.category??"Plat");
 const [portions,setPortions]=useState(initial?.defaultServings??4);
 const [prep,setPrep]=useState(initial?.prepMinutes??15);
 const [cook,setCook]=useState(initial?.cookMinutes??20);
 const [rest,setRest]=useState(initial?.restMinutes??0);
 const [tags,setTags]=useState(initial?.tags??"");
 const [graph,setGraph]=useState<RecipeGraph>(()=>{try{return initial?.graphJson?JSON.parse(initial.graphJson) as RecipeGraph:blankGraph()}catch{return blankGraph()}});
 const [showAdd,setShowAdd]=useState(false);
 const [current,setCurrent]=useState<string|null>(null);
 const [saving,setSaving]=useState(false);
 const [showMeta,setShowMeta]=useState(!initial);
 const report=useMemo(()=>evaluateGraph(graph),[graph]);
 const selected=graph.actions.find(a=>a.id===current)??graph.actions.at(-1);
 const selectedIndex=selected?graph.actions.findIndex(a=>a.id===selected.id):-1;
 const before=useMemo(()=>evaluateGraph({...graph,actions:graph.actions.slice(0,selectedIndex<0?0:selectedIndex),exits:[]}),[graph,selectedIndex]);
 const available=before.items.filter(i=>i.remaining>1e-6);
 const currentItemLabels=new Map(before.items.map(i=>[i.id,i.name]));
 const finalItems=report.items.filter(i=>i.remaining>1e-6);
 const change=(fn:(g:RecipeGraph)=>RecipeGraph)=>setGraph(g=>fn(g));
 function addIngredient(id:string){
  const ingredient=catalog.find(i=>i.id===id);if(!ingredient)return;
  change(g=>({...g,sources:[...g.sources,{id:uid(),ingredientId:id,name:ingredient.name,quantity:1,unit:ingredient.defaultUnit,optional:false}]}));
  setShowAdd(false);
 }
 function updateSource(id:string,patch:Partial<Source>){change(g=>({...g,sources:g.sources.map(s=>s.id===id?{...s,...patch}:s)}))}
 function createAction(){
  const id=uid();
  change(g=>({...g,actions:[...g.actions,{id,type:"COUPER",inputs:[],outputs:[],durationMinutes:null,temperatureC:null,details:"",equipment:defaultEquipment("COUPER")}]}));
  setCurrent(id);
 }
 function updateAction(patch:Partial<Action>){
  if(!selected)return;
  const merged={...selected,...patch};
  const synced=syncOutputs(merged,currentItemLabels);
  change(g=>({...g,actions:g.actions.map(a=>a.id===selected.id?synced:a)}));
 }
 function addInput(id:string){
  if(!selected||!id||selected.inputs.some(i=>i.itemId===id))return;
  const item=available.find(i=>i.id===id);if(!item)return;
  updateAction({inputs:[...selected.inputs,{itemId:id,quantity:round(item.remaining)}]});
 }
 function moveAction(dir:number){
  if(!selected)return;
  change(g=>{const a=[...g.actions];const i=a.findIndex(x=>x.id===selected.id);const j=i+dir;if(j<0||j>=a.length)return g;[a[i],a[j]]=[a[j],a[i]];return {...g,actions:a}});
 }
 function setExit(itemId:string,kind:"served"|"discarded"|"none"){
  change(g=>{const exits=g.exits.filter(x=>x.itemId!==itemId);const item=report.items.find(x=>x.id===itemId);
   return {...g,exits:kind!=="none"&&item?[...exits,{itemId,kind,quantity:item.remaining}]:exits};
  });
 }
 const disabled=!!report.issues.length||!graph.sources.length||!graph.actions.length||!report.served.length||name.trim().length<2||saving;
 return <form action={saveGraphRecipe} className="graph-form" onSubmit={()=>setSaving(true)}>
  <input type="hidden" name="id" value={initial?.id??""}/><input type="hidden" name="name" value={name}/><input type="hidden" name="description" value={description}/><input type="hidden" name="category" value={category}/><input type="hidden" name="defaultServings" value={portions}/><input type="hidden" name="prepMinutes" value={prep}/><input type="hidden" name="cookMinutes" value={cook}/><input type="hidden" name="restMinutes" value={rest}/><input type="hidden" name="tags" value={tags}/><input type="hidden" name="graph" value={JSON.stringify(graph)}/>
  <div className="graph-header card"><div><p className="eyebrow">Création libre</p><h2>{name||"Ma nouvelle recette"}</h2><p className="muted">Ajoutez un ingrédient à tout moment. Une action peut produire plusieurs préparations indépendantes.</p></div><button type="button" className="btn alt" onClick={()=>setShowMeta(v=>!v)}>⚙️ {showMeta?"Masquer":"Informations de la recette"}</button></div>
  {showMeta&&<section className="graph-meta card"><div className="row"><label>Nom de la recette<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ex. Sauce tomate maison"/></label><label>Catégorie<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Nombre de portions<input type="number" min={1} value={portions} onChange={e=>setPortions(Math.max(1,Number(e.target.value)||1))}/></label></div><label>Description<textarea rows={2} value={description} onChange={e=>setDescription(e.target.value)}/></label><div className="row"><label>Préparation (min)<input type="number" min={0} value={prep} onChange={e=>setPrep(Math.max(0,Number(e.target.value)||0))}/></label><label>Cuisson (min)<input type="number" min={0} value={cook} onChange={e=>setCook(Math.max(0,Number(e.target.value)||0))}/></label><label>Repos (min)<input type="number" min={0} value={rest} onChange={e=>setRest(Math.max(0,Number(e.target.value)||0))}/></label><label>Mots-clés<TagPicker value={tags} onChange={setTags} suggestions={tagSuggestions}/></label></div></section>}
  <div className="graph-columns">
   <aside className="graph-side card"><h2>🥕 Ingrédients</h2><p className="muted">Disponibles dès leur ajout, même en cours de création.</p><div className="graph-source-list">{graph.sources.map(s=><div className="graph-source" key={s.id}><div className="graph-source-title"><strong>{s.name}</strong><button type="button" title="Retirer" onClick={()=>change(g=>({...g,sources:g.sources.filter(x=>x.id!==s.id)}))}>×</button></div><div className="graph-quantity"><input aria-label={`Quantité de ${s.name}`} type="number" min=".001" step="any" value={String(s.quantity)} onChange={e=>{const next=e.target.value.replace(/^0+(?=\\d)/,"");updateSource(s.id,{quantity:Number(next)})}}/><select aria-label={`Unité de ${s.name}`} value={s.unit} onChange={e=>updateSource(s.id,{unit:e.target.value})}>{[...new Set([...units,s.unit])].map(u=><option key={u}>{u}</option>)}</select></div><label className="optional-line"><input type="checkbox" checked={s.optional} onChange={e=>updateSource(s.id,{optional:e.target.checked})}/> Facultatif</label></div>)}</div><button type="button" className="btn" onClick={()=>setShowAdd(v=>!v)}>＋ Ajouter un aliment</button>{showAdd&&<IngredientPicker ingredients={catalog} onSelect={addIngredient} onCreated={i=>{setCatalog(c=>[...c,i]);change(g=>({...g,sources:[...g.sources,{id:uid(),ingredientId:i.id,name:i.name,quantity:1,unit:i.defaultUnit,optional:false}]}));setShowAdd(false)}}/>}<hr/><h3>Éléments encore disponibles</h3>{report.items.filter(i=>i.remaining>1e-6).map(i=><p key={i.id} className="graph-chip">🥣 {i.name} <strong>{fmt(i.remaining)} {i.unit}</strong></p>)}</aside>
   <section className="graph-flow card"><h2>🍳 Actions</h2><p className="muted">Chaque action a ses entrées et ses résultats. Sélectionnez une étape pour la modifier.</p><div className="graph-step-list">{graph.actions.map((a,index)=><button type="button" key={a.id} className={selected?.id===a.id?"graph-step chosen":"graph-step"} onClick={()=>setCurrent(a.id)}><span className="step-number">{index+1}</span><span><strong>{ACTIONS.find(x=>x[0]===a.type)?.[1]??a.type}</strong><small>{a.outputs.map(x=>x.name).join(" + ")||"Choisissez les entrées"}</small></span></button>)}</div><button className="btn alt" type="button" onClick={createAction}>＋ Ajouter une action</button>{selected&&<div className="graph-action-editor"><div className="graph-action-toolbar"><strong>Action {selectedIndex+1}</strong><div className="actions"><button type="button" className="btn alt" onClick={()=>moveAction(-1)} disabled={selectedIndex<=0}>↑</button><button type="button" className="btn alt" onClick={()=>moveAction(1)} disabled={selectedIndex>=graph.actions.length-1}>↓</button><button type="button" className="btn danger" onClick={()=>{change(g=>({...g,actions:g.actions.filter(a=>a.id!==selected.id)}));setCurrent(null)}}>Supprimer</button></div></div><label>Que fait-on ?<select value={selected.type} onChange={e=>updateAction({type:e.target.value,outputs:[],equipment:defaultEquipment(e.target.value)})}>{ACTIONS.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label><h3>Éléments utilisés</h3>{selected.inputs.map(input=><div key={input.itemId} className="graph-input"><span>{currentItemLabels.get(input.itemId)??"⚠️ Élément introuvable"}</span><input type="number" step="any" min=".001" aria-label="Quantité utilisée" value={String(input.quantity)} onChange={e=>updateAction({inputs:selected.inputs.map(x=>x.itemId===input.itemId?{...x,quantity:Number(e.target.value)}:x)})}/><button type="button" aria-label="Retirer cet élément" onClick={()=>updateAction({inputs:selected.inputs.filter(x=>x.itemId!==input.itemId),outputs:[]})}>×</button></div>)}<label>＋ Ajouter un ingrédient ou résultat précédent<select value="" onChange={e=>addInput(e.target.value)}><option value="">Choisir un élément disponible…</option>{available.filter(i=>!selected.inputs.some(x=>x.itemId===i.id)).map(i=><option key={i.id} value={i.id}>{i.name} — {fmt(i.remaining)} {i.unit}</option>)}</select></label><h3>🧰 Ustensiles nécessaires</h3><p className="muted">Sélection automatique proposée selon l'action. Plusieurs outils sont possibles.</p><div className="equipment-options">{(EQUIPMENT[selected.type]??[]).map(tool=>{const chosen=(selected.equipment??defaultEquipment(selected.type)).split(",").map(x=>x.trim()).includes(tool);return <label key={tool} className="equipment-chip"><input type="checkbox" checked={chosen} onChange={e=>{const prev=(selected.equipment??defaultEquipment(selected.type)).split(",").map(x=>x.trim()).filter(Boolean);updateAction({equipment:(e.target.checked?[...prev,tool]:prev.filter(x=>x!==tool)).join(", ")})}}/> {tool}</label>})}</div><label>Autre équipement (séparé par virgules)<input value={selected.equipment??defaultEquipment(selected.type)} onChange={e=>updateAction({equipment:e.target.value})} placeholder="Ex. couteau d'office"/></label><h3>Résultats créés</h3><p className="muted">{isSplit(selected.type)?"Chaque entrée produit un élément indépendant.":"Les entrées deviennent une préparation commune."}</p>{selected.outputs.map((out,i)=><label key={out.id}>Résultat {i+1}<input value={out.name} onChange={e=>updateAction({outputs:selected.outputs.map((o,j)=>j===i?{...o,name:e.target.value}:o)})}/></label>)}<div className="row"><label>Durée (min)<input type="number" min={0} placeholder="Facultatif" value={selected.durationMinutes??""} onChange={e=>updateAction({durationMinutes:e.target.value===""?null:Number(e.target.value)})}/></label><label>Température °C<input type="number" min={0} placeholder="Facultatif" value={selected.temperatureC??""} onChange={e=>updateAction({temperatureC:e.target.value===""?null:Number(e.target.value)})}/></label></div><label>Précision facultative<textarea rows={2} placeholder="Ex. en petits dés, à feu moyen…" value={selected.details} onChange={e=>updateAction({details:e.target.value})}/></label></div>}</section>
   <aside className="graph-review card"><h2>📖 Recette générée</h2><ol>{report.steps.map((s,i)=><li key={i}>{s.description}</li>)}</ol><h3>🍽️ Résultat final</h3><p className="muted">Choisissez ce qui est servi ou volontairement jeté. Un ingrédient doit arriver dans un résultat servi pour être validé.</p>{finalItems.map(i=><div key={i.id} className="graph-finish"><span>{i.name} — {fmt(i.remaining)} {i.unit}</span><select aria-label={`Destination de ${i.name}`} value={graph.exits.find(x=>x.itemId===i.id)?.kind??"none"} onChange={e=>setExit(i.id,e.target.value as "none"|"served"|"discarded")}><option value="none">En attente</option><option value="served">🍽️ Servi</option><option value="discarded">🗑️ Retiré</option></select></div>)}<h3>🔍 Contrôle de cohérence</h3>{report.issues.map((issue,i)=><p className="graph-error" key={i}>⛔ {issue}</p>)}{report.warnings.map((warning,i)=><p className="graph-warning" key={i}>⚠️ {warning}</p>)}{!report.issues.length&&!report.warnings.length&&<p className="graph-success">✅ Tous les ingrédients et résultats sont suivis jusqu'au plat final.</p>}</aside>
  </div>
  <div className="graph-save-bar"><span>{graph.sources.length} ingrédient(s) · {graph.actions.length} action(s) · {report.issues.length} erreur(s)</span><button className="btn" type="submit" disabled={disabled}>{saving?"Enregistrement…":"✓ Enregistrer la recette"}</button></div>
 </form>;
}
