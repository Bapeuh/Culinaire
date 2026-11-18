"use server";
import {prisma} from "@/lib/prisma";
import {evaluateGraph,type RecipeGraph} from "@/domain/recipe-graph";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {z} from "zod";

const Source=z.object({id:z.string().min(1),ingredientId:z.string().min(1),name:z.string().min(1),quantity:z.number().positive().finite(),unit:z.string().min(1),optional:z.boolean()});
const Entry=z.object({itemId:z.string().min(1),quantity:z.number().positive().finite()});
const Action=z.object({id:z.string().min(1),type:z.string().min(1),inputs:z.array(Entry),outputs:z.array(z.object({id:z.string().min(1),name:z.string().min(1)})),durationMinutes:z.number().int().nonnegative().nullable(),temperatureC:z.number().int().nonnegative().nullable(),details:z.string(),equipment:z.string().max(120).optional()});
const Graph=z.object({version:z.literal(1),sources:z.array(Source).max(200),actions:z.array(Action).max(200),exits:z.array(z.object({itemId:z.string().min(1),kind:z.enum(["served","discarded"]),quantity:z.number().positive().finite()})).max(300)});
const Meta=z.object({id:z.string(),name:z.string().trim().min(2).max(150),description:z.string().max(2000),category:z.string().min(1).max(60),defaultServings:z.number().int().positive().max(500),prepMinutes:z.number().int().nonnegative(),cookMinutes:z.number().int().nonnegative(),restMinutes:z.number().int().nonnegative(),tags:z.string().max(1000)});
const slugify=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

export async function saveGraphRecipe(form:FormData){
 const parsed=Graph.safeParse(JSON.parse(String(form.get("graph")||"{}")));
 if(!parsed.success)throw new Error("Le déroulé de cuisine est invalide.");
 const graph=parsed.data as RecipeGraph;
 const meta=Meta.parse({id:String(form.get("id")||""),name:String(form.get("name")||""),description:String(form.get("description")||""),category:String(form.get("category")||"Plat"),defaultServings:Number(form.get("defaultServings")),prepMinutes:Number(form.get("prepMinutes")||0),cookMinutes:Number(form.get("cookMinutes")||0),restMinutes:Number(form.get("restMinutes")||0),tags:String(form.get("tags")||"")});
 const report=evaluateGraph(graph);
 if(report.issues.length||graph.sources.length===0||graph.actions.length===0)throw new Error("Corrigez les erreurs du parcours avant d'enregistrer : "+report.issues.join(" ; "));
 const known=await prisma.ingredient.findMany({where:{id:{in:graph.sources.map(s=>s.ingredientId)}},select:{id:true,name:true}});
 const names=new Map(known.map(i=>[i.id,i.name]));
 if(names.size!==new Set(graph.sources.map(s=>s.ingredientId)).size)throw new Error("Certains ingrédients ne figurent plus dans la bibliothèque.");
 // Names remain canonical rather than trusting user-supplied hidden names.
 const cleanGraph:RecipeGraph={...graph,sources:graph.sources.map(s=>({...s,name:names.get(s.ingredientId)!}))};
 const cleanReport=evaluateGraph(cleanGraph);
 const {id,...metadata}=meta;
 const slug=slugify(meta.name)||"recette";
 const data={...metadata,slug,graphJson:JSON.stringify(cleanGraph)};
 const ingredientData=cleanGraph.sources.map((s,i)=>({ingredientId:s.ingredientId,quantity:s.quantity,unit:s.unit,optional:s.optional,note:"",order:i}));
 const stepData=cleanReport.steps.map((s,i)=>({...s,order:i+1}));
 await prisma.$transaction(async tx=>{
  let recipeId=id;
  if(id){
   const existing=await tx.recipe.findUnique({where:{id},select:{id:true}});
   if(!existing)throw new Error("Recette introuvable.");
   await tx.recipeIngredient.deleteMany({where:{recipeId:id}});
   await tx.recipeStep.deleteMany({where:{recipeId:id}});
   await tx.recipeComponent.deleteMany({where:{recipeId:id}});
   await tx.recipe.update({where:{id},data});
  }else recipeId=(await tx.recipe.create({data})).id;
  const component=await tx.recipeComponent.create({data:{recipeId,name:"Parcours de cuisine",order:1}});
  if(ingredientData.length)await tx.recipeIngredient.createMany({data:ingredientData.map(s=>({...s,recipeId,componentId:component.id}))});
  if(stepData.length)await tx.recipeStep.createMany({data:stepData.map(s=>({...s,recipeId,componentId:component.id}))});
 });
 revalidatePath("/");revalidatePath("/recipes");revalidatePath("/planner");revalidatePath("/shopping");
 redirect(`/recipes/${slug}`);
}
