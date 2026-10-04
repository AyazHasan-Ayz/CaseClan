-- Edge Functions use the service role for payment reconciliation. Explicit
-- grants keep these privileges independent from the customer-facing grants
-- that are intentionally narrowed by the commerce migrations.
grant select, update on public.orders to service_role;
grant select, insert, update on public.payments to service_role;

grant usage on schema private to service_role;
grant select, insert on private.payment_events to service_role;
