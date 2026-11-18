import {prisma} from "@/lib/prisma";
import GraphRecipeForm from "@/components/GraphRecipeForm";
export const dynamic="force-dynamic";
export default async function NewRecipe(){
 const ingredients=await prisma.ingredient.findMany({orderBy:{name:"asc"},select:{id:true,name:true,category:true,defaultUnit:true}});
 return <><section className="hero"><p className="eyebrow">Nouvel éditeur</p><h1>🍳 Créer une recette</h1><p className="muted">Composez votre recette en choisissant des ingrédients puis des actions. Chaque préparation reste disponible jusqu’à son utilisation.</p></section><GraphRecipeForm ingredients={ingredients}/></>;
}