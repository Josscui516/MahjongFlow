/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS browser acceptance runner */
const runtimeDir = process.env.S6_RUNTIME_DIR;
if (!runtimeDir) throw new Error("Set S6_RUNTIME_DIR to the isolated local acceptance runtime directory.");
const fs = require('fs');
const crypto = require('crypto');
const {createClient} = require('@supabase/supabase-js');
async function main(){
 const raw=fs.readFileSync(runtimeDir+'/status.json','utf8').replace(/^\uFEFF/,'');
 const config=JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1));
 if (!["127.0.0.1", "localhost"].includes(new URL(config.API_URL).hostname)) throw new Error("Acceptance fixtures require loopback Supabase.");
 const admin=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
 const accounts={};
 for(const role of ['authorised','committee']){
  const email=`s6-${role}@example.test`,password=crypto.randomBytes(24).toString('hex');
  const existing=(await admin.auth.admin.listUsers()).data.users.find(u=>u.email===email);
  const {data,error}=existing ? await admin.auth.admin.updateUserById(existing.id,{password}) : await admin.auth.admin.createUser({email,password,email_confirm:true});
  if(error)throw error;
  require('child_process').execFileSync('docker',['exec','-i','supabase_db_mahjongflow-sprint6-acceptance','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:`insert into public.profiles(id,display_name,committee_role,committee_position,can_manage_accounts) values ('${data.user.id}','Fictional S6 ${role}','${role}','Acceptance tester',false) on conflict(id) do nothing;`,stdio:['pipe','pipe','pipe']});
  accounts[role]={id:data.user.id,email,password};
 }
 fs.writeFileSync(runtimeDir+'/accounts.json',JSON.stringify(accounts));
 console.log('Created two fictional local acceptance accounts.');
}
main().catch(e=>{console.error(e.message);process.exit(1)});
