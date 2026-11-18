"use client";
import {useEffect,useMemo,useState} from "react";
import {inSeason,parseRecipeText,resolveVariation,type Effort,type Preference,type RecipeDraft,type RecipeVariation} from "@/domain/atelier";

type Ingredient={id:string;name:string;category:string;defaultUnit:string};
type Recipe={id:string;name:string;defaultServings:number;ingredients:{ingredientId:string;quantity:number;unit:string;componentName:string}[];steps:string[]};
type Stored={preferences:Record<string,Preference>;variations:RecipeVariation[];drafts:RecipeDraft[];nutrition:Record<string,{kcal:number;proteinG:number;carbsG:number;fatG:number;source:string}>};
const empty:Stored={preferences:{},variations:[],drafts:[],nutrition:{}};
const KEY="culinaire-atelier-v1";
export default function AtelierClient({ingredients,recipes}:{ingredients:Ingredient[];recipes:Recipe[]}){
 const [store,setStore]=useState<Stored>(empty);
 const [ready,setReady]=useState(false);
 const [tab,setTab]=useState<"preferences"|"modulaire"|"import"|"saison"|"nutrition">("modulaire");
 const [recipeId,setRecipeId]=useState(recipes[0]?.id??"");
 const [effort,setEffort]=useState<Record<string,Effort>>({});
 const [servings,setServings]=useState(recipes[0]?.defaultServings??4);
 const [input,setInput]=useState("");
 const [preview,setPreview]=useState<RecipeDraft|null>(null);
 const [message,setMessage]=useState("");
 useEffect(()=>{try{const s=localStorage.getItem(KEY);if(s){const parsed=JSON.parse(s) as Partial<Stored>;setStore({...empty,...parsed})}}catch{setMessage("Les anciennes préférences n'ont pas pu être chargées.")}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem(KEY,JSON.stringify(store))},[store,ready]);
 const selected=recipes.find(r=>r.id===recipeId);
 const components=useMemo(()=>selected?[...new Set(selected.ingredients.map(i=>i.componentName||"Préparation"))]:[],[selected]);
 const variations=store.variations.filter(v=>v.recipeId===recipeId);
 const variation=variations[0]??(selected?{id:"original",recipeId,title:"Recette originale",components:components.map(c=>({name:c,effort:"maison" as Effort,minutes:0,instructions:selected.steps,ingredients:selected.ingredients.filter(i=>i.componentName===c).map(i=>({ingredientId:i.ingredientId,quantity:i.quantity,unit:i.unit}))}))}:null);
 const resolved=variation&&selected?resolveVariation(variation,servings,selected.defaultServings,effort):null;
 function preference(id:string,value:Preference){setStore(s=>({...s,preferences:{...s.preferences,[id]:value}}))}
 function makeVariation(){
   if(!selected)return;
   const list=components.map(name=>({name,effort:"maison" as Effort,minutes:0,instructions:selected.steps,ingredients:selected.ingredients.filter(i=>i.componentName===name).map(i=>({ingredientId:i.ingredientId,quantity:i.quantity,unit:i.unit}))}));
   const variant={id:crypto.randomUUID(),recipeId,title:"Variante personnalisée",components:list};
   setStore(s=>({...s,variations:[variant,...s.variations.filter(v=>v.recipeId!==recipeId)]}));
   setMessage("Variante créée. Vous pouvez maintenant modifier ses composants.");
 }
 function addEffortOption(index:number,level:Effort){
   if(!variation || variation.id==="original")return;
   const source=variation.components[index];
   if(variation.components.some(c=>c.name===source.name&&c.effort===level)){setMessage("Ce niveau existe déjà pour ce composant.");return}
   setStore(s=>({...s,variations:s.variations.map(v=>v.id===variation.id?{...v,components:[...v.components,{...source,effort:level,ingredients:source.ingredients.map(x=>({...x}))}]}:v)}));
   setMessage("Niveau ajouté : adaptez sa liste d'ingrédients et son temps.");
 }
 function updateComponent(index:number,patch:Partial<RecipeVariation["components"][number]>){
   if(!variation || variation.id==="original")return;
   setStore(s=>({...s,variations:s.variations.map(v=>v.id===variation.id?{...v,components:v.components.map((c,i)=>i===index?{...c,...patch}:c)}:v)}));
 }
 function download(data:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
 const month=new Date().getMonth()+1;
 return <div className="card">
  <div className="actions no-print">{([["modulaire","🧩 Recettes"],["import","📄 Import texte"],["preferences","❤️ Préférences"],["saison","🌱 Saisons"],["nutrition","🥗 Nutrition"]] as const).map(([id,label])=><button className={tab===id?"btn":"btn alt"} type="button" key={id} onClick={()=>setTab(id)}>{label}</button>)}</div>
  {message&&<p role="status">{message}</p>}
  {tab==="modulaire"&&<section><h2>Recette modulable</h2><p className="muted">Sélectionnez une recette, créez une variante puis ajustez les composants et les ingrédients. Le panier et les quantités se recalculent.</p><div className="row"><label>Recette<select value={recipeId} onChange={e=>{setRecipeId(e.target.value);setEffort({});const r=recipes.find(x=>x.id===e.target.value);setServings(r?.defaultServings??4)}}>{recipes.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label>Portions<input type="number" min={1} value={servings} onChange={e=>setServings(Math.max(1,Number(e.target.value)||1))}/></label></div>
  {selected&&<><button className="btn alt" type="button" onClick={makeVariation}>Créer / réinitialiser une variante</button>{variation?.components.map((c,i)=><article className="card" key={i}><h3>{c.name} · {c.effort}</h3>{variation.id!=="original"&&<div className="actions"><button type="button" className="btn alt" onClick={()=>addEffortOption(i,"minimum")}>+ Option minimum</button><button type="button" className="btn alt" onClick={()=>addEffortOption(i,"intermediaire")}>+ Option intermédiaire</button></div>}<div className="row"><label>Niveau<select value={effort[c.name]??c.effort} onChange={e=>setEffort(s=>({...s,[c.name]:e.target.value as Effort}))}><option value="minimum">Minimum</option><option value="intermediaire">Intermédiaire</option><option value="maison">Fait maison</option></select></label>{variation.id!=="original"&&<label>Nom du composant<input value={c.name} onChange={e=>updateComponent(i,{name:e.target.value})}/></label>}</div>{variation.id!=="original"&&<><label>Temps (minutes)<input type="number" min={0} value={c.minutes} onChange={e=>updateComponent(i,{minutes:Number(e.target.value)})}/></label><p className="muted">Ingrédients de cette variante</p>{c.ingredients.map((item,j)=><div className="row" key={j}><select value={item.ingredientId} onChange={e=>updateComponent(i,{ingredients:c.ingredients.map((q,k)=>k===j?{...q,ingredientId:e.target.value}:q)})}>{ingredients.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><input aria-label="Quantité" type="number" step="any" value={item.quantity} onChange={e=>updateComponent(i,{ingredients:c.ingredients.map((q,k)=>k===j?{...q,quantity:Number(e.target.value)}:q)})}/><input aria-label="Unité" value={item.unit} onChange={e=>updateComponent(i,{ingredients:c.ingredients.map((q,k)=>k===j?{...q,unit:e.target.value}:q)})}/><button className="btn danger" type="button" onClick={()=>updateComponent(i,{ingredients:c.ingredients.filter((_,k)=>k!==j)})}>Retirer</button></div>)}<button className="btn alt" type="button" onClick={()=>updateComponent(i,{ingredients:[...c.ingredients,{ingredientId:ingredients[0]?.id??"",quantity:1,unit:ingredients[0]?.defaultUnit??"g"}]})}>+ Ingrédient</button></>}</article>)}<h3>Courses recalculées</h3>{resolved?.ingredients.map((i,k)=><p key={k}>{i.quantity.toLocaleString("fr-FR",{maximumFractionDigits:2})} {i.unit} — {ingredients.find(x=>x.id===i.ingredientId)?.name??i.ingredientId}</p>)}<button className="btn alt" type="button" onClick={()=>download({variation,servings,effort,shopping:resolved},"culinaire-variante.json")}>Exporter cette variante</button></>}</section>}
  {tab==="import"&&<section><h2>Importer une recette depuis du texte</h2><p className="muted">Collez un texte avec des rubriques « Ingrédients » et « Préparation ». Un brouillon est extrait sans appel à un service externe, puis peut être exporté et conservé dans cet atelier.</p><textarea style={{width:"100%",minHeight:200}} placeholder={"Pizza aux champignons\n4 personnes\nIngrédients\n- 250 g farine\n- 200 g champignons\nPréparation\n1. Mélanger la farine.\n2. Garnir et cuire."} value={input} onChange={e=>setInput(e.target.value)}/><div className="actions"><button className="btn" type="button" onClick={()=>{setPreview(parseRecipeText(input));setMessage("")}}>Analyser</button></div>{preview&&<article className="card"><h3>{preview.name} — {preview.servings} portions</h3><h4>Ingrédients détectés</h4>{preview.ingredients.map((i,k)=><p key={k}>{i.quantity} {i.unit} {i.name}</p>)}<h4>Étapes détectées</h4>{preview.steps.map((s,k)=><p key={k}>{k+1}. {s}</p>)}<div className="actions"><button className="btn" type="button" onClick={()=>{setStore(s=>({...s,drafts:[...s.drafts,preview]}));setMessage("Brouillon conservé dans cet appareil.")}}>Conserver le brouillon</button><button className="btn alt" type="button" onClick={()=>download(preview,"recette-importee.json")}>Exporter JSON</button></div></article>}<p>{store.drafts.length} brouillon(s) conservé(s).</p></section>}
  {tab==="preferences"&&<section><h2>Préférences alimentaires</h2><p className="muted">Chaque ingrédient peut être aimé, neutre ou évité. Enregistré dans ce navigateur, sans compte utilisateur pour le moment.</p>{ingredients.map(i=><div className="row" key={i.id}><span style={{minWidth:180}}>{i.name}</span>{(["aime","neutre","evite"] as const).map(p=><button type="button" className={store.preferences[i.id]===p?"btn":"btn alt"} key={p} onClick={()=>preference(i.id,p)}>{p==="aime"?"❤️ J’aime":p==="evite"?"🚫 Éviter":"— Neutre"}</button>)}</div>)}<button className="btn alt" type="button" onClick={()=>download(store.preferences,"preferences-culinaire.json")}>Exporter les préférences</button></section>}
  {tab==="saison"&&<section><h2>Saisonnalité</h2><p className="muted">Repères indicatifs pour les récoltes françaises, pouvant varier selon les régions et les années. Les produits transformés/importés ne suivent pas nécessairement ce calendrier.</p>{ingredients.map(i=>{const season=inSeason(i.name,month);return <p key={i.id}>{season===true?"🟢":season===false?"🟠":"⚪"} {i.name} — {season===null?"Non renseigné":season?"De saison":"Hors saison"}</p>})}</section>}
  {tab==="nutrition"&&<section><h2>Données nutritionnelles</h2><p className="muted">Saisie volontaire de valeurs par portion, sans estimation inventée. À connecter ultérieurement à une base nutritionnelle sourcée.</p><label>Recette<select value={recipeId} onChange={e=>setRecipeId(e.target.value)}>{recipes.map(r=><option value={r.id} key={r.id}>{r.name}</option>)}</select></label>{(["kcal","proteinG","carbsG","fatG"] as const).map(k=><label key={k}>{({kcal:"Énergie (kcal)",proteinG:"Protéines (g)",carbsG:"Glucides (g)",fatG:"Lipides (g)"})[k]}<input type="number" min="0" step="any" value={store.nutrition[recipeId]?.[k]??""} onChange={e=>setStore(s=>({...s,nutrition:{...s.nutrition,[recipeId]:{kcal:0,proteinG:0,carbsG:0,fatG:0,source:"Saisie utilisateur",...s.nutrition[recipeId],[k]:Number(e.target.value)}}}))}/></label>)}<button className="btn alt" type="button" onClick={()=>download(store.nutrition,"nutrition-culinaire.json")}>Exporter</button></section>}
  <p className="muted">Atelier expérimental : les préférences, variantes et brouillons sont enregistrés localement dans ce navigateur, indépendamment de la base de recettes.</p>
 </div>
}
