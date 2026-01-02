import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase keys in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createBucket() {
    console.log("Checking if 'attachments' bucket exists...");

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error("❌ Failed to list buckets:", listError.message);
        process.exit(1);
    }

    const exists = buckets.find(b => b.name === 'attachments');

    if (exists) {
        console.log("✅ Bucket 'attachments' already exists.");
        return;
    }

    console.log("⚠️ Bucket not found. Creating 'attachments' bucket...");

    const { data, error } = await supabase.storage.createBucket('attachments', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });

    if (error) {
        console.error("❌ Failed to create bucket:", error.message);
        process.exit(1);
    }

    console.log("✅ Bucket 'attachments' created successfully!");
}

createBucket();
