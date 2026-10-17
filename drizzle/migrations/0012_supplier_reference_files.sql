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