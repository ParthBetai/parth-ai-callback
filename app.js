import express from "express";
import TelegramBot from "node-telegram-bot-api";
import bodyParser from "body-parser";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==============================
//  READ SECURE ENV VARIABLES
// ==============================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PARTH_ID = process.env.PARTH_ID;
const OPENAI_KEY = process.env.OPENAI_KEY;

// Telegram bot init
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// OpenAI init
const openai = new OpenAIApi(
  new Configuration({
    apiKey: OPENAI_KEY,
  })
);

// ==============================
//  HINGLISH AI PERSONALITY
// ==============================
const AI_PERSONALITY = `
You are Parth’s AI Calling Assistant.

SPEAKING RULES:
- Always speak in friendly Hinglish
- Tone: polite, casual, helpful
- Examples:
  "Haanji sir, bataiye main kaise help kar sakta hoon?"
  "Ji bilkul, ek minute note kar raha hoon."
  "Parth abhi thoda busy hai, main aapka message unhe bhej doonga."
- Understand Hindi, Hinglish, English.
- NEVER sound robotic.
- ALWAYS produce natural flowing speech or text.
- Callbacks are happening on WhatsApp voice call.
`;

// ==============================
//  MISSED CALL ENDPOINT
//  Triggered from MacroDroid
// ==============================
app.post("/missed", async (req, res) => {
  const number = req.body.number;
  const time = req.body.time;

  console.log("Missed call from:", number);

  // Notify Parth on Telegram
  await bot.sendMessage(
    PARTH_ID,
    `📞 *Missed Call Detected*\nFrom: *${number}*\nTime: ${time}\n\nAI callback starting on WhatsApp.`,
    { parse_mode: "Markdown" }
  );

  // MacroDroid handles actual WhatsApp callback
  res.send("OK");
});

// ==============================
//  TRANSCRIPT ENDPOINT
//  Called from Audio Bridge after WhatsApp call
// ==============================
app.post("/transcript", async (req, res) => {
  const number = req.body.number;
  const transcript = req.body.transcript;

  console.log("Received transcript from call:", number);

  // Get AI summary
 const summaryResponse = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: AI_PERSONALITY },
    { role: "user", content: transcript }
  ]
});

const summary = summaryResponse.choices[0].message.content;

  // Send transcript + summary to you (Parth)
  await bot.sendMessage(
    PARTH_ID,
    `📄 *Full Transcript from WhatsApp Call*\n👤 Caller: *${number}*\n\n🗣️ Conversation:\n${transcript}\n\n📝 *Summary:*\n${summary}`,
    { parse_mode: "Markdown" }
  );

  res.send("OK");
});

// ==============================
// SERVER START
// ==============================
app.listen(3000, () => {
  console.log("AI Callback Assistant is running on port 3000");
});
