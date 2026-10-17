// Synthetic documents, not merchant-issued invoices. All tax identifiers deliberately invalid.
import assetCO_1_1 from "@/assets/test-invoices/CO-1-1.pdf.asset.json";
import assetCO_1_2 from "@/assets/test-invoices/CO-1-2.pdf.asset.json";
import assetCO_2_1 from "@/assets/test-invoices/CO-2-1.pdf.asset.json";
import assetCO_2_2 from "@/assets/test-invoices/CO-2-2.pdf.asset.json";
import assetCO_3_1 from "@/assets/test-invoices/CO-3-1.pdf.asset.json";
import assetCO_3_2 from "@/assets/test-invoices/CO-3-2.pdf.asset.json";
import assetCO_4_1 from "@/assets/test-invoices/CO-4-1.pdf.asset.json";
import assetCO_4_2 from "@/assets/test-invoices/CO-4-2.pdf.asset.json";
import assetCO_5_1 from "@/assets/test-invoices/CO-5-1.pdf.asset.json";
import assetCO_5_2 from "@/assets/test-invoices/CO-5-2.pdf.asset.json";
import assetBR_1_1 from "@/assets/test-invoices/BR-1-1.pdf.asset.json";
import assetBR_1_2 from "@/assets/test-invoices/BR-1-2.pdf.asset.json";
import assetBR_2_1 from "@/assets/test-invoices/BR-2-1.pdf.asset.json";
import assetBR_2_2 from "@/assets/test-invoices/BR-2-2.pdf.asset.json";
import assetBR_3_1 from "@/assets/test-invoices/BR-3-1.pdf.asset.json";
import assetBR_3_2 from "@/assets/test-invoices/BR-3-2.pdf.asset.json";
import assetBR_4_1 from "@/assets/test-invoices/BR-4-1.pdf.asset.json";
import assetBR_4_2 from "@/assets/test-invoices/BR-4-2.pdf.asset.json";
import assetBR_5_1 from "@/assets/test-invoices/BR-5-1.pdf.asset.json";
import assetBR_5_2 from "@/assets/test-invoices/BR-5-2.pdf.asset.json";
export const testInvoices = [
  { ...{"country": "CO", "vendor": "AWS", "supplierName": "AWS DEMO CO", "taxId": "TEST-CO-1-INVALID", "invoiceNumber": "CO1-001", "prefix": "CO1-", "currency": "COP", "amount": 180000, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-1-1"}, url: assetCO_1_1.url },
  { ...{"country": "CO", "vendor": "AWS", "supplierName": "AWS DEMO CO", "taxId": "TEST-CO-1-INVALID", "invoiceNumber": "CO1-002", "prefix": "CO1-", "currency": "COP", "amount": 300000, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-1-2"}, url: assetCO_1_2.url },
  { ...{"country": "CO", "vendor": "Microsoft", "supplierName": "Microsoft DEMO CO", "taxId": "TEST-CO-2-INVALID", "invoiceNumber": "CO2-001", "prefix": "CO2-", "currency": "COP", "amount": 220000, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-2-1"}, url: assetCO_2_1.url },
  { ...{"country": "CO", "vendor": "Microsoft", "supplierName": "Microsoft DEMO CO", "taxId": "TEST-CO-2-INVALID", "invoiceNumber": "CO2-002", "prefix": "CO2-", "currency": "COP", "amount": 340000, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-2-2"}, url: assetCO_2_2.url },
  { ...{"country": "CO", "vendor": "Google Cloud", "supplierName": "Google Cloud DEMO CO", "taxId": "TEST-CO-3-INVALID", "invoiceNumber": "CO3-001", "prefix": "CO3-", "currency": "COP", "amount": 260000, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-3-1"}, url: assetCO_3_1.url },
  { ...{"country": "CO", "vendor": "Google Cloud", "supplierName": "Google Cloud DEMO CO", "taxId": "TEST-CO-3-INVALID", "invoiceNumber": "CO3-002", "prefix": "CO3-", "currency": "COP", "amount": 380000, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-3-2"}, url: assetCO_3_2.url },
  { ...{"country": "CO", "vendor": "Uber", "supplierName": "Uber DEMO CO", "taxId": "TEST-CO-4-INVALID", "invoiceNumber": "CO4-001", "prefix": "CO4-", "currency": "COP", "amount": 80000, "category": "travel", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-4-1"}, url: assetCO_4_1.url },
  { ...{"country": "CO", "vendor": "Uber", "supplierName": "Uber DEMO CO", "taxId": "TEST-CO-4-INVALID", "invoiceNumber": "CO4-002", "prefix": "CO4-", "currency": "COP", "amount": 200000, "category": "travel", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-4-2"}, url: assetCO_4_2.url },
  { ...{"country": "CO", "vendor": "Mercado Libre", "supplierName": "Mercado Libre DEMO CO", "taxId": "TEST-CO-5-INVALID", "invoiceNumber": "CO5-001", "prefix": "CO5-", "currency": "COP", "amount": 140000, "category": "other", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-5-1"}, url: assetCO_5_1.url },
  { ...{"country": "CO", "vendor": "Mercado Libre", "supplierName": "Mercado Libre DEMO CO", "taxId": "TEST-CO-5-INVALID", "invoiceNumber": "CO5-002", "prefix": "CO5-", "currency": "COP", "amount": 260000, "category": "other", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Transferencia bancaria (simulada)", "id": "CO-5-2"}, url: assetCO_5_2.url },
  { ...{"country": "BR", "vendor": "AWS", "supplierName": "AWS DEMO BR", "taxId": "TEST-BR-1-INVALID", "invoiceNumber": "BR1-001", "prefix": "BR1-", "currency": "BRL", "amount": 180, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-1-1"}, url: assetBR_1_1.url },
  { ...{"country": "BR", "vendor": "AWS", "supplierName": "AWS DEMO BR", "taxId": "TEST-BR-1-INVALID", "invoiceNumber": "BR1-002", "prefix": "BR1-", "currency": "BRL", "amount": 300, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-1-2"}, url: assetBR_1_2.url },
  { ...{"country": "BR", "vendor": "Microsoft", "supplierName": "Microsoft DEMO BR", "taxId": "TEST-BR-2-INVALID", "invoiceNumber": "BR2-001", "prefix": "BR2-", "currency": "BRL", "amount": 220, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-2-1"}, url: assetBR_2_1.url },
  { ...{"country": "BR", "vendor": "Microsoft", "supplierName": "Microsoft DEMO BR", "taxId": "TEST-BR-2-INVALID", "invoiceNumber": "BR2-002", "prefix": "BR2-", "currency": "BRL", "amount": 340, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-2-2"}, url: assetBR_2_2.url },
  { ...{"country": "BR", "vendor": "Google Cloud", "supplierName": "Google Cloud DEMO BR", "taxId": "TEST-BR-3-INVALID", "invoiceNumber": "BR3-001", "prefix": "BR3-", "currency": "BRL", "amount": 260, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-3-1"}, url: assetBR_3_1.url },
  { ...{"country": "BR", "vendor": "Google Cloud", "supplierName": "Google Cloud DEMO BR", "taxId": "TEST-BR-3-INVALID", "invoiceNumber": "BR3-002", "prefix": "BR3-", "currency": "BRL", "amount": 380, "category": "software", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-3-2"}, url: assetBR_3_2.url },
  { ...{"country": "BR", "vendor": "Uber", "supplierName": "Uber DEMO BR", "taxId": "TEST-BR-4-INVALID", "invoiceNumber": "BR4-001", "prefix": "BR4-", "currency": "BRL", "amount": 80, "category": "travel", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-4-1"}, url: assetBR_4_1.url },
  { ...{"country": "BR", "vendor": "Uber", "supplierName": "Uber DEMO BR", "taxId": "TEST-BR-4-INVALID", "invoiceNumber": "BR4-002", "prefix": "BR4-", "currency": "BRL", "amount": 200, "category": "travel", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-4-2"}, url: assetBR_4_2.url },
  { ...{"country": "BR", "vendor": "Mercado Libre", "supplierName": "Mercado Libre DEMO BR", "taxId": "TEST-BR-5-INVALID", "invoiceNumber": "BR5-001", "prefix": "BR5-", "currency": "BRL", "amount": 140, "category": "other", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-5-1"}, url: assetBR_5_1.url },
  { ...{"country": "BR", "vendor": "Mercado Libre", "supplierName": "Mercado Libre DEMO BR", "taxId": "TEST-BR-5-INVALID", "invoiceNumber": "BR5-002", "prefix": "BR5-", "currency": "BRL", "amount": 260, "category": "other", "date": "2026-10-17", "dueDate": "2026-10-30", "channel": "Pix (simulado)", "id": "BR-5-2"}, url: assetBR_5_2.url },
];
