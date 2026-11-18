"use server";
import {prisma} from "@/lib/prisma";
import {revalidatePath} from "next/cache";
import {z} from "zod";
const schema=z.object({name:z.string().trim().min(2).max(100),category:z.string().trim().min(2).max(80),defaultUnit:z.string().trim().min(1).max(30)});
export async function createIngredient(input:{name:string;category:string;defaultUnit:string}):Promise<{ok:true;ingredient:{id:string;name:string;category:string;defaultUnit:string}}|{ok:false;error:string}>{
 const parsed=schema.safeParse(input);
 if(!parsed.success)return {ok:false,error:"Renseignez un nom, une catégorie et une unité."};
 const {name,category,defaultUnit}=parsed.data;
 const existing=await prisma.ingredient.findMany({select:{name:true}});
 if(existing.some(i=>i.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()===name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()))return {ok:false,error:"Cet ingrédient existe déjà."};
 const slugBase=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"ingredient";
 try{
 const ingredient=await prisma.ingredient.create({data:{name,category,defaultUnit,slug:`${slugBase}-${crypto.randomUUID().slice(0,8)}`},select:{id:true,name:true,category:true,defaultUnit:true}});
 revalidatePath("/ingredients");revalidatePath("/recipes/new");
 return {ok:true,ingredient};
 }catch{return {ok:false,error:"Impossible d'ajouter cet ingrédient. Vérifiez son nom."}}
}
