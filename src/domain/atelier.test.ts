import {describe,it,expect} from "vitest";
import {inSeason,parseRecipeText,resolveVariation} from "./atelier";
describe("Atelier Culinaire",()=>{
 it("reconnaît la saisonnalité française et l'inconnu",()=>{
  expect(inSeason("Tomates fraîches",7)).toBe(true);
  expect(inSeason("Tomates fraîches",1)).toBe(false);
  expect(inSeason("sel",3)).toBe(null);
 });
 it("importe une recette textuelle en brouillon",()=>{
  const draft=parseRecipeText("Pizza aux champignons\n4 personnes\nIngrédients\n- 250 g farine\n- 200 g champignons\nPréparation\n1. Mélanger.\n2. Cuire.");
  expect(draft.name).toBe("Pizza aux champignons");
  expect(draft.servings).toBe(4);
  expect(draft.ingredients).toHaveLength(2);
  expect(draft.steps).toHaveLength(2);
 });
 it("recalcule les courses par portion et niveau de fabrication",()=>{
  const variation={id:"a",recipeId:"r",title:"Pizza",components:[
   {name:"Pâte",effort:"maison" as const,minutes:40,instructions:["Pétrir"],ingredients:[{ingredientId:"farine",quantity:250,unit:"g"}]},
   {name:"Pâte",effort:"minimum" as const,minutes:0,instructions:["Dérouler"],ingredients:[{ingredientId:"pate",quantity:1,unit:"pièce"}]},
   {name:"Garniture",effort:"maison" as const,minutes:10,instructions:["Découper"],ingredients:[{ingredientId:"champignon",quantity:200,unit:"g"}]}
  ]};
  const result=resolveVariation(variation,2,4,{"Pâte":"minimum"});
  expect(result.ingredients).toEqual(expect.arrayContaining([{ingredientId:"pate",unit:"pièce",quantity:0.5},{ingredientId:"champignon",unit:"g",quantity:100}]));
  expect(result.ingredients.some(x=>x.ingredientId==="farine")).toBe(false);
  expect(result.minutes).toBe(10);
 });
});
