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