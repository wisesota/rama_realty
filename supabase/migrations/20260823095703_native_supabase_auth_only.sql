-- Remove the final OAuth-specific audit vocabulary now that Rama uses only
-- native Supabase password and email-link authentication.

update private.buyer_session_token_tombstones
set reason = 'auth_callback'
where reason = 'oauth';

alter table private.buyer_session_token_tombstones
  drop constraint if exists buyer_session_token_tombstones_reason_check;

alter table private.buyer_session_token_tombstones
  add constraint buyer_session_token_tombstones_reason_check
  check (reason in (
    'login',
    'auth_callback',
    'handoff',
    'password_change',
    'signout',
    'user_mismatch'
  ));

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'private.rotate_buyer_session_locked(text,text,uuid,text,integer,text)'::regprocedure
  ) into function_definition;

  if function_definition not like '%''oauth''%' then
    raise exception 'Expected OAuth rotation reason was not found in rotate_buyer_session_locked';
  end if;

  execute replace(function_definition, '''oauth''', '''auth_callback''');
end;
$$;
