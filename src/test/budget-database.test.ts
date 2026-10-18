import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
// Exercises the installed database guard, not a copy of its calculation.
const connection = process.env["SUPABASE_DB_URL"];
describe.skipIf(!connection)("atomic approved-decision reservations", () => {
  // Vitest still collects a skipped suite, so only build clients when a database is configured.
  const sql = connection
    ? postgres(connection, { max: 4 })
    : (null as unknown as ReturnType<typeof postgres>);
  const admin = connection
    ? createClient(
        process.env["SUPABASE_URL"] ?? "",
        process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "",
        {
          auth: { persistSession: false },
        },
      )
    : (null as unknown as ReturnType<typeof createClient>);
  let owner = "";
  let vendor = "";
  let confirmed = "";
  let budget = "";
  const ids: string[] = [];
  const tag = `TEST-BUDGET-${Date.now()}`;
  beforeAll(async () => {
    const session = JSON.parse(process.env["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"] ?? "{}");
    if (!session.user?.id) throw new Error("Injected owner session required");
    const [user] =
      await sql`select c.user_id from public.consents c join public.user_roles r on r.user_id=c.user_id where r.role='admin' and c.user_id=${session.user.id}`;
    if (!user) throw new Error("Consented admin required for database verification");
    owner = String(user["user_id"]);
    await sql.begin(async (tx) => {
      await tx`select set_config('request.jwt.claim.sub',${owner},true)`;
      const [v] =
        await tx`insert into public.verified_vendors(name,tax_id,invoice_prefix,reference_invoice_number,format_notes,expected_category,expected_currency,confirmation_channel,trust_confirmed_at) values(${tag},'SYNTHETIC-TAX','TEST-','TEST-001','Synthetic software reference','software','USDC','test',now()) returning id,trust_confirmed_at::text`;
      if (!v) throw new Error("Missing test supplier");
      vendor = String(v["id"]);
      confirmed = String(v["trust_confirmed_at"]);
    });
    const [b] =
      await sql`insert into public.budget_limits(label,currency,category,period,per_payment,human_above,period_limit) values(${tag},'USDC','software','month',100,100,100) returning id`;
    if (!b) throw new Error("Missing test budget");
    budget = String(b["id"]);
  });
  async function invoice(number: string, amount: number) {
    const [i] =
      await sql`insert into public.invoices(user_id,storage_path,file_name,mime_type,status,test_document) values(${owner},${`${owner}/${tag}/${number}`},${tag},'application/pdf','processing',true) returning id`;
    if (!i) throw new Error("Missing test invoice");
    ids.push(String(i["id"]));
    return { id: String(i["id"]), amount, number };
  }
  async function approve(i: { id: string; amount: number; number: string }) {
    const { data, error } = await admin
      .from("invoices")
      .update({
        status: "approved",
        security_status: "passed",
        vendor: tag,
        matched_merchant: tag,
        invoice_number: i.number,
        amount: i.amount,
        currency: "USDC",
        category: "software",
        due_date: "2026-10-31",
        invoice_date: "2026-10-17",
        decision_snapshot: {
          trustPassed: true,
          supplierId: vendor,
          supplierConfirmedAt: confirmed,
        },
        explanation_es: "Prueba sintética",
        explanation_en: "Synthetic test",
      })
      .eq("id", i?.["id"])
      .select("status,decision_snapshot")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Missing approval");
    return data;
  }
  it("serializes simultaneous approvals so 60 + 60 never exceeds 100", async () => {
    const a = await invoice("TEST-101", 60);
    const b = await invoice("TEST-102", 60);
    const results = await Promise.all([approve(a), approve(b)]);
    expect(results.map((r) => r.status).sort()).toEqual(["approved", "review"]);
    const [total] =
      await sql`select sum(amount)::float8 n from public.invoices where id=any(${ids}) and status='approved'`;
    expect(total?.["n"]).toBe(60);
    const [events] =
      await sql`select count(*)::int n from public.invoice_events where invoice_id=any(${ids})`;
    expect(events?.["n"]).toBe(2);
    const held = results.find((r) => r.status === "review");
    expect(
      held?.decision_snapshot.budgets.find((b: { id: string }) => b?.["id"] === budget).used,
    ).toBe(60);
  });
  it("manual approval cannot bypass a hard period limit", async () => {
    const [held] =
      await sql`select id from public.invoices where id=any(${ids}) and status='review'`;
    const session = JSON.parse(process.env["LOVABLE_BROWSER_SUPABASE_SESSION_JSON"] ?? "{}");
    if (!session.access_token) throw new Error("Injected owner session required");
    const caller = createClient(
      process.env["SUPABASE_URL"] ?? "",
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "",
      {
        auth: { persistSession: false, storageKey: "budget-test-caller" },
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
      },
    );
    const { error } = await caller.rpc("resolve_invoice", {
      _id: held?.["id"],
      _status: "approved",
    });
    expect(error?.message).toContain("Hard payment or period budget limit exceeded");
  });
  it("Bogotá half-month boundaries begin on the first or sixteenth", async () => {
    const [r] =
      await sql`select public.budget_period_start('half_month','2026-10-16T04:59:59Z')::text a,public.budget_period_start('half_month','2026-10-16T05:00:00Z')::text b`;
    expect(new Date(r?.["a"]).toISOString()).toBe("2026-10-01T05:00:00.000Z");
    expect(new Date(r?.["b"]).toISOString()).toBe("2026-10-16T05:00:00.000Z");
  });
  it("combines company caps with employee-only reservations without counting coworkers against the personal cap", async () => {
    const target = "afb4e063-7740-49b6-ab3c-bc4f3c97f88d";
    const coworker = "27a7014a-cfb4-4917-9221-9e3835e32e2f";
    const [company] =
      await sql`insert into public.budget_limits(label,currency,category,period,per_payment,human_above,period_limit) values(${tag + "-COMPANY"},'BRL','marketing','month',1000,1000,1000) returning id`;
    const [personal] =
      await sql`insert into public.budget_limits(label,currency,category,period,per_payment,human_above,period_limit,employee_id) values(${tag + "-PERSONAL"},'BRL','marketing','month',100,100,100,${target}) returning id`;
    const [other] =
      await sql`insert into public.budget_limits(label,currency,category,period,per_payment,human_above,period_limit,employee_id) values(${tag + "-OTHER"},'BRL','marketing','month',1000,1000,1000,${coworker}) returning id`;
    async function submit(user: string, amount: number, number: string) {
      const [i] =
        await sql`insert into public.invoices(user_id,storage_path,file_name,mime_type,status,test_document) values(${user},${`${user}/${tag}/${number}`},${tag},'application/pdf','processing',true) returning id`;
      if (!i) throw new Error("Missing employee invoice");
      ids.push(String(i["id"]));
      const { data, error } = await admin
        .from("invoices")
        .update({
          status: "approved",
          security_status: "passed",
          vendor: tag,
          matched_merchant: tag,
          invoice_number: number,
          amount,
          currency: "BRL",
          category: "marketing",
          due_date: "2026-10-31",
          invoice_date: "2026-10-17",
          decision_snapshot: {
            trustPassed: true,
            supplierId: vendor,
            supplierConfirmedAt: confirmed,
          },
          explanation_es: "Prueba de topes",
          explanation_en: "Employee cap test",
        })
        .eq("id", String(i["id"]))
        .select("status,decision_snapshot")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Missing employee approval");
      return data;
    }
    expect((await submit(coworker, 80, "TEST-EMP-OTHER")).status).toBe("approved");
    const first = await submit(target, 60, "TEST-EMP-FIRST");
    expect(first.status).toBe("approved");
    const details = first.decision_snapshot as {
      budgets: { id: string; used: number; employeeId: string | null }[];
    };
    expect(details.budgets.find((b) => b.id === company?.["id"])?.used).toBe(80);
    expect(details.budgets.find((b) => b.id === personal?.["id"])?.used).toBe(0);
    expect(details.budgets.some((b) => b.id === other?.["id"])).toBe(false);
    const second = await submit(target, 60, "TEST-EMP-SECOND");
    expect(second.status).toBe("review");
    const held = second.decision_snapshot as { budgets: { id: string; used: number }[] };
    expect(held.budgets.find((b) => b.id === personal?.["id"])?.used).toBe(60);
    expect(held.budgets.find((b) => b.id === company?.["id"])?.used).toBe(140);
  });
  afterAll(async () => {
    // Also removes fixtures left by an interrupted prior test, never user data.
    const { data: rows } = await admin
      .from("invoices")
      .select("id")
      .like("file_name", "TEST-BUDGET-%");
    for (const row of rows ?? []) {
      await admin.from("invoice_events").delete().eq("invoice_id", row.id);
      await admin.from("invoices").delete().eq("id", row.id);
    }
    await admin.from("budget_limits").delete().like("label", "TEST-BUDGET-%");
    const { data: vendors } = await admin
      .from("verified_vendors")
      .select("id")
      .like("name", "TEST-BUDGET-%");
    for (const v of vendors ?? []) {
      await admin.from("supplier_attestations").delete().eq("vendor_id", v?.["id"]);
      await admin.from("verified_vendors").delete().eq("id", v?.["id"]);
    }
    await sql.end();
  });
});
