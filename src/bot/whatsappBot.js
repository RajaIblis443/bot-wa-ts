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
exports.WhatsAppBot = void 0;
var baileys_1 = require("@whiskeysockets/baileys");
var pino_1 = require("pino");
var constants_1 = require("../config/constants");
var connectionHandler_1 = require("../handlers/connectionHandler");
var dynamicMessageHandler_1 = require("../handlers/dynamicMessageHandler");
/**
 * Main WhatsApp Bot class
 */
var WhatsAppBot = /** @class */ (function () {
    function WhatsAppBot() {
        this.sock = null;
        this.isRunning = false;
        this.connectionHandler = new connectionHandler_1.ConnectionHandler(this.restart.bind(this));
        this.messageProcessor = new dynamicMessageHandler_1.DynamicMessageProcessor();
    }
    /**
     * Start the WhatsApp bot
     */
    WhatsAppBot.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var version, _a, state, saveCreds, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.isRunning) {
                            console.log('⚠️ Bot is already running!');
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        this.isRunning = true;
                        console.log('🚀 Starting WhatsApp Bot...');
                        return [4 /*yield*/, (0, baileys_1.fetchLatestBaileysVersion)()];
                    case 2:
                        version = (_b.sent()).version;
                        return [4 /*yield*/, (0, baileys_1.useMultiFileAuthState)(constants_1.BOT_CONFIG.sessionPath)];
                    case 3:
                        _a = _b.sent(), state = _a.state, saveCreds = _a.saveCreds;
                        this.sock = (0, baileys_1.default)({
                            version: version,
                            auth: state,
                            logger: (0, pino_1.default)({ level: constants_1.BOT_CONFIG.logLevel }),
                            markOnlineOnConnect: constants_1.BOT_CONFIG.markOnlineOnConnect,
                            browser: constants_1.BOT_CONFIG.browser,
                            defaultQueryTimeoutMs: 60000,
                            printQRInTerminal: false,
                            generateHighQualityLinkPreview: true,
                            syncFullHistory: false,
                            fireInitQueries: true,
                            emitOwnEvents: false,
                            maxMsgRetryCount: 3,
                            shouldSyncHistoryMessage: function () { return false; }, // Disable history sync to reduce conflicts
                            getMessage: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, {
                                            conversation: ""
                                        }];
                                });
                            }); },
                            // Additional options to reduce conflicts
                            connectTimeoutMs: 60000,
                            keepAliveIntervalMs: 30000,
                            qrTimeout: 60000
                        });
                        this.setupEventHandlers(saveCreds);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        console.error('❌ Error starting WhatsApp Bot:', error_1);
                        this.isRunning = false;
                        console.log('🔄 Retrying in 5 seconds...');
                        setTimeout(function () { return _this.start(); }, 5000);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Setup event handlers
     */
    WhatsAppBot.prototype.setupEventHandlers = function (saveCreds) {
        var _this = this;
        if (!this.sock)
            return;
        // Connection updates
        this.sock.ev.on('connection.update', function (update) {
            _this.connectionHandler.handleConnectionUpdate(update);
        });
        // Messages
        this.sock.ev.on('messages.upsert', function (messageUpdate) { return __awaiter(_this, void 0, void 0, function () {
            var _i, _a, message;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(messageUpdate.messages && messageUpdate.messages.length > 0)) return [3 /*break*/, 4];
                        _i = 0, _a = messageUpdate.messages;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        message = _a[_i];
                        return [4 /*yield*/, this.messageProcessor.processMessage(this.sock, message)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        // Credentials update
        this.sock.ev.on('creds.update', saveCreds);
        // Call updates (optional)
        this.sock.ev.on('call', function (callUpdate) {
            console.log('📞 Call received:', callUpdate);
        });
        // Presence updates (optional)
        this.sock.ev.on('presence.update', function (presenceUpdate) {
            console.log('👁️ Presence update:', presenceUpdate);
        });
        // Contacts update (optional)
        this.sock.ev.on('contacts.update', function (contactsUpdate) {
            console.log('📇 Contacts update:', contactsUpdate);
        });
        // Chats update (optional)
        this.sock.ev.on('chats.update', function (chatsUpdate) {
            console.log('💬 Chats update:', chatsUpdate);
        });
        // Message receipt update (optional)
        this.sock.ev.on('message-receipt.update', function (receiptUpdate) {
            console.log('✅ Message receipt update:', receiptUpdate);
        });
        // Groups update (optional)
        this.sock.ev.on('groups.update', function (groupsUpdate) {
            console.log('👥 Groups update:', groupsUpdate);
        });
        // Blocking update (optional)
        this.sock.ev.on('blocklist.update', function (blocklistUpdate) {
            console.log('🚫 Blocklist update:', blocklistUpdate);
        });
    };
    /**
     * Restart the bot
     */
    WhatsAppBot.prototype.restart = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                console.log('🔄 Restarting bot...');
                this.isRunning = false;
                if (this.sock) {
                    this.sock.end(undefined);
                    this.sock = null;
                }
                setTimeout(function () { return _this.start(); }, 1000);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Stop the bot
     */
    WhatsAppBot.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🛑 Stopping WhatsApp Bot...');
                this.isRunning = false;
                if (this.sock) {
                    this.sock.end(undefined);
                    this.sock = null;
                }
                console.log('✅ Bot stopped successfully!');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get bot status
     */
    WhatsAppBot.prototype.getStatus = function () {
        return {
            isRunning: this.isRunning,
            isConnected: this.connectionHandler.getConnectionStatus()
        };
    };
    /**
     * Get available commands
     */
    WhatsAppBot.prototype.getAvailableCommands = function () {
        return this.messageProcessor.getAvailableCommands();
    };
    return WhatsAppBot;
}());
exports.WhatsAppBot = WhatsAppBot;
