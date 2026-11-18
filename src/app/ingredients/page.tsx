import {prisma} from "@/lib/prisma";
import IngredientLibrary from "@/components/IngredientLibrary";
export const dynamic="force-dynamic";
export default async function Ingredients(){
 const ingredients=await prisma.ingredient.findMany({include:{_count:{select:{recipeIngredients:true}}},orderBy:[{category:"asc"},{name:"asc"}]});
 const initial=ingredients.map(i=>({id:i.id,name:i.name,category:i.category,defaultUnit:i.defaultUnit,recipeCount:i._count.recipeIngredients}));
 return <><section className="hero"><p className="eyebrow">Votre garde-manger</p><h1>🥑 Bibliothèque d’aliments</h1><p className="muted">Retrouvez vos ingrédients, explorez les rayons et ajoutez facilement de nouveaux aliments pour vos recettes.</p></section><IngredientLibrary initial={initial}/></>;
}
