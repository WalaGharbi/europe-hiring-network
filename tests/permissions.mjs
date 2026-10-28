import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb $$; create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid(),auth.jwt() to authenticated;`);
await db.exec(await readFile(new URL('../supabase/migrations/202610240001_portal.sql',import.meta.url),'utf8'));
await db.query("insert into private.recruiters(email) values ('recruiter@example.test')");
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',admin='00000000-0000-4000-8000-000000000003';
await db.query('insert into auth.users(id) values ($1),($2),($3)',[a,b,admin]);
async function user(id,email){await db.exec('reset role');await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id,email})]);await db.exec('set role authenticated')}
async function denied(sql,args=[]){await assert.rejects(db.query(sql,args))}
try{
await user(a,'client-a@example.test');
const p=(await db.query(`insert into public.inquiries("userId",company,name,email,service,title,details) values ($1,'A','Client A','client-a@example.test','Freelance recruitment','Developer','A detailed hiring brief') returning id`,[a])).rows[0].id;
assert.equal((await db.query('select * from public.inquiries')).rows.length,1);
await denied(`insert into public.inquiries("userId",company,name,email,service,title,details) values ($1,'B','B','b@example.test','Recruitment','Developer','Brief')`,[b]);
await user(b,'client-b@example.test');
assert.equal((await db.query('select * from public.inquiries where id=$1',[p])).rows.length,0);
await denied(`insert into public.messages("inquiryId","userId",role,body) values ($1,$2,'client','Unauthorized message')`,[p,b]);
await user(admin,'recruiter@example.test');
assert.equal((await db.query('select public.is_recruiter() as admin')).rows[0].admin,true);
const candidate=(await db.query(`insert into public.shortlist("inquiryId",name,headline,summary) values ($1,'Candidate','PHP developer','Relevant project experience') returning id`,[p])).rows[0].id;
await user(a,'client-a@example.test');assert.equal((await db.query('select * from public.shortlist')).rows.length,0);
await denied('select public.candidate_feedback($1,$2,$3)',[candidate,'Request interview','Please arrange a call']);
await user(admin,'recruiter@example.test');await db.query("update public.shortlist set visibility='shared' where id=$1",[candidate]);
await user(a,'client-a@example.test');assert.equal((await db.query('select * from public.shortlist')).rows.length,1);
await db.query('select public.candidate_feedback($1,$2,$3)',[candidate,'Request interview','Tuesday morning']);
assert.equal((await db.query('select feedback from public.shortlist')).rows[0].feedback,'Request interview');
assert.equal((await db.query("update public.shortlist set summary='Tampered' where id=$1 returning id",[candidate])).rows.length,0);
await denied('insert into private.recruiters(email) values ($1)',['client-a@example.test']);
await denied(`insert into public.messages("inquiryId","userId",role,body) values ($1,$2,'team','Impersonated recruiter')`,[p,a]);
await user(b,'client-b@example.test');assert.equal((await db.query('select * from public.shortlist')).rows.length,0);await denied('select public.candidate_feedback($1,$2,$3)',[candidate,'Not proceeding','']);
await user(admin,'recruiter@example.test');await db.query("update public.shortlist set visibility='draft' where id=$1",[candidate]);
await user(a,'client-a@example.test');assert.equal((await db.query('select * from public.shortlist')).rows.length,0);
await db.exec('reset role;set role anon');await denied('select * from public.inquiries');await denied('select * from public.shortlist');
console.log('PostgreSQL migration and cross-client permission tests passed.');
}finally{await db.close()}
