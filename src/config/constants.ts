import * as path from "path";
import { BotConfig } from "../types";

export const BOT_CONFIG: BotConfig = {
    sessionPath: path.join(__dirname, '../../session'),
    logLevel: 'silent',
    markOnlineOnConnect: true,
    browser: ['MyWhatsAppBot', 'Chrome', '1.0.0']
};

export const JOKES: string[] = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "Why don't eggs tell jokes? They'd crack each other up!",
    "What do you call a fake noodle? An impasta!",
    "Why did the math book look so sad? Because it had too many problems!",
    "Why don't skeletons fight each other? They don't have the guts!",
    "What do you call a bear with no teeth? A gummy bear!",
    "Why did the coffee file a police report? It got mugged!"
];

export const QUOTES: string[] = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "Life is what happens to you while you're busy making other plans. - John Lennon",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "It is during our darkest moments that we must focus to see the light. - Aristotle",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The way to get started is to quit talking and begin doing. - Walt Disney",
    "Don't let yesterday take up too much of today. - Will Rogers"
];

export const AUTO_REPLY_PATTERNS = [
    {
        pattern: ['hello', 'hi', 'hey'],
        response: 'Hello! 👋 Type /help to see what I can do!'
    },
    {
        pattern: ['good morning', 'morning'],
        response: 'Good morning! ☀️ Have a great day!'
    },
    {
        pattern: ['good night', 'night'],
        response: 'Good night! 🌙 Sleep well!'
    },
    {
        pattern: ['thank you', 'thanks', 'thx'],
        response: 'You\'re welcome! 😊'
    },
    {
        pattern: ['how are you', 'how r u'],
        response: 'I\'m doing great! Ready to help you with commands! 🤖'
    }
];
