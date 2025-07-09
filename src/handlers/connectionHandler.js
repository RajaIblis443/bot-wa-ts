"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionHandler = void 0;
var baileys_1 = require("@whiskeysockets/baileys");
var qrcode = require("qrcode-terminal");
var ConnectionHandler = /** @class */ (function () {
    function ConnectionHandler(onReconnect) {
        this.isConnected = false;
        this.onReconnect = onReconnect;
    }
    /**
     * Handle connection state updates
     */
    ConnectionHandler.prototype.handleConnectionUpdate = function (update) {
        return __awaiter(this, void 0, void 0, function () {
            var connection, lastDisconnect, qr;
            return __generator(this, function (_a) {
                try {
                    connection = update.connection, lastDisconnect = update.lastDisconnect, qr = update.qr;
                    if (qr) {
                        console.log('📱 QR Code received, scan it with your WhatsApp app:');
                        console.log(' ');
                        qrcode.generate(qr, { small: true });
                    }
                    if (connection === 'close') {
                        this.handleConnectionClose(lastDisconnect);
                    }
                    else if (connection === 'open') {
                        this.handleConnectionOpen();
                    }
                    else if (connection === 'connecting') {
                        this.handleConnecting();
                    }
                }
                catch (error) {
                    console.error('❌ Error in connection update:', error);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Handle connection close
     */
    ConnectionHandler.prototype.handleConnectionClose = function (lastDisconnect) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        this.isConnected = false;
        var shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
        console.log('🔌 Connection closed due to:', ((_c = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _c === void 0 ? void 0 : _c.message) || 'Unknown error');
        console.log('🔄 Should reconnect:', shouldReconnect);
        if (shouldReconnect) {
            // Check if it's a conflict error (multiple sessions)
            if ((_e = (_d = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.includes('conflict')) {
                console.log('⚠️  Conflict detected - possible multiple WhatsApp Web sessions');
                console.log('� Make sure to close WhatsApp Web in your browser');
                console.log('�🔄 Reconnecting in 10 seconds...');
                setTimeout(function () {
                    _this.onReconnect();
                }, 10000); // Longer delay for conflict errors
            }
            else {
                console.log('🔄 Reconnecting in 3 seconds...');
                setTimeout(function () {
                    _this.onReconnect();
                }, 3000);
            }
        }
        else {
            console.log('🚪 Bot was logged out. Please restart to login again.');
        }
    };
    /**
     * Handle successful connection
     */
    ConnectionHandler.prototype.handleConnectionOpen = function () {
        this.isConnected = true;
        console.log('✅ WhatsApp Bot is connected and ready!');
        console.log('🤖 Bot is now online and listening for messages...');
    };
    /**
     * Handle connecting state
     */
    ConnectionHandler.prototype.handleConnecting = function () {
        this.isConnected = false;
        console.log('🔄 WhatsApp Bot is connecting...');
    };
    /**
     * Get connection status
     */
    ConnectionHandler.prototype.getConnectionStatus = function () {
        return this.isConnected;
    };
    return ConnectionHandler;
}());
exports.ConnectionHandler = ConnectionHandler;
