// =====================
// IMPORTS
// =====================
import express from "express";
import bodyParser from "body-parser";
import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

// =====================
// APP SETUP
// =====================
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =====================
// ENVIRONMENT VARIABLES
// =====================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PARTH_ID = process.env.PARTH_ID;
const OPENAI_KEY = process.env.OPENAI_KEY;

// =====================
// INITIALIZE BOT + OPENAI
// =====================
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const openai = new OpenAI({
  apiKey: OPENAI_KEY,
});

// =====================
// HINGLISH PERSONALITY
// =====================
const AI_PERSONALITY = `
You are Parth’s AI Calling Assistant.

Speak in friendly Hinglish:
- "Haanji sir, bataiye main kaise help kar sakta hoon?"
- "Ji bilkul, ek minute note kar raha hoon."
- "Parth abhi busy hai, main unhe aapka message bhej doonga."

Understand Hindi, Hinglish, English.
NEVER sound robotic.
`;

// =====================
// MISSED CALL ENDPOINT
// Triggered by MacroDroid
// =====================
app.post("/missed", async (req, res) => {
  const number = req.body.number;
  const time = req.body.time;

  console.log("📞 Missed call from:", number);

  await bot.sendMessage(
    PARTH_ID,
    `📞 *Missed Call Detected*\nFrom: *${number}*\nTime: ${time}\n\nWhatsApp callback triggered.`,
    { parse_mode: "Markdown" }
  );

  res.send("OK");
});

// =====================
// TRANSCRIPT ENDPOINT
// Called by Audio Bridge
// =====================
app.post("/transcript", async (req, res) => {
  const { number, transcript } = req.body;

  console.log("📝 Received transcript from:", number);

  // Ask OpenAI to summarize
  const summaryResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: AI_PERSONALITY },
      { role: "user", content: transcript }
    ],
  });

  const summary = summaryResponse.choices[0].message.content;

  await bot.sendMessage(
    PARTH_ID,
    `📄 *Full Transcript from WhatsApp Call*\n👤 Caller: *${number}*\n\n🗣️ Conversation:\n${transcript}\n\n📝 *Summary:*\n${summary}`,
    { parse_mode: "Markdown" }
  );

  res.send("OK");
});

// =====================
// START SERVER
// RENDER REQUIRES PROCESS.ENV.PORT
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 AI Callback Assistant running on port ${PORT}`);
});
