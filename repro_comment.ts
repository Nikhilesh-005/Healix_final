
import 'dotenv/config';
import { pool } from "@/lib/neon";
import { getModel } from "@/lib/geminiAgent";

async function main() {
    const client = await pool.connect();
    try {
        const content = "i feel happy today";

        // Simulate Post content
        await client.query("BEGIN");
        console.log("Creating post...");
        const ins = await client.query(
            `INSERT INTO community_posts (user_id, content, enhanced_content, is_anonymous, moderation_status, created_at)
       VALUES ($1,$2,$3,$4,$5, now())
       RETURNING id`,
            [null, content, null, true, "pending"]
        );
        const postId = ins.rows[0].id;
        console.log("Post ID:", postId);
        await client.query("COMMIT");

        // Logic using getModel
        try {
            console.log("Generating AI comment...");
            const model = getModel();
            // console.log("Model Name:", (model as any).model);

            const prompt = `You are a compassionate, supportive, and non-judgmental mental health companion.
      A user has just posted this in a community support feed:
      "${content}"

      Please generate a short, warm, and empathetic first comment to show them they are heard and supported.
      - Keep it under 280 characters.
      - Do NOT give medical advice.
      - Focus on validation and kindness.
      - Sound human-like but professional.
      `;

            const result = await model.generateContent(prompt);
            const aiResponse = result.response.text().trim();
            console.log("AI Response:", aiResponse);

            if (aiResponse) {
                await client.query(
                    `INSERT INTO community_comments (post_id, user_id, content, created_at)
           VALUES ($1, $2, $3, now())`,
                    [postId, null, aiResponse]
                );
                console.log(`[create] Added AI comment to post ${postId}`);
            }
        } catch (aiError: any) {
            console.error("[create] Failed to generate AI comment:", aiError.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

main();
