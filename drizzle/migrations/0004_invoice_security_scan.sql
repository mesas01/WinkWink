ALTER TABLE public.verified_vendors ADD COLUMN bank_name text, ADD COLUMN bank_last4 text, ADD COLUMN tax_id text, ADD COLUMN verified_at timestamptz;
ALTER TABLE public.verified_vendors ADD CONSTRAINT vendor_bank_last4_valid CHECK (bank_last4 IS NULL OR bank_last4 ~ '^[0-9]{4}$');
ALTER TABLE public.invoices ADD COLUMN security_status text, ADD COLUMN security_snapshot jsonb;
ALTER TABLE public.invoices ADD CONSTRAINT invoice_security_status_valid CHECK (security_status IS NULL OR security_status IN ('passed','review','blocked'));
COMMENT ON COLUMN public.verified_vendors.verified_at IS 'Admin attestation of independent bank and tax identity verification, not AI or bank certification. Store masked account suffix only.';
COMMENT ON COLUMN public.invoices.security_snapshot IS 'Masked bank comparison and tax match result at evaluation; no full account or tax identifier.';
CREATE INDEX invoice_duplicate_lookup ON public.invoices(matched_merchant,invoice_number);
CREATE OR REPLACE FUNCTION public.guard_invoice_security() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF OLD.security_status='blocked' AND NEW.status='approved' THEN RAISE EXCEPTION 'Security-blocked invoices cannot be approved'; END IF;
IF NEW.status='approved' AND NEW.security_status IS DISTINCT FROM 'passed' THEN RAISE EXCEPTION 'Security verification required before approval'; END IF;
IF NEW.invoice_number IS NOT NULL AND NEW.matched_merchant IS NOT NULL AND NEW.status IN ('approved','review','rejected') THEN
PERFORM pg_advisory_xact_lock(hashtextextended(lower(NEW.matched_merchant)||':'||upper(btrim(NEW.invoice_number)),0));
IF EXISTS(SELECT 1 FROM public.invoices i WHERE i.id<>NEW.id AND lower(i.matched_merchant)=lower(NEW.matched_merchant) AND upper(btrim(i.invoice_number))=upper(btrim(NEW.invoice_number)) AND i.status IN ('approved','review','rejected')) THEN
NEW.status='rejected'; NEW.security_status='blocked'; NEW.explanation_es='ALERTA DE SEGURIDAD: número de factura duplicado para el mismo proveedor. No se ejecutó ningún pago.'; NEW.explanation_en='SECURITY ALERT: duplicate invoice number for the same supplier. No payment was executed.';
END IF; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.guard_invoice_security() FROM PUBLIC;
CREATE TRIGGER invoice_security_guard BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.guard_invoice_security();
CREATE OR REPLACE FUNCTION public.resolve_invoice(_id uuid,_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT public.has_role(auth.uid(),'admin') OR NOT public.has_consent() THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF _status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
UPDATE public.invoices SET status=_status WHERE id=_id AND status='review' AND security_status IS DISTINCT FROM 'blocked' AND (_status='rejected' OR security_status='passed');
IF NOT FOUND THEN RAISE EXCEPTION 'Invoice requires security verification or is not awaiting review'; END IF;
INSERT INTO public.invoice_events(invoice_id,actor_id,message_es,message_en) SELECT _id,auth.uid(),CASE WHEN status='approved' THEN 'Aprobada manualmente. No se ejecutó ningún pago.' ELSE coalesce(explanation_es,'Rechazada manualmente.') END,CASE WHEN status='approved' THEN 'Manually approved. No payment was executed.' ELSE coalesce(explanation_en,'Manually rejected.') END FROM public.invoices WHERE id=_id; END $$;
REVOKE ALL ON FUNCTION public.resolve_invoice(uuid,text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.resolve_invoice(uuid,text) TO authenticated;