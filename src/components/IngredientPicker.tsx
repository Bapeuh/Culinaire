"use client";
import {useMemo,useState,useTransition} from "react";
import {createIngredient} from "@/app/ingredient-actions";

export type IngredientOption={id:string;name:string;category:string;defaultUnit:string};
const categories=["Fruits & légumes","Épicerie","Produits frais","Boucherie","Poissonnerie","Boulangerie","Surgelés","Boissons","Herbes & épices","Autres"];
const units=["g","kg","ml","cl","l","pièce","gousse","c. à soupe","c. à café","pincée","botte","tranche","sachet"];
export default function IngredientPicker({ingredients,onCreated,onSelect,selectedId}:{ingredients:IngredientOption[];onCreated:(item:IngredientOption)=>void;onSelect?:(id:string)=>void;selectedId?:string}){
 const [query,setQuery]=useState("");
 const [adding,setAdding]=useState(false);
 const [name,setName]=useState("");
 const [category,setCategory]=useState(categories[0]);
 const [unit,setUnit]=useState("g");
 const [error,setError]=useState("");
 const [pending,start]=useTransition();
 const visible=useMemo(()=>ingredients.filter(i=>i.name.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))).slice(0,30),[ingredients,query]);
 function create(){start(async()=>{const result=await createIngredient({name,category,defaultUnit:unit});if(result.ok){onCreated(result.ingredient);setAdding(false);setName("");setError("");setQuery("")}else setError(result.error)})}
 return <div className="ingredient-finder">
  <div className="finder-top"><input type="search" aria-label="Chercher un aliment" placeholder="🔎 Rechercher un aliment…" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" className="btn alt" onClick={()=>{setAdding(!adding);setName(query);setError("")}}>+ Créer un aliment</button></div>
  {onSelect&&<div className="finder-list" role="listbox" aria-label="Choisir un aliment">{visible.map(i=><button key={i.id} role="option" aria-selected={selectedId===i.id} className={selectedId===i.id?"finder-option active":"finder-option"} onClick={()=>onSelect(i.id)} type="button"><span>{i.name}</span><small>{i.category}</small></button>)}{visible.length===0&&<p className="muted">Aucun résultat. Créez cet aliment ci-dessus.</p>}</div>}
  {adding&&<div className="inline-creator" role="group" aria-label="Nouvel aliment"><h3>🌱 Nouvel aliment</h3><label>Nom de l’aliment<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ex. Courgette"/></label><div className="row"><label>Rayon<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select></label><label>Unité habituelle<select value={unit} onChange={e=>setUnit(e.target.value)}>{units.map(x=><option key={x}>{x}</option>)}</select></label></div>{error&&<p role="alert" className="error-text">{error}</p>}<div className="actions"><button className="btn" type="button" onClick={create} disabled={pending||name.trim().length<2}>{pending?"Ajout…":"Ajouter à ma bibliothèque"}</button><button className="btn alt" type="button" onClick={()=>setAdding(false)}>Annuler</button></div></div>}
 </div>;
}
