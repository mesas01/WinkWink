# WinkWink · Roadmap

## Hecho

- [x] Agente en `/agente`: extracción con Gemini, antifraude por cuenta y Tax ID verificados, reglas que fallan cerrado y registro de auditoría tipado con decisiones tachadas.
- [x] Fallbacks: extracción local de texto y PDFs cuando Gemini no tiene cuota.
- [x] Roles Empleado / Admin financiero, interfaz bilingüe ES/EN, cámara del celular y webcam.
- [x] Seguridad del despliegue: límites de uso, código de acceso opcional y encabezados de seguridad.
- [x] Proyecto propio de Supabase con login con Google y migraciones en `supabase/setup.sql`.
- [x] Rediseño estilo Apple (vidrio translúcido, animaciones con resortes), 8 PDFs de prueba y video demo narrado.

## Siguiente

- [ ] Persistir facturas y eventos del agente en Supabase, con los mismos tipos del motor.
- [ ] Pasar la evaluación del panel con login (`/dashboard`) del gateway de Lovable a Gemini.
- [ ] Límites de uso globales con un almacén compartido (Redis o KV).
- [ ] Proveedores y reglas desde el registro verificado de Blinka, en lugar de datos de ejemplo.
- [ ] Datos de contacto de privacidad, acuerdos con encargados y política de retención antes de aceptar documentos reales.
