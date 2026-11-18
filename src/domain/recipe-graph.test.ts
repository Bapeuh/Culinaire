import {describe,it,expect} from "vitest";
import {blankGraph,evaluateGraph,type RecipeGraph} from "./recipe-graph";
const source=(id:string,name:string,quantity:number)=>({id,ingredientId:id,name,quantity,unit:"g",optional:false});
describe("Recipe action graph",()=>{
 it("creates independent results for each cut ingredient and combines them later",()=>{
  const g:RecipeGraph={version:1,sources:[source("onion","Oignon",100),source("tomato","Tomates",400)],actions:[
   {id:"cut",type:"COUPER",inputs:[{itemId:"onion",quantity:100},{itemId:"tomato",quantity:400}],outputs:[{id:"onion-cut",name:"Oignon coupé"},{id:"tomato-cut",name:"Tomates coupées"}],durationMinutes:5,temperatureC:null,details:"en dés"},
   {id:"cook",type:"CUIRE_POELE",inputs:[{itemId:"onion-cut",quantity:100}],outputs:[{id:"onion-cooked",name:"Oignon revenu"}],durationMinutes:5,temperatureC:null,details:""},
   {id:"combine",type:"MELANGER",inputs:[{itemId:"onion-cooked",quantity:1},{itemId:"tomato-cut",quantity:400}],outputs:[{id:"sauce",name:"Sauce tomate"}],durationMinutes:null,temperatureC:null,details:""}
  ],exits:[{itemId:"sauce",kind:"served",quantity:1}]};
  const r=evaluateGraph(g);
  expect(r.issues).toEqual([]);
  expect(r.warnings).toEqual([]);
  expect(r.steps).toHaveLength(3);
  expect(r.steps[0].description).toContain("Oignon");
  expect(r.items.find(x=>x.id==="tomato-cut")?.remaining).toBe(0);
 });
 it("reports an ingredient not used in a served dish",()=>{
  const g:RecipeGraph={...blankGraph(),sources:[source("onion","Oignon",100),source("tomato","Tomate",100)],actions:[{id:"cut",type:"COUPER",inputs:[{itemId:"onion",quantity:100}],outputs:[{id:"onion-cut",name:"Oignon émincé"}],durationMinutes:null,temperatureC:null,details:""}],exits:[{itemId:"onion-cut",kind:"served",quantity:100}]};
  expect(evaluateGraph(g).warnings.some(w=>w.includes("Tomate"))).toBe(true);
 });
 it("detects double use of a preparation",()=>{
  const g:RecipeGraph={...blankGraph(),sources:[source("tomato","Tomate",200)],actions:[
   {id:"cut",type:"COUPER",inputs:[{itemId:"tomato",quantity:200}],outputs:[{id:"cut-tomato",name:"Tomate coupée"}],durationMinutes:null,temperatureC:null,details:""},
   {id:"first",type:"REPOSER",inputs:[{itemId:"cut-tomato",quantity:150}],outputs:[{id:"part1",name:"Partie 1"}],durationMinutes:null,temperatureC:null,details:""},
   {id:"second",type:"REPOSER",inputs:[{itemId:"cut-tomato",quantity:150}],outputs:[{id:"part2",name:"Partie 2"}],durationMinutes:null,temperatureC:null,details:""}
  ],exits:[]};
  expect(evaluateGraph(g).issues.join(" ")).toContain("pas assez");
 });
 it("supports adding ingredients after actions without losing earlier steps",()=>{
  const g:RecipeGraph={...blankGraph(),sources:[source("tomato","Tomate",200)],actions:[{id:"cut",type:"COUPER",inputs:[{itemId:"tomato",quantity:200}],outputs:[{id:"cut-tomato",name:"Tomate coupée"}],durationMinutes:2,temperatureC:null,details:""}],exits:[]};
  const initial=evaluateGraph(g);
  g.sources.push(source("garlic","Ail",10));
  const updated=evaluateGraph(g);
  expect(updated.steps).toEqual(initial.steps);
  expect(updated.items.find(x=>x.id==="garlic")?.remaining).toBe(10);
 });
 it("respects a partial ingredient amount and a discarded exit",()=>{
  const g:RecipeGraph={...blankGraph(),sources:[source("potato","Pomme de terre",500)],actions:[{id:"peel",type:"COUPER",inputs:[{itemId:"potato",quantity:420}],outputs:[{id:"peeled",name:"Pomme de terre épluchée"}],durationMinutes:null,temperatureC:null,details:""}],exits:[{itemId:"peeled",kind:"served",quantity:420},{itemId:"potato",kind:"discarded",quantity:80}]};
  const r=evaluateGraph(g);
  expect(r.issues).toEqual([]);
  expect(r.warnings).toEqual([]);
 });
});
