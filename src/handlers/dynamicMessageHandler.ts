import { WASocket, proto } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";
import * as fs from 'fs';
import * as path from 'path';

type CommandHandler = (sock: WASocket, chatId: string, senderId: string, args: string[], message?: proto.IWebMessageInfo) => Promise<void>;

export class DynamicMessageProcessor {
    private commands: Map<string, CommandHandler> = new Map();
    private commandsPath: string;

    constructor() {
        this.commandsPath = path.join(__dirname, '../commands');
    }

    async processMessage(sock: WASocket, message: proto.IWebMessageInfo): Promise<void> {
        try {
            // Skip status broadcast and bot messages
            if (MessageUtils.isStatusBroadcast(message)) return;
            if (MessageUtils.isFromBot(message)) return;

            // Set current message for commands that need it (like sticker)
            MessageUtils.setCurrentMessage(message);

            const messageText = MessageUtils.extractMessageText(message);
            const chatId = MessageUtils.getChatId(message);
            const senderId = MessageUtils.getSenderId(message);

            console.log('📨 New message from:', senderId);
            console.log('📝 Message:', messageText);

            // Check if message starts with command prefix
            if (messageText.startsWith('.')) {
                const args = messageText.split(' ');
                const command = args[0];
                const commandArgs = args.slice(1);

                await this.executeCommand(sock, chatId, senderId, command, commandArgs, message);
            } else {
                // Handle auto-reply for non-commands
                await this.handleAutoReply(sock, chatId, messageText);
            }

        } catch (error) {
            console.error('❌ Error processing message:', error);
            try {
                await MessageUtils.sendMessage(sock, MessageUtils.getChatId(message), 
                    '❌ Terjadi kesalahan saat memproses pesan.');
            } catch (replyError) {
                console.error('❌ Error sending error message:', replyError);
            }
        }
    }

    async executeCommand(sock: WASocket, chatId: string, senderId: string, command: string, args: string[], message: proto.IWebMessageInfo): Promise<void> {
        try {
            // Load commands if not already loaded
            if (this.commands.size === 0) {
                await this.loadCommands();
            }

            const commandHandler = this.commands.get(command);
            
            if (commandHandler) {
                console.log(`🔧 Executing command: ${command}`);
                
                // Check if command handler accepts message parameter
                if (commandHandler.length >= 5) {
                    await commandHandler(sock, chatId, senderId, args, message);
                } else {
                    await commandHandler(sock, chatId, senderId, args);
                }
            } else {
                await MessageUtils.sendMessage(sock, chatId, 
                    `❌ Command ${command} tidak ditemukan. Ketik .help untuk melihat daftar command.`);
            }

        } catch (error) {
            console.error(`❌ Error executing command ${command}:`, error);
            await MessageUtils.sendMessage(sock, chatId, 
                `❌ Terjadi kesalahan saat menjalankan command ${command}.`);
        }
    }

    private async loadCommands(): Promise<void> {
        try {
            if (!fs.existsSync(this.commandsPath)) {
                console.log(`📁 Creating commands directory: ${this.commandsPath}`);
                fs.mkdirSync(this.commandsPath, { recursive: true });
                return;
            }

            const commandFiles = fs.readdirSync(this.commandsPath)
                .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
                .filter(file => !file.endsWith('.d.ts'))
                .filter(file => !file.includes('index'));

            console.log(`📂 Found ${commandFiles.length} command files:`, commandFiles);

            for (const file of commandFiles) {
                const commandName = `.${path.basename(file, path.extname(file))}`;
                const commandPath = path.join(this.commandsPath, file);
                
                try {
                    // Clear require cache for hot reload
                    delete require.cache[require.resolve(commandPath)];
                    
                    const commandModule = await import(commandPath);
                    const commandHandler = commandModule.default;
                    
                    if (typeof commandHandler === 'function') {
                        this.commands.set(commandName, commandHandler);
                        console.log(`✅ Loaded command: ${commandName}`);
                    } else {
                        console.error(`❌ Invalid command handler in ${file}`);
                    }
                } catch (error) {
                    console.error(`❌ Error loading command ${file}:`, error);
                }
            }

            console.log(`🎯 Total commands loaded: ${this.commands.size}`);

        } catch (error) {
            console.error('❌ Error loading commands:', error);
        }
    }

    private async handleAutoReply(sock: WASocket, chatId: string, messageText: string): Promise<void> {
        const lowerText = messageText.toLowerCase();
        
        const autoReplies = [
            {
                triggers: ['hello', 'hi', 'hey', 'halo'],
                response: '👋 Halo! Selamat datang di bot WhatsApp.\n\nKetik .help untuk melihat daftar command yang tersedia!'
            },
            {
                triggers: ['good morning', 'selamat pagi'],
                response: '🌅 Selamat pagi! Semoga hari Anda menyenangkan!'
            },
            {
                triggers: ['good night', 'selamat malam'],
                response: '🌙 Selamat malam! Tidur yang nyenyak!'
            },
            {
                triggers: ['thank you', 'thanks', 'terima kasih'],
                response: '😊 Sama-sama! Senang bisa membantu Anda.'
            }
        ];

        for (const reply of autoReplies) {
            if (reply.triggers.some(trigger => lowerText.includes(trigger))) {
                await MessageUtils.sendMessage(sock, chatId, reply.response);
                break;
            }
        }
    }

    async reloadCommands(): Promise<void> {
        this.commands.clear();
        await this.loadCommands();
    }

    /**
     * Get all available commands
     */
    getAvailableCommands(): string[] {
        return Array.from(this.commands.keys());
    }

    /**
     * Get command count
     */
    getCommandCount(): number {
        return this.commands.size;
    }
}
