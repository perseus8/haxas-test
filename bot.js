// src/bot.js
const { Telegraf, Markup, session } = require('telegraf');
const { io } = require('socket.io-client');
require("dotenv").config()

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'http://127.0.0.1:5000';

if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('Telegram Bot Token is missing.');
}

// Initialize the bot with session middleware
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
bot.use(session());

// Define the custom inline keyboard layout
const mainKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('＋ Add', 'add')],
    [Markup.button.callback('－ Subtract', 'subtract')],
]);

// Initialize Socket.IO client
const socket = io(WEBSOCKET_URL); // Ensure the URL is correct

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
});

const sendAmountToWebSocket = (user, amount) => {
    const data = { user, amount };
    socket.emit('transact', data);
};

socket.on('balanceUpdated', (data) => {
    bot.telegram.sendMessage(data.user, `Your balance has been updated to ${data.balance}.`);
});

socket.on('userCreated', (data) => {
    try {
        bot.telegram.sendMessage(data.user, `Welcome! Your account has been created with a balance of ${data.balance}.`);
    } catch (e) {
        console.log(e);
    }
});

socket.on('error', (data) => {
    try {
        bot.telegram.sendMessage(data.user, `Error: ${data.message}`);
    } catch (e) {
        console.log(e);
    }
});

bot.start((ctx) => {
    try {
        ctx.reply('Welcome to the Haxas Bot! ^_^', mainKeyboard);
    } catch (e) {
        console.log(e);
    }
});

bot.action('add', (ctx) => {
    ctx.session ??= {}; // Ensure session is initialized
    ctx.session.state = 'adding';
    try {
        ctx.reply('Please enter add amount!');
    } catch (e) {
        console.log(e);
    }
});

bot.action('subtract', (ctx) => {
    ctx.session ??= {}; // Ensure session is initialized
    ctx.session.state = 'subtracting';
    try {
        ctx.reply('Please enter subtract amount!');
    } catch (e) {
        console.log(e);
    }
});

bot.on('text', (ctx) => {
    try {
        const amount = parseFloat(ctx.message.text);
        if (isNaN(amount)) {
            ctx.reply('Please enter a valid number.');
            return;
        }

        const userId = ctx.from.id; // Get the user's ID

        if (ctx.session.state === 'adding') {
            sendAmountToWebSocket(userId, amount); // Send data to WebSocket
            ctx.session.state = undefined; // Clear the state
        } else if (ctx.session.state === 'subtracting') {
            sendAmountToWebSocket(userId, -amount); // Send data to WebSocket
            ctx.session.state = undefined; // Clear the state
        } else {
            ctx.reply('Please select an action first.');
        }
    } catch (e) {
        console.log(e);
    }
});

const startBot = () => {
    bot.launch();
    console.log('Telegram bot started...');
};

startBot();
