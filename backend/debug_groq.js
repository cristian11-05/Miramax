import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env manualy to be sure
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log("Checking API Key...");
if (!process.env.GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY is missing in process.env");
    process.exit(1);
} else {
    console.log("✅ GROQ_API_KEY found:", process.env.GROQ_API_KEY.substring(0, 10) + "...");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
    try {
        console.log("Listing available models...");
        const models = await groq.models.list();
        console.log("✅ Models found:");
        models.data.forEach(m => console.log("- " + m.id));
    } catch (error) {
        console.error("❌ Error:");
        console.error(error);
    }
}

main();
