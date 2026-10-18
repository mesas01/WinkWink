# Facturas de prueba

PDFs sintéticos para probar la subida en `/agente` (pestaña Nueva factura).

| Archivo | Resultado esperado |
|---|---|
| `01-aws-aprobada.pdf` | APROBADA: cuenta verificada + Software < USD 500 |
| `02-aws-fraude-cuenta-cambiada.pdf` | BLOQUEADA: la cuenta no coincide con la verificada (Chase ****4321) |
| `03-figma-fraude-taxid.pdf` | BLOQUEADA: el Tax ID no coincide con el verificado (US-771204) |
| `04-uber-viaticos-retenida.pdf` | RETENIDA: Viáticos supera el límite de USD 100 |
| `05-uber-taxi-aprobada.pdf` | APROBADA: Viáticos por debajo de USD 100 |
| `06-slack-aprobada.pdf` | APROBADA: cuenta verificada + Software < USD 500 |
| `07-proveedor-desconocido-retenida.pdf` | RETENIDA: proveedor no verificado en Blinka |
| `08-rappi-brl-sin-regla.pdf` | RETENIDA: ninguna regla cubre Marketing en BRL |

Regenerar: `npm run invoices:generate`. Todos los datos son ficticios.
