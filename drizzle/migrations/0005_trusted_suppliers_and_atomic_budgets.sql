ALTER TABLE public.verified_vendors ADD COLUMN invoice_prefix text, ADD COLUMN reference_invoice_number text, ADD COLUMN format_notes text, ADD COLUMN expected_category text, ADD COLUMN expected_currency text, ADD COLUMN confirmation_channel text, ADD COLUMN trust_confirmed_at timestamptz, ADD COLUMN trust_confirmed_by uuid;
ALTER TABLE public.invoices ADD COLUMN due_date text, ADD COLUMN decision_snapshot jsonb, ADD COLUMN approved_at timestamptz, ADD COLUMN ai_usage jsonb;
CREATE TABLE public.budget_limits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), label text NOT NULL, currency text NOT NULL, category text NOT NULL DEFAULT 'all', period text NOT NULL DEFAULT 'month' CHECK(period IN ('day','half_month','month')), per_payment numeric NOT NULL CHECK(per_payment>=0), human_above numeric NOT NULL CHECK(human_above>=0), period_limit numeric NOT NULL CHECK(period_limit>=0), enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.budget_limits TO authenticated; GRANT ALL ON public.budget_limits TO service_role;
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY budget_admin ON public.budget_limits FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin') AND public.has_consent()) WITH CHECK(public.has_role(auth.uid(),'admin') AND public.has_consent());
CREATE TABLE public.supplier_attestations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid NOT NULL, actor_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), snapshot jsonb NOT NULL);
GRANT SELECT ON public.supplier_attestations TO authenticated; GRANT ALL ON public.supplier_attestations TO service_role;
ALTER TABLE public.supplier_attestations ENABLE ROW LEVEL SECURITY;
CREATE POLICY attestation_admin ON public.supplier_attestations FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin') AND public.has_consent());
CREATE OR REPLACE FUNCTION public.record_supplier_trust() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='UPDATE' AND ROW(NEW.name,NEW.tax_id,NEW.invoice_prefix,NEW.reference_invoice_number,NEW.expected_category,NEW.expected_currency,NEW.aliases,NEW.format_notes,NEW.confirmation_channel,NEW.disposition) IS DISTINCT FROM ROW(OLD.name,OLD.tax_id,OLD.invoice_prefix,OLD.reference_invoice_number,OLD.expected_category,OLD.expected_currency,OLD.aliases,OLD.format_notes,OLD.confirmation_channel,OLD.disposition) THEN NEW.trust_confirmed_at=NULL; NEW.trust_confirmed_by=NULL; END IF;
IF NEW.trust_confirmed_at IS NOT NULL AND (TG_OP='INSERT' OR NEW.trust_confirmed_at IS DISTINCT FROM OLD.trust_confirmed_at) THEN
IF NOT public.has_role(auth.uid(),'admin') OR NOT public.has_consent() THEN RAISE EXCEPTION 'Finance admin confirmation required'; END IF;
IF nullif(btrim(NEW.tax_id),'') IS NULL OR nullif(btrim(NEW.reference_invoice_number),'') IS NULL OR nullif(btrim(NEW.invoice_prefix),'') IS NULL OR nullif(btrim(NEW.format_notes),'') IS NULL OR nullif(btrim(NEW.confirmation_channel),'') IS NULL OR NEW.expected_category IS NULL OR NEW.expected_currency IS NULL OR NEW.disposition<>'allowed' THEN RAISE EXCEPTION 'Complete supplier reference and confirmation details'; END IF;
NEW.trust_confirmed_at=now(); NEW.trust_confirmed_by=auth.uid();
INSERT INTO public.supplier_attestations(vendor_id,actor_id,snapshot) VALUES(NEW.id,auth.uid(),jsonb_build_object('name',NEW.name,'invoice_prefix',NEW.invoice_prefix,'reference_invoice_number',NEW.reference_invoice_number,'format_notes',NEW.format_notes,'category',NEW.expected_category,'currency',NEW.expected_currency,'channel',NEW.confirmation_channel));
END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.record_supplier_trust() FROM PUBLIC;
CREATE TRIGGER supplier_trust_record BEFORE INSERT OR UPDATE ON public.verified_vendors FOR EACH ROW EXECUTE FUNCTION public.record_supplier_trust();
CREATE OR REPLACE FUNCTION public.budget_period_start(_period text,_time timestamptz) RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT CASE WHEN _period='day' THEN date_trunc('day',_time AT TIME ZONE 'America/Bogota') WHEN _period='half_month' THEN date_trunc('month',_time AT TIME ZONE 'America/Bogota')+CASE WHEN extract(day FROM _time AT TIME ZONE 'America/Bogota')>15 THEN interval '15 days' ELSE interval '0 days' END ELSE date_trunc('month',_time AT TIME ZONE 'America/Bogota') END AT TIME ZONE 'America/Bogota' $$;
CREATE OR REPLACE FUNCTION public.guard_invoice_security() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE b record; used numeric; details jsonb='[]'::jsonb; manual boolean; t timestamptz=now(); BEGIN
IF OLD.security_status='blocked' AND NEW.status='approved' THEN RAISE EXCEPTION 'Previously security-blocked invoice requires separate investigation'; END IF;
IF NEW.status='approved' THEN
IF NEW.security_status IS DISTINCT FROM 'passed' OR coalesce((NEW.decision_snapshot->>'trustPassed')::boolean,false)=false OR NEW.amount IS NULL OR NEW.amount<0 OR NEW.currency IS NULL OR NEW.due_date IS NULL THEN RAISE EXCEPTION 'Confirmed supplier and complete invoice required'; END IF;
END IF;
IF NEW.status IN ('approved','review','rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
PERFORM pg_advisory_xact_lock(hashtextextended('winkwink-budget',0));
IF NEW.invoice_number IS NOT NULL AND NEW.matched_merchant IS NOT NULL AND EXISTS(SELECT 1 FROM public.invoices i WHERE i.id<>NEW.id AND lower(i.matched_merchant)=lower(NEW.matched_merchant) AND upper(btrim(i.invoice_number))=upper(btrim(NEW.invoice_number)) AND i.status IN ('approved','review')) THEN NEW.status='review'; NEW.explanation_es='Factura duplicada: revisión humana necesaria. No se ejecutó ningún pago.'; NEW.explanation_en='Duplicate invoice: human review required. No payment was executed.'; NEW.decision_snapshot=coalesce(NEW.decision_snapshot,'{}'::jsonb)||jsonb_build_object('duplicate',true); END IF;
manual=coalesce((NEW.decision_snapshot->>'manual')::boolean,false);
FOR b IN SELECT * FROM public.budget_limits WHERE enabled AND currency=NEW.currency AND (category='all' OR category=NEW.category) ORDER BY id LOOP
SELECT coalesce(sum(amount),0) INTO used FROM public.invoices WHERE id<>NEW.id AND status='approved' AND currency=b.currency AND (b.category='all' OR category=b.category) AND approved_at>=public.budget_period_start(b.period,t) AND approved_at<=t;
details=details||jsonb_build_array(jsonb_build_object('id',b.id,'label',b.label,'period',b.period,'currency',b.currency,'used',used,'amount',NEW.amount,'limit',b.period_limit,'perPayment',b.per_payment,'humanAbove',b.human_above,'periodStart',public.budget_period_start(b.period,t)));
IF NEW.status='approved' AND (NEW.amount>b.per_payment OR used+NEW.amount>b.period_limit OR (NOT manual AND NEW.amount>b.human_above)) THEN
NEW.status='review'; NEW.explanation_es='Límite de presupuesto o aprobación humana: '||b.label||'. Acumulado '||used||' + factura '||NEW.amount||' '||NEW.currency||'. No se ejecutó ningún pago.'; NEW.explanation_en='Budget limit or human approval threshold: '||b.label||'. Reserved '||used||' + invoice '||NEW.amount||' '||NEW.currency||'. No payment was executed.';
END IF; END LOOP;
NEW.decision_snapshot=coalesce(NEW.decision_snapshot,'{}'::jsonb)||jsonb_build_object('budgets',details,'decidedAt',t);
IF NEW.status='approved' THEN NEW.approved_at=t; ELSE NEW.approved_at=NULL; END IF;
END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.record_invoice_decision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.status IN ('approved','review','rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN INSERT INTO public.invoice_events(invoice_id,actor_id,message_es,message_en) VALUES(NEW.id,coalesce(auth.uid(),NEW.user_id),coalesce(NEW.explanation_es,'Decisión registrada.'),coalesce(NEW.explanation_en,'Decision recorded.')); END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.record_invoice_decision() FROM PUBLIC;
CREATE TRIGGER invoice_decision_record AFTER UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.record_invoice_decision();
CREATE OR REPLACE FUNCTION public.resolve_invoice(_id uuid,_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT public.has_role(auth.uid(),'admin') OR NOT public.has_consent() THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF _status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
UPDATE public.invoices SET status=_status,decision_snapshot=coalesce(decision_snapshot,'{}'::jsonb)||jsonb_build_object('manual',true,'actorId',auth.uid()),explanation_es=CASE WHEN _status='approved' THEN 'Aprobada por finanzas. Ejecución simulada; no se movió dinero.' ELSE 'Frenada por finanzas. No se movió dinero.' END,explanation_en=CASE WHEN _status='approved' THEN 'Finance approved. Simulated execution; no money moved.' ELSE 'Held by finance. No money moved.' END WHERE id=_id AND status='review' AND security_status IS DISTINCT FROM 'blocked' AND (_status='rejected' OR (security_status='passed' AND coalesce((decision_snapshot->>'trustPassed')::boolean,false) AND NOT coalesce((decision_snapshot->>'duplicate')::boolean,false)));
IF NOT FOUND THEN RAISE EXCEPTION 'Invoice needs confirmed supplier data or duplicate resolution'; END IF;
IF _status='approved' AND EXISTS(SELECT 1 FROM public.invoices WHERE id=_id AND status<>'approved') THEN RAISE EXCEPTION 'Hard payment or period budget limit exceeded'; END IF;
END $$;
COMMENT ON COLUMN public.invoices.security_snapshot IS 'DEPRECATED for new challenge decisions: use decision_snapshot for supplier references and policy checks, not fraud certification.';
COMMENT ON COLUMN public.verified_vendors.verified_at IS 'Legacy banking attestation; new challenge approvals require trust_confirmed_at and supplier invoice references.';