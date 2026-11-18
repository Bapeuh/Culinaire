"use client";
import {useMemo,useState} from "react";
export function parseTags(value:string){return [...new Set(value.split(",").map(s=>s.trim()).filter(Boolean))]}
export default function TagPicker({value,onChange,suggestions}:{value:string;onChange:(value:string)=>void;suggestions:string[]}){
 const [query,setQuery]=useState("");
 const current=parseTags(value);
 const options=useMemo(()=>[...new Set(suggestions.map(s=>s.trim()).filter(Boolean))].filter(s=>!current.some(x=>x.toLocaleLowerCase("fr")===s.toLocaleLowerCase("fr"))&&s.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))).slice(0,20),[suggestions,current,query]);
 function add(tag:string){const clean=tag.trim();if(!clean)return;onChange([...current,clean].join(", "));setQuery("")}
 return <div className="tag-picker"><div className="tag-chips">{current.map(tag=><button type="button" key={tag} className="filter-chip active" onClick={()=>onChange(current.filter(x=>x!==tag).join(", "))} aria-label={`Retirer le mot-clé ${tag}`}>#{tag} ×</button>)}</div><input type="text" aria-label="Chercher ou ajouter un mot-clé" placeholder="Rechercher un mot-clé existant ou en créer un…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();add(query)}}}/><div className="tag-suggestions">{options.map(tag=><button className="filter-chip" key={tag} type="button" onClick={()=>add(tag)}>＋ {tag}</button>)}{query.trim()&&!suggestions.some(s=>s.toLocaleLowerCase("fr")===query.trim().toLocaleLowerCase("fr"))&&<button className="filter-chip" type="button" onClick={()=>add(query)}>＋ Créer « {query.trim()} »</button>}</div></div>
}