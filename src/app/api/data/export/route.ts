import {createFullBackup} from "@/services/backup";
export async function GET(){const backup=await createFullBackup(),stamp=new Date().toISOString().slice(0,16).replaceAll(":","-");return new Response(JSON.stringify(backup,null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="culinaire-backup-${stamp}.json"`,"Cache-Control":"no-store"}})}
