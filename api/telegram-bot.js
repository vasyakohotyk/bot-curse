const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Конфігурація
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TEACHER_CHAT_ID = process.env.TEACHER_CHAT_ID;
const URL = process.env.VERCEL_DOMAIN; // Домен Vercel

// Ініціалізуємо бот
const bot = new TelegramBot(TELEGRAM_TOKEN, { webHook: true });
bot.setWebHook(`${URL}/api/telegram-bot`);

const sessions = {};
const questions = [
  "Як вас звати?",
  "Записуєте себе чи дитину?",
  "Який ваш вік?",
  "Який вік дитини?",
  "Який ваш номер телефону?",
  "Який день тижня вам зручний для проведення пробного уроку?",
  "Ваш Telegram тег (поставте - , якщо ви хочете пропустити це питання)?",
  "Який ваш рівень володіння мовою (A1-C2)?"
];

// Обробка стартової команди
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  sessions[chatId] = { answers: [], step: 0, isChild: null };
  bot.sendPhoto(chatId, 'https://static.vecteezy.com/vite/assets/photo-masthead-375-BoK_p8LG.webp', {
    caption: `Привіт, я Даша твій сучасний тютор з англійської! Давайте запишемось на пробний урок. Пробний урок триває 30 хвилин, та являється повністю безкоштовним!`
  }).then(() => {
    setTimeout(() => {
      bot.sendMessage(chatId, questions[0]);
    }, 2000);
  });
});

// Обробка повідомлень
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.startsWith("/")) return;

  const session = sessions[chatId];
  if (!session) {
    bot.sendMessage(chatId, "Натисніть /start, щоб почати.");
    return;
  }

  const step = session.step;

  if (step === 0) {
    session.answers.push(msg.text);
    session.step++;
    bot.sendMessage(chatId, questions[1], {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Себе", callback_data: "self" }],
          [{ text: "Дитину", callback_data: "child" }],
        ],
      },
    });
  } else if (step === 1) {
    session.answers.push(msg.text);
    session.step++;
    bot.sendMessage(chatId, questions[2]);
  } else {
    bot.sendMessage(chatId, "Ви завершили!");
  }
});

// Експортуємо обробник для Vercel
module.exports = async (req, res) => {
  try {
    if (req.method === "POST") {
      bot.processUpdate(req.body); // Обробляємо вхідні оновлення
      res.status(200).send("OK");
    } else {
      res.status(200).send("Це Telegram Webhook.");
    }
  } catch (error) {
    console.error("Error in webhook:", error);
    res.status(500).send("Error");
  }
};
