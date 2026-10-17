ALTER TABLE public.payment_rules DROP CONSTRAINT payment_rules_currency_check; ALTER TABLE public.payment_rules ADD CONSTRAINT payment_rules_currency_check CHECK(currency IN ('USD','COP','EUR','BRL','USDC'));
CREATE OR REPLACE FUNCTION public.validate_approval_reference() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE v record; BEGIN
IF NEW.status='approved' THEN
SELECT * INTO v FROM public.verified_vendors WHERE id=(NEW.decision_snapshot->>'supplierId')::uuid;
IF NOT FOUND OR v.disposition<>'allowed' OR v.trust_confirmed_at IS NULL OR v.trust_confirmed_at::text IS DISTINCT FROM (NEW.decision_snapshot->>'supplierConfirmedAt')::timestamptz::text THEN RAISE EXCEPTION 'Supplier confirmation changed; review required'; END IF;
IF NEW.due_date !~ '^\d{4}-\d{2}-\d{2}$' OR to_char(NEW.due_date::date,'YYYY-MM-DD')<>NEW.due_date THEN RAISE EXCEPTION 'Valid due date required'; END IF;
IF coalesce((NEW.decision_snapshot->>'duplicate')::boolean,false) THEN RAISE EXCEPTION 'Duplicate invoice requires resolution'; END IF;
END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.validate_approval_reference() FROM PUBLIC;
CREATE TRIGGER invoice_approval_reference BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.validate_approval_reference();
CREATE INDEX invoice_budget_reservations ON public.invoices(currency,category,approved_at) WHERE status='approved';