export type Effort = "minimum" | "intermediaire" | "maison";
export type Preference = "aime" | "neutre" | "evite";
export type IngredientRef = { id: string; name: string; category: string; defaultUnit: string };
export type IngredientUse = { ingredientId: string; quantity: number; unit: string; component?: string };
export type RecipeDraft = { name: string; servings: number; ingredients: { name: string; quantity: number; unit: string }[]; steps: string[]; source: string };
export type ComponentChoice = { name: string; effort: Effort; ingredients: IngredientUse[]; minutes: number; instructions: string[] };
export type RecipeVariation = { id: string; recipeId: string; title: string; components: ComponentChoice[] };
export type Nutrition = { kcal?: number; proteinG?: number; carbsG?: number; fatG?: number; fiberG?: number; source?: string };

export const seasonalMonths: Record<string, number[]> = {
  asperge:[3,4,5,6], aubergine:[6,7,8,9], betterave:[1,2,3,9,10,11,12],
  brocoli:[6,7,8,9,10,11], carotte:[1,2,3,4,5,6,7,8,9,10,11,12],
  champignon:[1,2,3,4,5,6,7,8,9,10,11,12], chou:[1,2,3,4,9,10,11,12],
  concombre:[5,6,7,8,9], courge:[9,10,11,12,1,2],
  courgette:[5,6,7,8,9], epinard:[3,4,5,9,10,11],
  fraise:[4,5,6,7], framboise:[6,7,8,9], haricot:[6,7,8,9],
  poireau:[1,2,3,4,9,10,11,12], pomme:[1,2,3,9,10,11,12],
  poire:[1,2,3,8,9,10,11,12], poivron:[6,7,8,9,10],
  radis:[3,4,5,6,7,8,9], tomate:[6,7,8,9,10]
};
export function normalize(value:string):string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}
export function inSeason(name:string, month:number):boolean|null {
  const text=normalize(name);
  const match=Object.keys(seasonalMonths).find(key=>text.includes(key));
  return match ? seasonalMonths[match].includes(month) : null;
}
export function resolveVariation(variation:RecipeVariation, servings:number, baseServings:number, choices:Record<string,Effort>) {
  if(servings<=0 || baseServings<=0) throw new Error("Les portions doivent être positives");
  const selected=variation.components.filter(c=>c.effort===(choices[c.name]??c.effort));
  const lines=selected.flatMap(c=>c.ingredients.map(i=>({...i,quantity:i.quantity*servings/baseServings})));
  const merged=new Map<string,IngredientUse>();
  for(const line of lines) {
    const key=`${line.ingredientId}:${line.unit}`;
    const previous=merged.get(key);
    merged.set(key,{...line,quantity:(previous?.quantity??0)+line.quantity});
  }
  return { ingredients:[...merged.values()], minutes:selected.reduce((sum,c)=>sum+c.minutes,0),steps:selected.flatMap(c=>c.instructions)};
}
export function parseRecipeText(input:string):RecipeDraft {
  const lines=input.replace(/\r/g,"").split("\n").map(x=>x.trim()).filter(Boolean);
  const name=lines[0]?.replace(/^#+\s*/,"") || "Nouvelle recette";
  const header=lines.find(x=>/\b(?:personnes?|portions?)\b/i.test(x));
  const servings=header ? Number(header.match(/\b(\d+)\s*(?:personnes?|portions?)/i)?.[1]??4):4;
  const ingredients:RecipeDraft["ingredients"]=[];
  const steps:string[]=[];
  let section:"ingredients"|"steps"|"unknown"="unknown";
  for(const line of lines.slice(1)){
    if(/^(?:#+\s*)?ingr[eé]dients?\s*:?$/i.test(line)){section="ingredients";continue}
    if(/^(?:#+\s*)?(?:pr[eé]paration|[eé]tapes?|instructions?)\s*:?$/i.test(line)){section="steps";continue}
    const cleaned=line.replace(/^[-*•]\s*/,"").replace(/^\d+[.)]\s*/,"");
    const match=cleaned.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|mg|ml|cl|l|c\.\s*[aà]\s*s\.?|c\.\s*[aà]\s*c\.?|pi[eè]ces?|unit[eé]s?)?\s+(?:de\s+|d['’])?(.+)$/i);
    if(section!=="steps" && match && (section==="ingredients" || /^[-*•]/.test(line))){
      ingredients.push({quantity:Number(match[1].replace(",",".")),unit:match[2]??"unité",name:match[3].trim()});
    }else if(section==="steps" || /^\d+[.)]/.test(line)){steps.push(cleaned)}
  }
  return {name,servings:Number.isFinite(servings)&&servings>0?servings:4,ingredients,steps,source:input};
}
export function calculateNutrition(perServing:Nutrition|undefined,servings:number) {
  if(!perServing || servings<=0)return null;
  return {kcal:(perServing.kcal??0)*servings,proteinG:(perServing.proteinG??0)*servings,carbsG:(perServing.carbsG??0)*servings,fatG:(perServing.fatG??0)*servings,fiberG:(perServing.fiberG??0)*servings,source:perServing.source};
}
