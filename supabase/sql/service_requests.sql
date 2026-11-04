-- ═══════════════════════════════════════════════════════════════════════
--  Mora (مورا) — جدول طلبات الخدمات الرقمية
--  وفق وثيقة المواصفات §5.2 (نموذج الطلب) و§5.3 (حالات الطلب) و§10.3 (RLS)
--
--  يُشغَّل مرة واحدة: Supabase Dashboard → SQL Editor → New query → Run
--  آمن للتشغيل المتكرر (if not exists / or replace) — إضافي بالكامل:
--  لا يعدّل أي جدول أو سياسة أو دالة قائمة.
--
--  الصلاحيات:
--    • anon + authenticated : إدخال طلب جديد فقط (نموذج الموقع العام)
--    • المسؤول (private.is_admin) : قراءة وتحديث الحالة والملاحظات
--    • الزائر لا يقرأ أي طلب — الرقم المرجعي يظهر للعميل مرة واحدة عند الإرسال
-- ═══════════════════════════════════════════════════════════════════════


-- ── 1) جدول الطلبات ───────────────────────────────────────────────────
create table if not exists public.service_requests (
  id                    uuid primary key default gen_random_uuid(),
  reference_code        text not null default 'MR-' || upper(substr(md5(random()::text), 1, 6)),
  name                  text not null,
  email                 text not null,
  phone                 text,
  country               text,
  preferred_contact     text,
  service_slug          text not null,
  service_title         text not null,
  package_key           text,
  package_name          text,
  extra_field_question  text,
  extra_field_answer    text,
  details               text not null,
  reference_link        text,
  status                text not null default 'submitted'
                        check (status in (
                          'submitted', 'needs_information', 'awaiting_payment',
                          'payment_under_review', 'paid', 'queued', 'in_progress',
                          'internal_review', 'delivered', 'revision_requested',
                          'completed', 'cancelled', 'refund_requested', 'refunded'
                        )),
  admin_notes           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.service_requests is
  'طلبات خدمات مورا الواردة من نموذج الموقع العام — رقم مرجعي MR-XXXXXX لكل طلب';

-- فهرسة للبحث والتشغيل اليومي
create index if not exists service_requests_created_idx
  on public.service_requests (created_at desc);
create index if not exists service_requests_status_idx
  on public.service_requests (status);
create index if not exists service_requests_email_idx
  on public.service_requests (email);
create index if not exists service_requests_slug_idx
  on public.service_requests (service_slug);


-- ── 2) سجل أحداث الطلب (§5.3 — كل نقلة حالة توثق بمَ ومتى) ──────────────
create table if not exists public.service_request_events (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.service_requests (id) on delete cascade,
  event        text not null,
  note         text,
  actor_email  text,
  created_at   timestamptz not null default now()
);

create index if not exists service_request_events_req_idx
  on public.service_request_events (request_id, created_at);

comment on table public.service_request_events is
  'سجل زمني لتغيرات حالة طلبات الخدمات — يُستخدم من لوحة الإدارة في المرحلة القادمة';


-- ── 3) تفعيل RLS ──────────────────────────────────────────────────────
alter table public.service_requests        enable row level security;
alter table public.service_request_events  enable row level security;


-- ── 4) سياسات service_requests ────────────────────────────────────────
-- إدخال عام: أي زائر يستطيع إرسال طلب عبر النموذج (بدون تسجيل)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'service_requests'
      and policyname = 'anyone_can_submit_request'
  ) then
    create policy anyone_can_submit_request
      on public.service_requests
      for insert to anon, authenticated
      with check (true);
  end if;
end $$;

-- القراءة للمسؤول فقط — العميل لا يقرأ طلبات الآخرين ولا حتى طلبه بعد الإرسال
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'service_requests'
      and policyname = 'admin_can_read_requests'
  ) then
    create policy admin_can_read_requests
      on public.service_requests
      for select to authenticated
      using (private.is_admin());
  end if;
end $$;

-- تحديث الحالة والملاحظات للمسؤول فقط — لا يمكن لعميل تحويل طلبه «مدفوع»
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'service_requests'
      and policyname = 'admin_can_update_requests'
  ) then
    create policy admin_can_update_requests
      on public.service_requests
      for update to authenticated
      using (private.is_admin())
      with check (private.is_admin());
  end if;
end $$;

-- لا حذف عام أو للعملاء — الحذف يدوي من الدور المباشر فقط إن لزم
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'service_requests'
      and policyname = 'admin_can_delete_requests'
  ) then
    create policy admin_can_delete_requests
      on public.service_requests
      for delete to authenticated
      using (private.is_admin());
  end if;
end $$;


-- ── 5) سياسات service_request_events ──────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'service_request_events'
      and policyname = 'admin_can_read_events'
  ) then
    create policy admin_can_read_events
      on public.service_request_events
      for select to authenticated
      using (private.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'service_request_events'
      and policyname = 'admin_can_insert_events'
  ) then
    create policy admin_can_insert_events
      on public.service_request_events
      for insert to authenticated
      with check (private.is_admin());
  end if;
end $$;


-- ── 6) تحديث updated_at تلقائيًا عند أي تعديل ──────────────────────────
create or replace function public.touch_service_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_service_request on public.service_requests;
create trigger trg_touch_service_request
  before update on public.service_requests
  for each row
  execute function public.touch_service_request_updated_at();


-- ── 7) الصلاحيات التنفيذية (جرانتس صريحة) ──────────────────────────────
revoke all on public.service_requests from anon, authenticated;
grant select, insert on public.service_requests to authenticated;
grant insert on public.service_requests to anon;
grant select, insert, update, delete on public.service_requests to service_role;

revoke all on public.service_request_events from anon, authenticated;
grant select, insert on public.service_request_events to authenticated;
grant select, insert, update, delete on public.service_request_events to service_role;

-- ═══════════════════════════════════════════════════════════════════════
--  النهاية — بعد التشغيل: نموذج «اطلب الخدمة» في الموقع يعمل فورًا،
--  والطلبات تظهر في لوحة الإدارة → تبويب «طلبات الخدمات».
--  لا حاجة لأي تعديل كود إضافي.
-- ═══════════════════════════════════════════════════════════════════════
