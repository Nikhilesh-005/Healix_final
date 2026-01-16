
import 'dotenv/config';
import { pool } from "@/lib/neon";

async function main() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 1");
        if (res.rows.length === 0) {
            console.log("No posts found");
            return;
        }
        const post = res.rows[0];
        console.log("Latest Post ID:", post.id);
        console.log("Latest Post Content:", post.content);

        const comments = await client.query("SELECT * FROM community_comments WHERE post_id = $1", [post.id]);
        console.log("Comments Found:", comments.rows.length);
        console.log("Comments:", comments.rows);
    } finally {
        client.release();
    }
}

main();
