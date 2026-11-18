import {prisma} from "@/lib/prisma";
import AtelierClient from "@/components/AtelierClient";
export const dynamic="force-dynamic";
export default async function AtelierPage(){
  const [ingredients,recipes]=await Promise.all([
    prisma.ingredient.findMany({orderBy:{name:"asc"},select:{id:true,name:true,category:true,defaultUnit:true}}),
    prisma.recipe.findMany({orderBy:{name:"asc"},include:{ingredients:{include:{component:true}},steps:{orderBy:{order:"asc"}}}})
  ]);
  const adapted=recipes.map(r=>({
    id:r.id,name:r.name,defaultServings:r.defaultServings,
    ingredients:r.ingredients.map(i=>({ingredientId:i.ingredientId,quantity:i.quantity,unit:i.unit,componentName:i.component?.name??"Préparation"})),
    steps:r.steps.map(s=>s.description)
  }));
  return <><section className="hero"><p className="eyebrow">Laboratoire Culinaire</p><h1>Atelier des nouvelles fonctions</h1><p className="muted">Variantes, niveaux de fabrication, import texte, préférences, saisonnalité et nutrition. Premiers modules à essayer et à affiner.</p></section><AtelierClient ingredients={ingredients} recipes={adapted}/></>;
}
