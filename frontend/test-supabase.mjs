import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fdvrhqrymeluqsrsmqve.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdnJocXJ5bWVsdXFzcnNtcXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3Nzg3OTQsImV4cCI6MjEwMDM1NDc5NH0.2VfizSVJK4cziNheTZzGEpSRBl_CnV2LYdfl-C5k5w0'
);

async function check() {
  const { data, error } = await supabase.from('pending_claims').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Pending claims:', data);
  }
}

check();
