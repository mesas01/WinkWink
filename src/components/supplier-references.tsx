import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { FileText, Loader2, Paperclip, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { registerSupplierFile,listSupplierFiles } from '@/lib/supplier-files.functions';
import { validateUpload } from '@/lib/invoice-policy';
import { Button } from './ui/button';
import type { Database } from '@/integrations/supabase/types';

export async function uploadSupplierReferences(vendorId:string, files: {file:File;kind:'invoice'|'qr'}[], register: ReturnType<typeof useServerFn<typeof registerSupplierFile>>) {
  const {data}=await supabase.auth.getUser();if(!data.user)throw new Error('Sign in required');
  for(const {file,kind} of files){
    if(!validateUpload(file.size,file.type))throw new Error('PDF / JPG / PNG / WEBP · 10 MB');
    const path=`${data.user.id}/supplier-references/${crypto.randomUUID()}`;
    const {error}=await supabase.storage.from('invoice-originals').upload(path,file,{contentType:file.type});if(error)throw error;
    let result;
    try{result=await register({data:{vendorId,path,name:file.name,mime:file.type as 'application/pdf'|'image/png'|'image/jpeg'|'image/webp',kind,authorizedTest:true}});}catch(error){await supabase.storage.from('invoice-originals').remove([path]);throw error;}
    if(!result.ok)throw new Error(result.message);
  }
}
type Row=Database['public']['Tables']['supplier_reference_files']['Row'];
export function SupplierReferences({vendorId,es,refresh}:{vendorId:string;es:boolean;refresh:()=>Promise<unknown>}) {
 const list=useServerFn(listSupplierFiles);const register=useServerFn(registerSupplierFile);
 const [rows,setRows]=useState<Row[]|null>(null);const [busy,setBusy]=useState(false);const [authorized,setAuthorized]=useState(false);const [kind,setKind]=useState<'invoice'|'qr'>('invoice');
 async function load(){setBusy(true);try{setRows(await list({data:{vendorId}}));}catch{toast.error(es?'No se pudieron abrir las referencias':'Could not open references');}finally{setBusy(false);}}
 return <div className="mt-3 space-y-3"><Button variant="outline" size="sm" disabled={busy} onClick={load}><Paperclip/>{es?'Referencias iniciales':'Initial references'}</Button>{rows!==null&&<div className="space-y-3 border-l pl-3">
  <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={authorized} onChange={e=>setAuthorized(e.target.checked)}/>{es?'Solo archivos de la biblioteca sintética, sin datos personales ni claves de pago reales; autorizo su análisis con IA.':'Synthetic library files only, no personal data or real payment keys; I authorize AI analysis.'}</label>
  <select aria-label={es?'Tipo de referencia':'Reference type'} value={kind} onChange={e=>setKind(e.target.value==='qr'?'qr':'invoice')} className="w-full rounded-md border bg-background p-2 text-sm"><option value="invoice">{es?'Factura inicial':'Initial invoice'}</option><option value="qr">{es?'Adjunto QR · Pix / Bre-B (no conectado)':'QR attachment · Pix / Bre-B (not connected)'}</option></select>
  <input aria-label={es?'Agregar referencias':'Add references'} type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp" disabled={!authorized||busy} className="w-full min-w-0 text-xs" onChange={async e=>{const files=Array.from(e.target.files??[]);if(!files.length)return;setBusy(true);try{await uploadSupplierReferences(vendorId,files.map(file=>({file,kind})),register);setRows(await list({data:{vendorId}}));await refresh();toast.success(es?'Referencias analizadas; confirma nuevamente el registro':'References analyzed; confirm onboarding again');}catch(error){toast.error(error instanceof Error?error.message:'Error');setRows(await list({data:{vendorId}}));await refresh();}finally{setBusy(false);e.target.value='';}}}/>
  {busy&&<Loader2 className="size-4 animate-spin"/>}{rows.length===0&&<p className="text-xs text-muted-foreground">{es?'Sin archivos de referencia':'No reference files'}</p>}
  {rows.map(row=><div key={row.id} className="space-y-1 border-t pt-2"><div className="flex items-center gap-2"><FileText className="size-4 shrink-0"/><p className="min-w-0 flex-1 break-all text-xs">{row.file_name}</p><Button size="icon" variant="ghost" title={es?'Abrir original':'Open original'} onClick={async()=>{const {data,error}=await supabase.storage.from('invoice-originals').createSignedUrl(row.storage_path,60);if(error||!data){toast.error(es?'Archivo no disponible':'File unavailable');return;}window.open(data.signedUrl,'_blank','noopener,noreferrer');}}><ExternalLink/></Button><Button size="icon" variant="ghost" title={es?'Eliminar referencia':'Delete reference'} disabled={busy} onClick={async()=>{const {error}=await supabase.from('supplier_reference_files').delete().eq('id',row.id);if(error){toast.error(error.message);return;}await supabase.storage.from('invoice-originals').remove([row.storage_path]);await load();await refresh();}}><Trash2/></Button></div><p className="text-xs text-muted-foreground">{row.kind==='qr'?'QR':(es?'Factura':'Invoice')} · {row.status==='ready'?(es?'Analizada':'Analyzed'):row.status==='error'?(es?'Revisión necesaria':'Review needed'):(es?'Pendiente':'Pending')}</p>{row.metadata&&<dl className="grid grid-cols-2 gap-1 text-xs">{Object.entries(row.metadata as Record<string,unknown>).filter(([key,value])=>['taxId','invoiceNumber','category','currency','bankName','bankLast4'].includes(key)&&value!==null).map(([key,value])=><div key={key} className="min-w-0"><dt className="text-muted-foreground">{{taxId:es?'ID fiscal':'Tax ID',invoiceNumber:es?'N.º factura':'Invoice no.',category:es?'Categoría':'Category',currency:es?'Moneda':'Currency',bankName:es?'Banco':'Bank',bankLast4:es?'Cuenta (4)':'Account (4)'}[key]}</dt><dd className="break-all">{String(value)}</dd></div>)}</dl>}{row.ai_usage&&<p className="text-xs text-muted-foreground">Lovable AI · {String((row.ai_usage as Record<string,unknown>)['totalTokens']??'—')} tokens</p>}{row.error_message&&<p className="text-xs text-destructive">{row.error_message}</p>}</div>)}
 </div>}</div>;
}