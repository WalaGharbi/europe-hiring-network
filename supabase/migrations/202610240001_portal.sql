-- Apply once to a NEW Supabase project; does not touch the existing Sites database.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.recruiters(email text primary key);
-- Add your verified recruiter email through trusted SQL administration after setup.
-- No recruiter account is seeded by this public migration.
create or replace function public.is_recruiter() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from private.recruiters r where lower(r.email)=lower(auth.jwt()->>'email'));
$$;
revoke all on function public.is_recruiter() from public;
grant execute on function public.is_recruiter() to authenticated;
create table public.inquiries(
 id uuid primary key default gen_random_uuid(), "userId" uuid not null references auth.users(id), company text not null, name text not null, email text not null, service text not null, title text not null, details text not null, location text not null default '', arrangement text not null default '', budget text not null default '', status text not null default 'Received' check(status in ('Received','Brief confirmed','Sourcing','Shortlist shared','Interviews','Offer / contract','Filled','Closed')), "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now(), note text not null default 'Your request has been received. We will review your requirements and contact you.'
);
create table public.messages(
 id uuid primary key default gen_random_uuid(), "inquiryId" uuid not null references public.inquiries(id), "userId" uuid not null references auth.users(id), role text not null check(role in ('client','team')), body text not null check(length(body) between 1 and 3000), "createdAt" timestamptz not null default now()
);
create table public.shortlist(
 id uuid primary key default gen_random_uuid(), "inquiryId" uuid not null references public.inquiries(id), name text not null, headline text not null, experience text not null default '', skills text not null default '', summary text not null, screening text not null default '', availability text not null default '', rate text not null default '', location text not null default '', visibility text not null default 'draft' check(visibility in ('draft','shared')), feedback text not null default 'Not reviewed' check(feedback in ('Not reviewed','Request interview','Ask a question','Not proceeding')), "feedbackNote" text not null default '', "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create index inquiries_owner on public.inquiries("userId");
create index messages_position on public.messages("inquiryId");
create index shortlist_position on public.shortlist("inquiryId");
alter table public.inquiries enable row level security;
alter table public.messages enable row level security;
alter table public.shortlist enable row level security;
revoke all on public.inquiries,public.messages,public.shortlist from anon,authenticated;
grant select,insert,update on public.inquiries to authenticated;
grant select,insert on public.messages to authenticated;
grant select,insert,update on public.shortlist to authenticated;
create policy inquiries_read on public.inquiries for select to authenticated using("userId"=auth.uid() or public.is_recruiter());
create policy inquiries_create on public.inquiries for insert to authenticated with check("userId"=auth.uid() and status='Received');
create policy inquiries_manage on public.inquiries for update to authenticated using(public.is_recruiter()) with check(public.is_recruiter());
create policy messages_read on public.messages for select to authenticated using(exists(select 1 from public.inquiries i where i.id="inquiryId" and (i."userId"=auth.uid() or public.is_recruiter())));
create policy messages_send on public.messages for insert to authenticated with check("userId"=auth.uid() and exists(select 1 from public.inquiries i where i.id="inquiryId" and (i."userId"=auth.uid() or public.is_recruiter())) and ((role='team' and public.is_recruiter()) or (role='client' and not public.is_recruiter())));
create policy shortlist_read on public.shortlist for select to authenticated using(public.is_recruiter() or (visibility='shared' and exists(select 1 from public.inquiries i where i.id="inquiryId" and i."userId"=auth.uid())));
create policy shortlist_add on public.shortlist for insert to authenticated with check(public.is_recruiter());
create policy shortlist_manage on public.shortlist for update to authenticated using(public.is_recruiter()) with check(public.is_recruiter());
-- Clients cannot directly update profile columns. This narrowly scoped function changes feedback only.
create function public.candidate_feedback(candidate_id uuid,response text,response_note text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or response not in ('Request interview','Ask a question','Not proceeding') or length(coalesce(response_note,''))>3000 or (response='Ask a question' and length(trim(coalesce(response_note,'')))=0) then raise exception 'Invalid feedback'; end if;
 update public.shortlist c set feedback=response,"feedbackNote"=coalesce(response_note,''),"updatedAt"=now()
 where c.id=candidate_id and c.visibility='shared' and exists(select 1 from public.inquiries i where i.id=c."inquiryId" and (i."userId"=auth.uid() or public.is_recruiter()));
 if not found then raise exception 'Candidate not found or access denied'; end if;
end;
$$;
revoke all on function public.candidate_feedback(uuid,text,text) from public;
grant execute on function public.candidate_feedback(uuid,text,text) to authenticated;
