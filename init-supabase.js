const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setup() {
  console.log('🚀 Starting automated setup...');

  // 1. Create Storage Bucket
  console.log('📦 Creating "media" bucket...');
  const { data, error } = await supabase.storage.createBucket('media', {
    public: true,
    allowedMimeTypes: ['image/*', 'video/*'],
    fileSizeLimit: 10485760 // 10MB
  });

  if (error) {
    if (error.message === 'Bucket already exists') {
      console.log('✅ Bucket "media" already exists.');
    } else {
      console.error('❌ Error creating bucket:', error.message);
    }
  } else {
    console.log('✅ Bucket "media" created successfully.');
  }

  console.log('\n✨ Setup script finished.');
  console.log('--------------------------------------------------');
  console.log('NEXT STEP: Since I cannot run raw SQL via the API,');
  console.log('please copy the contents of SUPABASE_SCHEMA.sql');
  console.log('and paste them into your Supabase SQL Editor.');
  console.log('--------------------------------------------------');
}

setup();
