import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fdvrhqrymeluqsrsmqve.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdnJocXJ5bWVsdXFzcnNtcXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Nzg3OTQsImV4cCI6MjEwMDM1NDc5NH0.2VfizSVJK4cziNheTZzGEpSRBl_CnV2LYdfl-C5k5w0'
);

async function check() {
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets?.map(b => b.name), 'Error:', bErr);
  
  const { data: creds, error: cErr } = await supabase.from('credentials').select('*');
  console.log('Credentials with missing file_url:', creds?.filter(c => !c.file_url && c.upload_type !== 'official')?.length);
  console.log('Credentials with file_url:', creds?.filter(c => !!c.file_url)?.length);
}

check();
