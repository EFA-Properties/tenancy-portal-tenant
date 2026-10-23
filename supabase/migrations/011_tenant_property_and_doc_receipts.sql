-- Tenancy Portal: let tenants see their own property and confirm receipt of documents
-- Supabase project tenancy-portal (fpgqqxaltegfjhqlhimk)

-- 1. Tenants can read the property they rent (nothing else).
create or replace function public.is_tenant_of_property(p_property_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from tenancies t
    join tenancy_tenants tt on tt.tenancy_id = t.id
    join tenants tn on tn.id = tt.tenant_id
    where t.property_id = p_property_id
      and tn.auth_user_id = auth.uid()
  );
$$;
revoke all on function public.is_tenant_of_property(uuid) from public, anon;
grant execute on function public.is_tenant_of_property(uuid) to authenticated;

create policy "Tenants can view their property" on public.properties
  for select to authenticated
  using (public.is_tenant_of_property(id));

-- 2. Tenants can read their own receipt confirmations.
create policy "Tenants can view own doc acks" on public.document_acknowledgements
  for select to authenticated
  using (public.is_own_tenant_link(tenant_id));

-- 3. A tenant records that they opened, or confirmed receipt of, a document
--    they are allowed to see. One confirmation per tenant per document.
create unique index if not exists document_acknowledgements_doc_tenant_key
  on public.document_acknowledgements(document_id, tenant_id);

create or replace function public.tenant_record_document(p_document_id uuid, p_action text, p_user_agent text default null)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare
  v_tenant uuid;
  v_tenancy uuid;
begin
  if auth.uid() is null or p_action not in ('opened', 'confirmed') then
    return false;
  end if;

  select tn.id, t.id into v_tenant, v_tenancy
  from documents d
  join tenancies t on (d.scope = 'tenancy' and t.id = d.tenancy_id)
                   or (d.scope = 'property' and t.property_id = d.property_id and t.status = 'active')
  join tenancy_tenants tt on tt.tenancy_id = t.id
  join tenants tn on tn.id = tt.tenant_id
  where d.id = p_document_id
    and tn.auth_user_id = auth.uid()
    and coalesce(d.tenant_visible, true)
  limit 1;

  if v_tenant is null then
    return false;
  end if;

  update documents set tenant_opened_at = coalesce(tenant_opened_at, now())
   where id = p_document_id;

  if p_action = 'confirmed' then
    insert into document_acknowledgements (document_id, tenant_id, tenancy_id, acknowledged_at, user_agent, confirmation_text)
    values (p_document_id, v_tenant, v_tenancy, now(), left(p_user_agent, 500),
            'I confirm I have received and read this document.')
    on conflict (document_id, tenant_id) do nothing;
    update documents set tenant_confirmed_at = coalesce(tenant_confirmed_at, now())
     where id = p_document_id;
  end if;

  return true;
end;
$$;
revoke all on function public.tenant_record_document(uuid, text, text) from public, anon;
grant execute on function public.tenant_record_document(uuid, text, text) to authenticated;
