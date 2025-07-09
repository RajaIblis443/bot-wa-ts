import makeWASocket, { 
    fetchLatestBaileysVersion, 
    useMultiFileAuthState, 
    WASocket, 
    proto, 
    DisconnectReason 
} from "@whiskeysockets/baileys";
import pino from "pino";
import { BOT_CONFIG } from "../config/constants";
import { ConnectionHandler } from "../handlers/connectionHandler";
import { DynamicMessageProcessor } from "../handlers/dynamicMessageHandler";

export class WhatsAppBot {
    private sock: WASocket | null = null;
    private connectionHandler: ConnectionHandler;
    private messageProcessor: DynamicMessageProcessor;
    private isRunning: boolean = false;
    private messageQueue: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this.connectionHandler = new ConnectionHandler(this.restart.bind(this));
        this.messageProcessor = new DynamicMessageProcessor();
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log("⚠️ Bot already running.");
            return;
        }

        try {
            this.isRunning = true;
            console.log("🚀 Starting WhatsApp Bot...");

            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(BOT_CONFIG.sessionPath);

            this.sock = makeWASocket({
                version,
                auth: state,
                logger: pino({ level: BOT_CONFIG.logLevel }),
                markOnlineOnConnect: BOT_CONFIG.markOnlineOnConnect,
                browser: BOT_CONFIG.browser,
                printQRInTerminal: false,
                defaultQueryTimeoutMs: 60000,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                retryRequestDelayMs: 3000,
                qrTimeout: 60000,
                syncFullHistory: false,
                emitOwnEvents: false,
                fireInitQueries: false,
                maxMsgRetryCount: 3,
                shouldSyncHistoryMessage: () => false,
                generateHighQualityLinkPreview: true,
                shouldIgnoreJid: jid => jid.includes("status@broadcast"),
                getMessage: async () => ({ conversation: "" })
            });

            this.setupEventHandlers(saveCreds);

        } catch (err) {
            console.error("❌ Failed to start bot:", err);
            this.isRunning = false;
            console.log("⏳ Retrying in 5s...");
            setTimeout(() => this.start(), 5000);
        }
    }

    private setupEventHandlers(saveCreds: () => void): void {
        if (!this.sock) return;

        // Connection status
        this.sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect } = update;
            this.connectionHandler.handleConnectionUpdate(update);

            if (connection === "close") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const reason = (lastDisconnect?.error as any)?.output?.statusCode;
                console.log("🔌 Connection closed. Reason:", reason);

                // Restart if not logged out
                if (reason !== DisconnectReason.loggedOut) {
                    console.log("🔁 Reconnecting in 3s...");
                    setTimeout(() => this.restart(), 3000);
                } else {
                    console.log("🔒 Logged out. Please scan QR again.");
                    this.stop(); // or maybe call this.start() again
                }
            }

            if (connection === "open") {
                console.log("✅ Connected to WhatsApp.");
            }
        });

        // Save updated credentials
        this.sock.ev.on("creds.update", saveCreds);

        // Incoming messages
        this.sock.ev.on("messages.upsert", async ({ messages }) => {
            for (const msg of messages) {
                if (this.shouldProcessMessage(msg)) {
                    await this.processMessageWithDelay(msg);
                }
            }
        });

        // Optional: Call received
        this.sock.ev.on("call", (update) => {
            console.log("📞 Incoming call:", update);
        });
    }

    private shouldProcessMessage(msg: proto.IWebMessageInfo): boolean {
        if (!msg.key || !msg.message) return false;
        if (msg.key.fromMe) return false;
        if (msg.key.remoteJid?.includes("status@broadcast")) return false;
        if (msg.messageStubType) return false;

        const time = Number(msg.messageTimestamp) * 1000;
        if (Date.now() - time > 30000) return false;

        return true;
    }

    private async processMessageWithDelay(msg: proto.IWebMessageInfo): Promise<void> {
        const chatId = msg.key.remoteJid || "";

        if (this.messageQueue.has(chatId)) {
            clearTimeout(this.messageQueue.get(chatId)!);
        }

        const timeout = setTimeout(async () => {
            try {
                await this.messageProcessor.processMessage(this.sock!, msg);
            } catch (err) {
                console.error("❌ Error in processMessage:", err);
            } finally {
                this.messageQueue.delete(chatId);
            }
        }, 500);

        this.messageQueue.set(chatId, timeout);
    }

    private async restart(): Promise<void> {
        console.log("🔁 Restarting bot...");
        this.isRunning = false;

        try {
            this.sock?.end(undefined);
            this.sock = null;
        } catch (err) {
            console.error("❌ Error during restart:", err);
        }

        setTimeout(() => this.start(), 1000);
    }

    async stop(): Promise<void> {
        console.log("🛑 Stopping WhatsApp Bot...");
        this.isRunning = false;

        try {
            this.sock?.end(undefined);
            this.sock = null;
        } catch (err) {
            console.error("❌ Error during stop:", err);
        }

        console.log("✅ Bot stopped.");
    }

    getStatus(): { isRunning: boolean; isConnected: boolean } {
        return {
            isRunning: this.isRunning,
            isConnected: this.connectionHandler.getConnectionStatus()
        };
    }

    getAvailableCommands(): string[] {
        return this.messageProcessor.getAvailableCommands();
    }

    getCommandCount(): number {
        return this.messageProcessor.getCommandCount();
    }
}
