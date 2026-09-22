import {PrismaClient} from "@prisma/client";const prisma=new PrismaClient();
const count=await prisma.recipe.count();await prisma.$disconnect();
if(count>0&&process.env.FORCE_SEED_RESET!=="true"){console.error(`Le seed a été annulé : cette base contient déjà ${count} recette(s). Utilisez FORCE_SEED_RESET=true uniquement si vous souhaitez réellement remplacer toutes les données.`);process.exit(1)}
await import("./seed.ts");
