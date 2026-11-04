-- ═══════════════════════════════════════════════════════════════════════
--  JobHubMo — مرحلة الحسابات (المتابعة الشخصية للطلبات)
--  يُشغَّل مرة واحدة: Supabase Dashboard → SQL Editor → New query → Run
--
--  ⚠️ قبل التشغيل: استبدل ADMIN_EMAIL_HERE في الخطوة 1 ببريد المسؤول.
--  السكربت آمن للتشغيل المتكرر (كل العناصر بـ if not exists / or replace)
--  ولا يلمس أي سياسة أو بيانات قائمة — الوظائف الجديدة إضافية فقط.
-- ═══════════════════════════════════════════════════════════════════════


-- ── الخطوة 1: تعيين المسؤول ────────────────────────────────────────────
-- يستبدل ADMIN_EMAIL_HERE ببريد الدخول للإدارة (نفس بريد صفحة /admin/login)
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
where email = 'ADMIN_EMAIL_HERE';


-- ── الخطوة 2: ربط الطلبات بحساب صاحبها ────────────────────────────────
alter table public.applications
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists applications_user_id_idx
  on public.applications (user_id);


-- ── الخطوة 3: سياسة إدخال للمستخدمين المسجلين (إضافية — لا تمس القديمة) ──
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'applications'
      and policyname = 'authenticated_insert_own_application'
  ) then
    create policy authenticated_insert_own_application
      on public.applications
      for insert to authenticated
      with check (user_id = auth.uid() or user_id is null);
  end if;
end $$;


-- ── الخطوة 4: دالة ربط طلب سابق بالحساب ───────────────────────────────
-- تثبت الملكية بمطابقة (الرقم المرجعي + رقم الواتساب) معًا — لا يكفي أحدهما.
create or replace function public.link_application(p_reference text, p_whatsapp text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_reference is null or length(trim(p_reference)) < 4
     or p_whatsapp is null or length(trim(p_whatsapp)) < 8 then
    raise exception 'LINK_BAD_INPUT';
  end if;

  select id into v_id
  from applications
  where data->>'reference_code' = trim(p_reference)
    and candidate_whatsapp      = trim(p_whatsapp)
    and user_id is null
  limit 1;

  if v_id is null then
    raise exception 'LINK_NOT_FOUND';
  end if;

  update applications set user_id = auth.uid() where id = v_id;
  return v_id;
end $$;


-- ── الخطوة 5: دالة قراءة طلبات الحساب فقط ─────────────────────────────
-- security definer كي تعمل بغضّ النظر عن شكل سياسات RLS الحالية،
-- ولا تُعيد إلا صفوف المستخدم الحالي (auth.uid()).
create or replace function public.get_my_applications()
returns table (
  id            text,
  offer_id      text,
  status        text,
  candidate_whatsapp text,
  app_data      jsonb,
  offer_title   text,
  company_name  text
)
language sql
security definer
set search_path = public
as $$
  select a.id::text,
         a.offer_id::text,
         a.status::text,
         a.candidate_whatsapp,
         a.data,
         o.title,
         o.company_name
  from applications a
  left join offers o on o.id = a.offer_id
  where a.user_id = auth.uid()
  order by coalesce(a.data->>'consented_at', '1970-01-01') desc;
$$;

-- لا تسمح للزوار غير المسجلين باستدعاء الدالتين
revoke execute on function public.link_application(text, text) from anon;
revoke execute on function public.get_my_applications() from anon;


-- ═══════════════════════════════════════════════════════════════════════
--  (اختياري — لاحقًا) تدقيق RLS:
--  تشغيل التالي يعرض السياسات القائمة على جدول الطلبات للمراجعة:
--
--  select policyname, cmd, roles, qual, with_check
--  from pg_policies where tablename = 'applications';
-- ═══════════════════════════════════════════════════════════════════════
