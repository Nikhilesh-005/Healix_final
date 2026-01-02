import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase keys in .env");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", !!SUPABASE_URL);
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", !!SUPABASE_SERVICE_ROLE_KEY);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testUpload() {
    const fileName = `test-upload-${Date.now()}.txt`;
    const fileContent = Buffer.from("Test content");

    console.log(`Attempting to upload ${fileName} to 'attachments' bucket...`);

    let { data, error } = await supabase.storage
        .from("attachments")
        .upload(`attachments/${fileName}`, fileContent);

    if (error) {
        if (error.message.includes("Bucket not found") || error.message.includes("not found")) {
            console.log("⚠️ Bucket 'attachments' not found. Attempting to create it...");
            const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('attachments', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });

            if (bucketError) {
                console.error("❌ Failed to create bucket:", bucketError.message);
                process.exit(1);
            }
            console.log("✅ Bucket 'attachments' created successfully.");

            // Retry upload
            const { data: retryData, error: retryError } = await supabase.storage
                .from("attachments")
                .upload(`attachments/${fileName}`, fileContent);

            if (retryError) {
                console.error("❌ Retry upload failed:", retryError.message);
                process.exit(1);
            }
            console.log("✅ Upload successful:", retryData);
            data = retryData; // update data for URL generation
        } else {
            console.error("❌ Upload failed:", error.message);
            process.exit(1);
        }
    } else {
        console.log("✅ Upload successful:", data);
    }

    const { data: publicUrlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(data.path);

    console.log("   Public URL:", publicUrlData.publicUrl);
}

testUpload();
