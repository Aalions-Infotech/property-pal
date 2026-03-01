
-- Fix security definer view by explicitly setting security_invoker
ALTER VIEW public.market_trends SET (security_invoker = on);
