create or replace function get_total_attachment_size()
returns bigint
language sql
security definer
as $$
  select coalesce(sum(file_size), 0)::bigint
  from public.medical_record_attachments;
$$;
