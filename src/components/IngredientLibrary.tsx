"use client";
import {useMemo,useState} from "react";
import IngredientPicker,{type IngredientOption} from "@/components/IngredientPicker";
type Entry=IngredientOption & {recipeCount:number};
const icons:Record<string,string>={"Fruits & légumes":"🥬","Épicerie":"🫙","Produits frais":"🧀","Boucherie":"🥩","Poissonnerie":"🐟","Boulangerie":"🥖","Surgelés":"🧊","Boissons":"🥤","Herbes & épices":"🌿","Autres":"🍽️"};
export default function IngredientLibrary({initial}:{initial:Entry[]}){
 const [items,setItems]=useState(initial);
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState("Tous");
 const [creating,setCreating]=useState(false);
 const categories=["Tous",...new Set(items.map(x=>x.category))];
 const visible=useMemo(()=>items.filter(x=>(category==="Tous"||x.category===category)&&x.name.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))),[items,query,category]);
 return <div className="library-page"><div className="library-controls"><label className="search-box">🔎 <input aria-label="Rechercher un aliment" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un aliment…"/></label><button className="btn" type="button" onClick={()=>setCreating(x=>!x)}>＋ Nouvel aliment</button></div>{creating&&<div className="card library-create"><IngredientPicker ingredients={items} onCreated={item=>{setItems(v=>[...v,{...item,recipeCount:0}].sort((a,b)=>a.name.localeCompare(b.name,"fr")));setCreating(false)}}/></div>}<div className="filter-chips">{categories.map(c=><button key={c} type="button" className={category===c?"filter-chip active":"filter-chip"} onClick={()=>setCategory(c)}>{c==="Tous"?"🧺":icons[c]??"🍽️"} {c}</button>)}</div><p className="muted">{visible.length} aliment{visible.length>1?"s":""} dans votre bibliothèque</p><div className="food-library-grid">{visible.map(x=><article className="food-library-card" key={x.id}><span className="food-library-icon">{icons[x.category]??"🍽️"}</span><h3>{x.name}</h3><p>{x.category}</p><footer><span>⚖️ {x.defaultUnit}</span><span>📖 {x.recipeCount} recette{x.recipeCount>1?"s":""}</span></footer></article>)}</div>{!visible.length&&<div className="empty-editor">🔎<p>Aucun aliment trouvé.</p><small>Essayez une autre recherche ou créez cet aliment.</small></div>}</div>
}
