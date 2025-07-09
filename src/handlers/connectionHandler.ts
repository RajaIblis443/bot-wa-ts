import { ConnectionState, DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as qrcode from "qrcode-terminal";

export class ConnectionHandler {
    private onReconnect: () => void;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private lastReconnectTime: number = 0;
    private conflictCount: number = 0;

    constructor(onReconnect: () => void) {
        this.onReconnect = onReconnect;
    }

    /**
     * Handle connection state updates
     */
    async handleConnectionUpdate(update: Partial<ConnectionState>): Promise<void> {
        try {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 QR Code received, scan it with your WhatsApp app:');
                console.log(' ');
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'close') {
                if (lastDisconnect) {
                    this.handleConnectionClose(lastDisconnect);
                }
            } else if (connection === 'open') {
                this.handleConnectionOpen();
            } else if (connection === 'connecting') {
                this.handleConnecting();
            }
            
        } catch (error) {
            console.error('❌ Error in connection update:', error);
        }
    }

    /**
     * Handle connection close
     */
    private handleConnectionClose(lastDisconnect: { error?: Error }): void {
        this.isConnected = false;
        
        const error = lastDisconnect?.error as Boom;
        const statusCode = error?.output?.statusCode;
        const errorMessage = error?.message || 'Unknown error';
        
        console.log('🔌 Connection closed due to:', errorMessage);
        console.log('� Status code:', statusCode);
        console.log('🔧 Disconnect reason:', DisconnectReason.loggedOut);
        
        // Handle conflict errors specially - don't logout, just reconnect
        if (errorMessage.includes('conflict') || errorMessage.includes('Stream Errored')) {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                this.conflictCount++;
                
                // More conservative reconnect - longer delays to prevent session corruption
                const baseDelay = 30000; // 30 seconds base (increased from 15)
                const exponentialDelay = Math.min(baseDelay * Math.pow(2, this.conflictCount - 1), 300000); // Max 5 minutes
                
                console.log('⚠️  Conflict detected - WhatsApp activity detected');
                console.log('📱 This usually happens when:');
                console.log('   - WhatsApp Web is open in browser');
                console.log('   - WhatsApp is actively used on mobile');
                console.log('   - Multiple bot instances running');
                console.log(`🔄 Auto-reconnecting in ${exponentialDelay/1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                console.log(`📊 Conflict count: ${this.conflictCount}`);
                console.log('💡 Tip: Close WhatsApp Web and minimize mobile WhatsApp usage');
                
                this.lastReconnectTime = Date.now();
                
                setTimeout(() => {
                    this.onReconnect();
                }, exponentialDelay);
            } else {
                console.log('❌ Max reconnect attempts reached due to persistent conflicts.');
                console.log('� Bot will stop to prevent session corruption.');
                console.log('💡 Manual solutions:');
                console.log('   1. Close ALL WhatsApp Web sessions in browsers');
                console.log('   2. Wait 5-10 minutes');
                console.log('   3. Restart bot manually: node dist/index.js');
                console.log('   4. Use WhatsApp mobile less frequently');
                console.log('🔧 Session may need to be re-authenticated.');
            }
            return;
        }
        
        // Handle Connection Failure with status code 401 (unauthorized)
        if (errorMessage.includes('Connection Failure') && statusCode === 401) {
            console.log('🔑 Authentication failed - session may be invalid');
            console.log('🗑️  This happens when:');
            console.log('   - WhatsApp session expired');
            console.log('   - Multiple conflicts corrupted session');
            console.log('   - WhatsApp logged out from another device');
            console.log('� Bot will restart and show QR code for re-authentication');
            
            // Force restart to get new QR code
            setTimeout(() => {
                this.onReconnect();
            }, 3000);
            return;
        }
        
        // Normal disconnect handling
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log('🔄 Should reconnect:', shouldReconnect);
        
        if (shouldReconnect) {
            console.log('🔄 Reconnecting in 3 seconds...');
            setTimeout(() => {
                this.onReconnect();
            }, 3000);
        } else {
            console.log('🚪 Bot was logged out. Please restart to login again.');
        }
    }

    /**
     * Handle successful connection
     */
    private handleConnectionOpen(): void {
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset counter on successful connection
        
        // Reset conflict count if enough time has passed
        if (Date.now() - this.lastReconnectTime > 300000) { // 5 minutes
            this.conflictCount = 0;
        }
        
        console.log('✅ WhatsApp Bot is connected and ready!');
        console.log('🤖 Bot is now online and listening for messages...');
        
        if (this.conflictCount > 0) {
            console.log(`📊 Previous conflicts: ${this.conflictCount} (will reset after 5 minutes of stable connection)`);
        }
    }

    /**
     * Handle connecting state
     */
    private handleConnecting(): void {
        this.isConnected = false;
        console.log('🔄 WhatsApp Bot is connecting...');
    }

    /**
     * Get connection status
     */
    getConnectionStatus(): boolean {
        return this.isConnected;
    }
}
