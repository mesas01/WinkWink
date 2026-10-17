import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { referenceUploadSchema, validReferenceFile } from './supplier-files';
import { approvedTestHashes } from './approved-test-files';

export const registerSupplierFile=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>referenceUploadSchema.parse(input)).handler(async({data,context})=>{
  const {data:admin,error:roleError}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
  const {data:consent}=await context.supabase.rpc('has_consent');
  if(roleError||!admin||!consent)throw new Error('Forbidden');
  if(!data.path.startsWith(`${context.userId}/supplier-references/`)||data.path.includes('..'))throw new Error('Invalid owner path');
  const {data:vendor,error}=await context.supabase.from('verified_vendors').select('id').eq('id',data.vendorId).single();if(error||!vendor)throw new Error('Supplier unavailable');
  const {data:blob,error:downloadError}=await context.supabase.storage.from('invoice-originals').download(data.path);
  if(downloadError||!blob)throw new Error('Invalid reference');
  const bytes=new Uint8Array(await blob.arrayBuffer());
  if(!validReferenceFile(blob.size,data.mime,bytes))throw new Error('Invalid reference');
  // File contents, not a client-provided flag, enforce the current synthetic-only gate.
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  if(!approvedTestHashes.includes(digest))throw new Error('Solo archivos de la biblioteca sintética mientras las cargas reales estén deshabilitadas. / Only synthetic library files while real uploads are disabled.');
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {data:file,error:insertError}=await supabaseAdmin.from('supplier_reference_files').insert({vendor_id:data.vendorId,user_id:context.userId,storage_path:data.path,file_name:data.name,mime_type:data.mime,kind:data.kind,test_document:true}).select('*').single();
  if(insertError||!file)throw new Error(insertError?.message??'Reference not saved');
  const {extractSupplierFile}=await import('./supplier-files.server');
  return {id:file.id,...await extractSupplierFile(file)};
});
export const listSupplierFiles=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>z.object({vendorId:z.string().uuid()}).parse(input)).handler(async({data,context})=>{
  const {data:files,error}=await context.supabase.from('supplier_reference_files').select('*').eq('vendor_id',data.vendorId).order('created_at');if(error)throw new Error(error.message);return files;
});