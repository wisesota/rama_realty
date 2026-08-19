-- Buyer accounts never self-promote into staff organizations.
revoke execute on function public.bootstrap_staff_workspace(text, text) from authenticated;
