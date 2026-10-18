-- WinkWink · configuración completa de la base de datos para un proyecto nuevo de Supabase.
-- Pégalo entero en Supabase → SQL Editor → New query → Run. Es seguro ejecutarlo una sola vez.

-- ===== 0000_winkwink_private_invoices =====
CREATE TYPE public.app_role AS ENUM ('admin','employee');
CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name)<=100));
GRANT SELECT, UPDATE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_roles (user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, role public.app_role NOT NULL DEFAULT 'employee', PRIMARY KEY(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE POLICY own_role ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY profile_read ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY profile_update ON public.profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE FUNCTION public.create_winkwink_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.profiles(id,display_name) VALUES(NEW.id,left(coalesce(NEW.raw_user_meta_data->>'display_name',''),100)); INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'employee'); RETURN NEW; END $$;
CREATE TRIGGER winkwink_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_winkwink_profile();
CREATE TABLE public.consents (user_id uuid PRIMARY KEY, terms_version text NOT NULL CHECK(terms_version='2026-10-17'), accepted_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT ON public.consents TO authenticated; GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY consent_read ON public.consents FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY consent_create ON public.consents FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE FUNCTION public.has_consent() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.consents WHERE user_id=auth.uid() AND terms_version='2026-10-17') $$;
CREATE TABLE public.payment_rules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), label text NOT NULL CHECK(char_length(label) BETWEEN 1 AND 120), category text NOT NULL CHECK(category IN ('software','travel','marketing','other','unknown')), comparison text NOT NULL CHECK(comparison IN ('under','over','always')), threshold numeric NOT NULL DEFAULT 0 CHECK(threshold>=0), currency text NOT NULL DEFAULT 'USD' CHECK(currency IN ('USD','COP','EUR')), action text NOT NULL CHECK(action IN ('approve','review')), enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.payment_rules TO authenticated; GRANT ALL ON public.payment_rules TO service_role;
ALTER TABLE public.payment_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY rules_admin ON public.payment_rules FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin') AND public.has_consent()) WITH CHECK(public.has_role(auth.uid(),'admin') AND public.has_consent());
CREATE TABLE public.verified_vendors(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL UNIQUE CHECK(char_length(name) BETWEEN 1 AND 120));
GRANT SELECT,INSERT,DELETE ON public.verified_vendors TO authenticated; GRANT ALL ON public.verified_vendors TO service_role;
ALTER TABLE public.verified_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_admin ON public.verified_vendors FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin') AND public.has_consent()) WITH CHECK(public.has_role(auth.uid(),'admin') AND public.has_consent());
CREATE TABLE public.invoices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), storage_path text NOT NULL UNIQUE, file_name text NOT NULL CHECK(char_length(file_name) BETWEEN 1 AND 200), mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','image/jpeg','image/png','image/webp')), created_at timestamptz NOT NULL DEFAULT now(), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','approved','review','rejected','error')), vendor text, category text, amount numeric, currency text, invoice_date text, description text, explanation_es text, explanation_en text, error_message text, upload_authorized_at timestamptz NOT NULL DEFAULT now(), policy_version text NOT NULL DEFAULT '2026-10-17', test_document boolean NOT NULL DEFAULT true);
GRANT SELECT ON public.invoices TO authenticated;
GRANT INSERT(user_id,storage_path,file_name,mime_type,test_document) ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_read ON public.invoices FOR SELECT TO authenticated USING(public.has_consent() AND (user_id=auth.uid() OR public.has_role(auth.uid(),'admin')));
CREATE POLICY invoice_create ON public.invoices FOR INSERT TO authenticated WITH CHECK(public.has_consent() AND user_id=auth.uid() AND storage_path LIKE auth.uid()::text || '/%' AND test_document=true);
CREATE INDEX invoices_owner ON public.invoices(user_id,created_at DESC);
CREATE TABLE public.invoice_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id uuid NOT NULL REFERENCES public.invoices(id), actor_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), message_es text NOT NULL, message_en text NOT NULL);
GRANT SELECT ON public.invoice_events TO authenticated; GRANT ALL ON public.invoice_events TO service_role;
ALTER TABLE public.invoice_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_read ON public.invoice_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.invoices WHERE id=invoice_id));
CREATE TABLE public.privacy_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,kind text NOT NULL CHECK(kind IN ('access','correction','deletion','revocation','complaint')),message text NOT NULL CHECK(char_length(message) BETWEEN 1 AND 2000),created_at timestamptz NOT NULL DEFAULT now(),status text NOT NULL DEFAULT 'open');
GRANT SELECT,INSERT ON public.privacy_requests TO authenticated; GRANT ALL ON public.privacy_requests TO service_role;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY privacy_read ON public.privacy_requests FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY privacy_insert ON public.privacy_requests FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE TABLE public.ai_access_state(id boolean PRIMARY KEY DEFAULT true CHECK(id),blocked boolean NOT NULL DEFAULT false,message text);
GRANT ALL ON public.ai_access_state TO service_role;
ALTER TABLE public.ai_access_state ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.resolve_invoice(_id uuid,_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.has_role(auth.uid(),'admin') OR NOT public.has_consent() THEN RAISE EXCEPTION 'Forbidden'; END IF; IF _status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF; UPDATE public.invoices SET status=_status WHERE id=_id AND status='review'; IF NOT FOUND THEN RAISE EXCEPTION 'Invoice is not awaiting review'; END IF; INSERT INTO public.invoice_events(invoice_id,actor_id,message_es,message_en) VALUES(_id,auth.uid(),CASE WHEN _status='approved' THEN 'Aprobada manualmente. No se ejecutó ningún pago.' ELSE 'Rechazada manualmente.' END,CASE WHEN _status='approved' THEN 'Manually approved. No payment was executed.' ELSE 'Manually rejected.' END); END $$;
REVOKE ALL ON FUNCTION public.resolve_invoice(uuid,text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.resolve_invoice(uuid,text) TO authenticated;
CREATE POLICY original_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='invoice-originals' AND (storage.foldername(name))[1]=auth.uid()::text AND public.has_consent());
CREATE POLICY original_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='invoice-originals' AND public.has_consent() AND ((storage.foldername(name))[1]=auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY original_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='invoice-originals' AND (storage.foldername(name))[1]=auth.uid()::text AND NOT EXISTS(SELECT 1 FROM public.invoices WHERE storage_path=name));

-- ===== 0001_invoice_insert_identifier =====
GRANT INSERT(id) ON public.invoices TO authenticated;

-- ===== 0002_invoice_document_number =====
ALTER TABLE public.invoices ADD COLUMN invoice_number text;
COMMENT ON COLUMN public.invoices.invoice_number IS 'Invoice identifier extracted from the original document; null when not readable or absent.';

-- ===== 0003_merchant_alias_policies =====
ALTER TABLE public.verified_vendors ADD COLUMN disposition text NOT NULL DEFAULT 'allowed';
ALTER TABLE public.verified_vendors ADD COLUMN aliases text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.verified_vendors ADD CONSTRAINT merchant_disposition_valid CHECK (disposition IN ('allowed','blocked'));
ALTER TABLE public.verified_vendors ADD CONSTRAINT merchant_alias_count CHECK (cardinality(aliases) <= 20);
COMMENT ON COLUMN public.verified_vendors.aliases IS 'Admin-confirmed exact merchant aliases; a trailing * explicitly opts into prefix matching. Conflicting identities require review.';
ALTER TABLE public.invoices ADD COLUMN matched_merchant text;
COMMENT ON COLUMN public.invoices.matched_merchant IS 'Canonical merchant matched by deterministic alias rules at evaluation time. Original vendor text remains unchanged.';

-- ===== 0004_invoice_security_scan =====
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

-- ===== 0005_trusted_suppliers_and_atomic_budgets =====
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

-- ===== 0006_validate_trust_and_rule_snapshots =====
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

-- ===== 0007_approval_reservation_clock =====
CREATE OR REPLACE FUNCTION public.guard_invoice_security() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE b record; used numeric; details jsonb='[]'::jsonb; manual boolean; t timestamptz; BEGIN
IF OLD.security_status='blocked' AND NEW.status='approved' THEN RAISE EXCEPTION 'Previously security-blocked invoice requires separate investigation'; END IF;
IF NEW.status='approved' THEN IF NEW.security_status IS DISTINCT FROM 'passed' OR coalesce((NEW.decision_snapshot->>'trustPassed')::boolean,false)=false OR NEW.amount IS NULL OR NEW.amount<0 OR NEW.currency IS NULL OR NEW.due_date IS NULL THEN RAISE EXCEPTION 'Confirmed supplier and complete invoice required'; END IF; END IF;
IF NEW.status IN ('approved','review','rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
PERFORM pg_advisory_xact_lock(hashtextextended('winkwink-budget',0)); t=clock_timestamp();
IF NEW.invoice_number IS NOT NULL AND NEW.matched_merchant IS NOT NULL AND EXISTS(SELECT 1 FROM public.invoices i WHERE i.id<>NEW.id AND lower(i.matched_merchant)=lower(NEW.matched_merchant) AND upper(btrim(i.invoice_number))=upper(btrim(NEW.invoice_number)) AND i.status IN ('approved','review')) THEN NEW.status='review'; NEW.explanation_es='Factura duplicada: revisión humana necesaria. No se ejecutó ningún pago.'; NEW.explanation_en='Duplicate invoice: human review required. No payment was executed.'; NEW.decision_snapshot=coalesce(NEW.decision_snapshot,'{}'::jsonb)||jsonb_build_object('duplicate',true); END IF;
manual=coalesce((NEW.decision_snapshot->>'manual')::boolean,false);
FOR b IN SELECT * FROM public.budget_limits WHERE enabled AND currency=NEW.currency AND (category='all' OR category=NEW.category) ORDER BY id LOOP
SELECT coalesce(sum(amount),0) INTO used FROM public.invoices WHERE id<>NEW.id AND status='approved' AND currency=b.currency AND (b.category='all' OR category=b.category) AND approved_at>=public.budget_period_start(b.period,t);
details=details||jsonb_build_array(jsonb_build_object('id',b.id,'label',b.label,'period',b.period,'currency',b.currency,'used',used,'amount',NEW.amount,'limit',b.period_limit,'perPayment',b.per_payment,'humanAbove',b.human_above,'periodStart',public.budget_period_start(b.period,t)));
IF NEW.status='approved' AND (NEW.amount>b.per_payment OR used+NEW.amount>b.period_limit OR (NOT manual AND NEW.amount>b.human_above)) THEN NEW.status='review'; NEW.explanation_es='Límite de presupuesto o aprobación humana: '||b.label||'. Acumulado '||used||' + factura '||NEW.amount||' '||NEW.currency||'. No se ejecutó ningún pago.'; NEW.explanation_en='Budget limit or human approval threshold: '||b.label||'. Reserved '||used||' + invoice '||NEW.amount||' '||NEW.currency||'. No payment was executed.'; END IF; END LOOP;
NEW.decision_snapshot=coalesce(NEW.decision_snapshot,'{}'::jsonb)||jsonb_build_object('budgets',details,'decidedAt',t);
IF NEW.status='approved' THEN NEW.approved_at=t; ELSE NEW.approved_at=NULL; END IF;
END IF; RETURN NEW; END $$;

-- ===== 0008_employee_caps_and_transfer_demo =====
ALTER TABLE public.budget_limits ADD COLUMN employee_id uuid REFERENCES public.profiles(id);
CREATE INDEX budget_employee_scope ON public.budget_limits(employee_id) WHERE employee_id IS NOT NULL;
ALTER TABLE public.profiles ADD COLUMN demo_employee boolean NOT NULL DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN demo_scenario boolean NOT NULL DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN proposed_channel text;
ALTER TABLE public.invoices ADD COLUMN proposed_destination text;
CREATE POLICY personal_budget_read ON public.budget_limits FOR SELECT TO authenticated USING (employee_id=auth.uid() AND public.has_consent());
CREATE OR REPLACE FUNCTION public.guard_invoice_security() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE b record; used numeric; details jsonb='[]'::jsonb; manual boolean; t timestamptz; hard boolean; BEGIN
IF OLD.security_status='blocked' AND NEW.status='approved' THEN RAISE EXCEPTION 'Previously security-blocked invoice requires separate investigation'; END IF;
IF NEW.status='approved' THEN IF NEW.security_status IS DISTINCT FROM 'passed' OR coalesce((NEW.decision_snapshot->>'trustPassed')::boolean,false)=false OR NEW.amount IS NULL OR NEW.amount<0 OR NEW.currency IS NULL OR NEW.due_date IS NULL THEN RAISE EXCEPTION 'Confirmed supplier and complete invoice required'; END IF; END IF;
IF NEW.status IN ('approved','review','rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
PERFORM pg_advisory_xact_lock(hashtextextended('winkwink-budget',0)); t=clock_timestamp();
IF NEW.invoice_number IS NOT NULL AND NEW.matched_merchant IS NOT NULL AND EXISTS(SELECT 1 FROM public.invoices i WHERE i.id<>NEW.id AND lower(i.matched_merchant)=lower(NEW.matched_merchant) AND upper(btrim(i.invoice_number))=upper(btrim(NEW.invoice_number)) AND i.status IN ('approved','review')) THEN NEW.status='review'; NEW.explanation_es='Factura duplicada: revisión humana necesaria. No se ejecutó ningún pago.'; NEW.explanation_en='Duplicate invoice: human review required. No payment was executed.'; NEW.decision_snapshot=coalesce(NEW.decision_snapshot,'{}'::jsonb)||jsonb_build_object('duplicate',true); END IF;
manual=coalesce((NEW.decision_snapshot->>'manual')::boolean,false);
FOR b IN SELECT * FROM public.budget_limits WHERE enabled AND currency=NEW.currency AND (category='all' OR category=NEW.category) AND (employee_id IS NULL OR employee_id=NEW.user_id) ORDER BY employee_id NULLS FIRST,id LOOP
SELECT coalesce(sum(i.amount),0) INTO used FROM public.invoices i WHERE i.id<>NEW.id AND i.status='approved' AND i.currency=b.currency AND (b.category='all' OR i.category=b.category) AND (b.employee_id IS NULL OR i.user_id=b.employee_id) AND i.approved_at>=public.budget_period_start(b.period,t);
details=details||jsonb_build_array(jsonb_build_object('id',b.id,'label',b.label,'employeeId',b.employee_id,'period',b.period,'currency',b.currency,'used',used,'amount',NEW.amount,'limit',b.period_limit,'perPayment',b.per_payment,'humanAbove',b.human_above,'periodStart',public.budget_period_start(b.period,t)));
hard=NEW.amount>b.per_payment OR used+NEW.amount>b.period_limit;
IF NEW.status='approved' AND (hard OR (NOT manual AND NEW.amount>b.human_above)) THEN NEW.status='review'; NEW.explanation_es=CASE WHEN hard THEN 'Frenada por tope duro: ' ELSE 'Escalada para aprobación humana: ' END||b.label||'. Acumulado '||used||' + factura '||NEW.amount||' '||NEW.currency||'. No se ejecutó ningún pago.'; NEW.explanation_en=CASE WHEN hard THEN 'Held by hard cap: ' ELSE 'Escalated for human approval: ' END||b.label||'. Reserved '||used||' + invoice '||NEW.amount||' '||NEW.currency||'. No payment was executed.'; NEW.decision_snapshot=coalesce(NEW.decision_snapshot,'{}'::jsonb)||jsonb_build_object('budgetOutcome',CASE WHEN hard THEN 'hold' ELSE 'escalate' END); END IF; END LOOP;
NEW.decision_snapshot=coalesce(NEW.decision_snapshot,'{}'::jsonb)||jsonb_build_object('budgets',details,'decidedAt',t);
IF NEW.status='approved' THEN NEW.approved_at=t; ELSE NEW.approved_at=NULL; END IF;
END IF; RETURN NEW; END $$;
INSERT INTO public.budget_limits(label,currency,category,period,per_payment,human_above,period_limit,employee_id) VALUES
('Demo · empresa COP','COP','all','month',3000000,2000000,10000000,NULL),
('Demo · empresa BRL','BRL','all','month',5000,3000,20000,NULL),
('Demo · empresa USDC','USDC','all','month',2000,1000,10000,NULL);
INSERT INTO public.payment_rules(label,category,comparison,threshold,currency,action) VALUES
('Demo · software COP','software','under',3000000,'COP','approve'),
('Demo · servicios BRL','other','under',5000,'BRL','approve'),
('Demo · software USDC','software','under',2000,'USDC','approve'),
('Demo · viáticos COP','travel','under',3000000,'COP','approve');
-- (Datos demo del proyecto Lovable omitidos: dependían de usuarios que no existen en este proyecto.)

-- ===== 0009_protect_synthetic_demo_markers =====
CREATE OR REPLACE FUNCTION public.protect_demo_markers() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF coalesce(auth.role(),'') <> 'service_role' AND session_user NOT IN ('postgres','supabase_admin') THEN
IF TG_TABLE_NAME='profiles' AND NEW.demo_employee IS DISTINCT FROM OLD.demo_employee THEN RAISE EXCEPTION 'Synthetic account marker is operator-managed'; END IF;
IF TG_TABLE_NAME='invoices' THEN
IF TG_OP='INSERT' AND NEW.demo_scenario THEN RAISE EXCEPTION 'Synthetic scenarios are operator-managed'; END IF;
IF TG_OP='UPDATE' AND NEW.demo_scenario IS DISTINCT FROM OLD.demo_scenario THEN RAISE EXCEPTION 'Synthetic scenarios are operator-managed'; END IF;
END IF;
END IF; RETURN NEW; END $$;
CREATE TRIGGER protect_profile_demo BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_demo_markers();
CREATE TRIGGER protect_invoice_demo BEFORE INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.protect_demo_markers();

-- ===== 0010_demo_marker_guard_request_claims =====
CREATE OR REPLACE FUNCTION public.protect_demo_markers() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE caller_role text; BEGIN
caller_role=coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','');
IF caller_role <> 'service_role' AND session_user NOT IN ('postgres','supabase_admin') THEN
IF TG_TABLE_NAME='profiles' AND NEW.demo_employee IS DISTINCT FROM OLD.demo_employee THEN RAISE EXCEPTION 'Synthetic account marker is operator-managed'; END IF;
IF TG_TABLE_NAME='invoices' THEN
IF TG_OP='INSERT' AND NEW.demo_scenario THEN RAISE EXCEPTION 'Synthetic scenarios are operator-managed'; END IF;
IF TG_OP='UPDATE' AND NEW.demo_scenario IS DISTINCT FROM OLD.demo_scenario THEN RAISE EXCEPTION 'Synthetic scenarios are operator-managed'; END IF;
END IF;
END IF; RETURN NEW; END $$;

-- ===== 0011_demo_marker_table_specific_guards =====
CREATE OR REPLACE FUNCTION public.protect_demo_markers() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE caller_role text; BEGIN
caller_role=coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','');
IF caller_role <> 'service_role' AND session_user NOT IN ('postgres','supabase_admin') THEN
IF TG_TABLE_NAME='profiles' THEN
IF NEW.demo_employee IS DISTINCT FROM OLD.demo_employee THEN RAISE EXCEPTION 'Synthetic account marker is operator-managed'; END IF;
ELSIF TG_TABLE_NAME='invoices' THEN
IF TG_OP='INSERT' THEN
IF NEW.demo_scenario THEN RAISE EXCEPTION 'Synthetic scenarios are operator-managed'; END IF;
ELSIF TG_OP='UPDATE' THEN
IF NEW.demo_scenario IS DISTINCT FROM OLD.demo_scenario THEN RAISE EXCEPTION 'Synthetic scenarios are operator-managed'; END IF;
END IF;
END IF;
END IF; RETURN NEW; END $$;

-- ===== 0012_supplier_reference_files =====
CREATE TABLE public.supplier_reference_files (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid NOT NULL REFERENCES public.verified_vendors(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id), storage_path text NOT NULL UNIQUE, file_name text NOT NULL CHECK(char_length(file_name) BETWEEN 1 AND 200), mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','image/jpeg','image/png','image/webp')),
 kind text NOT NULL CHECK(kind IN ('invoice','qr')), test_document boolean NOT NULL DEFAULT true CHECK(test_document), created_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','ready','error')), metadata jsonb, ai_usage jsonb, error_message text
);
GRANT SELECT, DELETE ON public.supplier_reference_files TO authenticated;
GRANT ALL ON public.supplier_reference_files TO service_role;
ALTER TABLE public.supplier_reference_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY supplier_files_admin_read ON public.supplier_reference_files FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin') AND public.has_consent());
CREATE POLICY supplier_files_admin_delete ON public.supplier_reference_files FOR DELETE TO authenticated USING(public.has_role(auth.uid(),'admin') AND public.has_consent());
CREATE INDEX supplier_files_vendor ON public.supplier_reference_files(vendor_id,created_at);
CREATE FUNCTION public.invalidate_supplier_file_confirmation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
UPDATE public.verified_vendors SET trust_confirmed_at=NULL,trust_confirmed_by=NULL WHERE id=CASE WHEN TG_OP='DELETE' THEN OLD.vendor_id ELSE NEW.vendor_id END;
IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER supplier_file_changed AFTER INSERT OR UPDATE OR DELETE ON public.supplier_reference_files FOR EACH ROW EXECUTE FUNCTION public.invalidate_supplier_file_confirmation();
CREATE FUNCTION public.require_ready_supplier_files() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.trust_confirmed_at IS NOT NULL AND (TG_OP='INSERT' OR NEW.trust_confirmed_at IS DISTINCT FROM OLD.trust_confirmed_at) AND EXISTS(SELECT 1 FROM public.supplier_reference_files WHERE vendor_id=NEW.id AND (status<>'ready' OR metadata IS NULL OR coalesce((metadata->>'uncertain')::boolean,true))) THEN RAISE EXCEPTION 'Supplier reference files require complete review before confirmation'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER supplier_files_confirmation_guard BEFORE INSERT OR UPDATE ON public.verified_vendors FOR EACH ROW EXECUTE FUNCTION public.require_ready_supplier_files();

-- ===== 0013_complete_supplier_reference_guard =====
CREATE OR REPLACE FUNCTION public.require_ready_supplier_files() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.trust_confirmed_at IS NOT NULL AND (TG_OP='INSERT' OR NEW.trust_confirmed_at IS DISTINCT FROM OLD.trust_confirmed_at) AND EXISTS(SELECT 1 FROM public.supplier_reference_files WHERE vendor_id=NEW.id AND (status<>'ready' OR metadata IS NULL OR coalesce((metadata->>'uncertain')::boolean,true) OR (kind='invoice' AND (NOT coalesce((metadata->>'isInvoice')::boolean,false) OR nullif(btrim(metadata->>'taxId'),'') IS NULL OR nullif(btrim(metadata->>'invoiceNumber'),'') IS NULL OR (metadata->>'invoiceNumber') !~ '^.*[^0-9][0-9]+$' OR metadata->>'category' IS DISTINCT FROM NEW.expected_category OR metadata->>'currency' IS DISTINCT FROM NEW.expected_currency OR lower(regexp_replace(metadata->>'taxId','[[:space:]-]','','g')) IS DISTINCT FROM lower(regexp_replace(NEW.tax_id,'[[:space:]-]','','g')))))) THEN RAISE EXCEPTION 'Supplier reference files require complete matching fields before confirmation'; END IF;
RETURN NEW; END $$;
ALTER POLICY original_delete ON storage.objects USING(bucket_id='invoice-originals' AND (storage.foldername(name))[1]=auth.uid()::text AND NOT EXISTS(SELECT 1 FROM public.invoices WHERE storage_path=name) AND NOT EXISTS(SELECT 1 FROM public.supplier_reference_files WHERE storage_path=name));

-- ===== Almacenamiento privado de facturas originales =====
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoice-originals', 'invoice-originals', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
