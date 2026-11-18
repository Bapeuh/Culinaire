import {notFound} from "next/navigation";
import {prisma} from "@/lib/prisma";
import GraphRecipeForm from "@/components/GraphRecipeForm";
export const dynamic="force-dynamic";
export default async function VisualRecipeEdit({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const [recipe,ingredients,tagRows]=await Promise.all([prisma.recipe.findUnique({where:{slug}}),prisma.ingredient.findMany({orderBy:{name:"asc"},select:{id:true,name:true,category:true,defaultUnit:true}}),prisma.recipe.findMany({select:{tags:true}})]);
 if(!recipe)notFound();
 return <><section className="hero"><p className="eyebrow">Éditeur d’actions</p><h1>{recipe.name}</h1>{!recipe.graphJson&&<p className="graph-warning">Cette recette est issue de l’ancien éditeur : ses anciennes instructions restent consultables tant que vous n’enregistrez pas ici. Pour la convertir, vous devrez recréer ses actions.</p>}</section><GraphRecipeForm ingredients={ingredients} initial={recipe} tagSuggestions={[...new Set(tagRows.flatMap(r=>r.tags.split(",").map(t=>t.trim()).filter(Boolean)))]}/></>;
}