// Test the enhanced subscription sync
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://puvzrdnziuowznetwwey.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dnpyZG56aXVvd3puZXR3d2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0NzAxMjQsImV4cCI6MjAzMzA0NjEyNH0.gGkTYo8DHQ6DKTjmFXrP0hPb0EMGG8lO78oN7BKnkKo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSync() {
  try {
    console.log('🔄 Testing enhanced subscription sync...');
    
    const { data, error } = await supabase.functions.invoke('sync-subscriptions-with-email-matching', {
      body: {}
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Sync completed!');
    console.log('📊 Summary:', data.summary);
    console.log('🔗 Email matches:', data.email_matches);
    console.log('📝 Results:', data.results?.slice(0, 3)); // Show first 3 results
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testSync(); 