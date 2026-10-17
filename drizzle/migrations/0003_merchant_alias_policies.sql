ALTER TABLE public.verified_vendors ADD COLUMN disposition text NOT NULL DEFAULT 'allowed';
ALTER TABLE public.verified_vendors ADD COLUMN aliases text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.verified_vendors ADD CONSTRAINT merchant_disposition_valid CHECK (disposition IN ('allowed','blocked'));
ALTER TABLE public.verified_vendors ADD CONSTRAINT merchant_alias_count CHECK (cardinality(aliases) <= 20);
COMMENT ON COLUMN public.verified_vendors.aliases IS 'Admin-confirmed exact merchant aliases; a trailing * explicitly opts into prefix matching. Conflicting identities require review.';
ALTER TABLE public.invoices ADD COLUMN matched_merchant text;
COMMENT ON COLUMN public.invoices.matched_merchant IS 'Canonical merchant matched by deterministic alias rules at evaluation time. Original vendor text remains unchanged.';