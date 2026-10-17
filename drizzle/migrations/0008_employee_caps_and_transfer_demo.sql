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
('Demo · empresa USDC','USDC','all','month',2000,1000,10000,NULL),
('Demo · EMPLEADO1 COP','COP','all','month',1000000,500000,1500000,'afb4e063-7740-49b6-ab3c-bc4f3c97f88d'),
('Demo · EMPLEADO2 BRL','BRL','all','month',2000,800,3000,'27a7014a-cfb4-4917-9221-9e3835e32e2f'),
('Demo · EMPLEADO3 USDC','USDC','all','month',600,250,1000,'754a1a28-c3e8-44f3-8f28-bf5baec5bec3'),
('Demo · EMPLEADO4 COP','COP','all','month',700000,300000,1000000,'118c678c-bfcd-40ff-80c9-093e14bb74fd'),
('Demo · EMPLEADO4 BRL','BRL','all','month',1000,500,2000,'118c678c-bfcd-40ff-80c9-093e14bb74fd'),
('Demo · EMPLEADO4 USDC','USDC','all','month',400,200,600,'118c678c-bfcd-40ff-80c9-093e14bb74fd');
INSERT INTO public.payment_rules(label,category,comparison,threshold,currency,action) VALUES
('Demo · software COP','software','under',3000000,'COP','approve'),
('Demo · servicios BRL','other','under',5000,'BRL','approve'),
('Demo · software USDC','software','under',2000,'USDC','approve'),
('Demo · viáticos COP','travel','under',3000000,'COP','approve');
INSERT INTO public.invoices(id,user_id,storage_path,file_name,mime_type,status,vendor,category,amount,currency,invoice_date,due_date,description,invoice_number,test_document,demo_scenario,proposed_channel,proposed_destination,security_snapshot) VALUES
('b1100000-0000-4000-8000-000000000001','afb4e063-7740-49b6-ab3c-bc4f3c97f88d','afb4e063-7740-49b6-ab3c-bc4f3c97f88d/demo/COP-001.pdf','DEMO-COP-001.pdf','application/pdf','pending','Nube Andina · DEMO','software',350000,'COP','2026-10-17','2026-10-31','Licencias del equipo · documento sintético','COP-001',true,true,'bank','Colombia · banco de prueba · ****1101','{"taxId":"DEMO-COP-01"}'),
('b1100000-0000-4000-8000-000000000002','afb4e063-7740-49b6-ab3c-bc4f3c97f88d','afb4e063-7740-49b6-ab3c-bc4f3c97f88d/demo/COP-002.pdf','DEMO-COP-002.pdf','application/pdf','pending','Nube Andina · DEMO','software',750000,'COP','2026-10-17','2026-10-31','Escalar: supera umbral personal de 500000 COP','COP-002',true,true,'bank','Colombia · banco de prueba · ****1101','{"taxId":"DEMO-COP-01"}'),
('b1100000-0000-4000-8000-000000000003','afb4e063-7740-49b6-ab3c-bc4f3c97f88d','afb4e063-7740-49b6-ab3c-bc4f3c97f88d/demo/COP-003.pdf','DEMO-COP-003.pdf','application/pdf','pending','Nube Andina · DEMO','software',1200000,'COP','2026-10-17','2026-10-31','Frenar: supera máximo personal por factura','COP-003',true,true,'bank','Colombia · banco de prueba · ****1101','{"taxId":"DEMO-COP-01"}'),
('b1100000-0000-4000-8000-000000000004','27a7014a-cfb4-4917-9221-9e3835e32e2f','27a7014a-cfb4-4917-9221-9e3835e32e2f/demo/BRL-001.pdf','DEMO-BRL-001.pdf','application/pdf','pending','Estúdio Paulista · DEMO','other',600,'BRL','2026-10-17','2026-10-31','Servicios de operaciones · documento sintético','BRL-001',true,true,'pix','Brasil · clave Pix ficticia DEMO-PIX-02','{"taxId":"DEMO-BRL-02"}'),
('b1100000-0000-4000-8000-000000000005','27a7014a-cfb4-4917-9221-9e3835e32e2f','27a7014a-cfb4-4917-9221-9e3835e32e2f/demo/BRL-002.pdf','DEMO-BRL-002.pdf','application/pdf','pending','Estúdio Paulista · DEMO','other',1200,'BRL','2026-10-17','2026-10-31','Escalar: supera umbral personal de 800 BRL','BRL-002',true,true,'bank','Brasil · TED · banco de prueba · ****2202','{"taxId":"DEMO-BRL-02"}'),
('b1100000-0000-4000-8000-000000000006','754a1a28-c3e8-44f3-8f28-bf5baec5bec3','754a1a28-c3e8-44f3-8f28-bf5baec5bec3/demo/USDC-001.pdf','DEMO-USDC-001.pdf','application/pdf','pending','Atlas Cloud · DEMO','software',200,'USDC','2026-10-17','2026-10-31','Suscripción técnica · documento sintético','USDC-001',true,true,'usdc','USDC · red de prueba · wallet DEMO-3303','{"taxId":"DEMO-USDC-03"}'),
('b1100000-0000-4000-8000-000000000007','754a1a28-c3e8-44f3-8f28-bf5baec5bec3','754a1a28-c3e8-44f3-8f28-bf5baec5bec3/demo/USDC-002.pdf','DEMO-USDC-002.pdf','application/pdf','pending','Atlas Cloud · DEMO','software',650,'USDC','2026-10-17','2026-10-31','Frenar: supera máximo personal de 600 USDC','USDC-002',true,true,'usdc','USDC · red de prueba · wallet DEMO-3303','{"taxId":"DEMO-USDC-03"}'),
('b1100000-0000-4000-8000-000000000008','118c678c-bfcd-40ff-80c9-093e14bb74fd','118c678c-bfcd-40ff-80c9-093e14bb74fd/demo/COP-004.pdf','DEMO-COP-004.pdf','application/pdf','pending','Viajes Capital · DEMO','travel',280000,'COP','2026-10-17','2026-10-31','Viáticos locales · documento sintético','TRV-001',true,true,'bank','Colombia · banco de prueba · ****4404','{"taxId":"DEMO-TRV-04"}'),
('b1100000-0000-4000-8000-000000000009','118c678c-bfcd-40ff-80c9-093e14bb74fd','118c678c-bfcd-40ff-80c9-093e14bb74fd/demo/USDC-003.pdf','DEMO-USDC-003.pdf','application/pdf','pending','Proveedor pendiente · DEMO','software',150,'USDC','2026-10-17','2026-10-31','Escalar: proveedor sin referencia confirmada','NEW-001',true,true,'usdc','USDC · red de prueba · wallet DEMO-4404','{"taxId":"DEMO-UNKNOWN"}');