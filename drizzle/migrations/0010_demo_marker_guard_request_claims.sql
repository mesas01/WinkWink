CREATE OR REPLACE FUNCTION public.protect_demo_markers() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE caller_role text; BEGIN
caller_role=coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','');
IF caller_role <> 'service_role' AND session_user NOT IN ('postgres','supabase_admin') THEN
IF TG_TABLE_NAME='profiles' AND NEW.demo_employee IS DISTINCT FROM OLD.demo_employee THEN RAISE EXCEPTION 'Synthetic account marker is operator-managed'; END IF;
IF TG_TABLE_NAME='invoices' THEN
IF TG_OP='INSERT' AND NEW.demo_scenario THEN RAISE EXCEPTION 'Synthetic scenarios are operator-managed'; END IF;
IF TG_OP='UPDATE' AND NEW.demo_scenario IS DISTINCT FROM OLD.demo_scenario THEN RAISE EXCEPTION 'Synthetic scenarios are operator-managed'; END IF;
END IF;
END IF; RETURN NEW; END $$;