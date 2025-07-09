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
exports.DynamicMessageProcessor = void 0;
var messageUtils_1 = require("../utils/messageUtils");
var constants_1 = require("../config/constants");
var fs = require("fs");
var path = require("path");
var DynamicMessageProcessor = /** @class */ (function () {
    function DynamicMessageProcessor() {
        this.commands = new Map();
        this.commandsPath = path.join(__dirname, '..', 'commands');
        this.loadCommands().catch(console.error);
    }
    /**
     * Dynamically load commands from files
     */
    DynamicMessageProcessor.prototype.loadCommands = function () {
        return __awaiter(this, void 0, void 0, function () {
            var commandFiles, _i, commandFiles_1, file, commandName, commandPath, commandModule, commandHandler, error_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔄 Loading commands from:', this.commandsPath);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        if (!fs.existsSync(this.commandsPath)) {
                            console.log('📁 Commands directory not found, creating it...');
                            fs.mkdirSync(this.commandsPath, { recursive: true });
                            return [2 /*return*/];
                        }
                        commandFiles = fs.readdirSync(this.commandsPath)
                            .filter(function (file) { return file.endsWith('.js') || file.endsWith('.ts'); })
                            .filter(function (file) { return !file.endsWith('.d.ts'); })
                            .filter(function (file) { return !file.includes('index'); });
                        console.log("\uD83D\uDCC2 Found ".concat(commandFiles.length, " command files:"), commandFiles);
                        _i = 0, commandFiles_1 = commandFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < commandFiles_1.length)) return [3 /*break*/, 7];
                        file = commandFiles_1[_i];
                        commandName = path.basename(file, path.extname(file));
                        commandPath = path.join(this.commandsPath, file);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, Promise.resolve("".concat(commandPath)).then(function (s) { return require(s); })];
                    case 4:
                        commandModule = _a.sent();
                        commandHandler = commandModule.default || commandModule;
                        if (typeof commandHandler === 'function') {
                            this.commands.set(".".concat(commandName), {
                                command: ".".concat(commandName),
                                handler: commandHandler,
                                description: "Dynamic command from ".concat(file)
                            });
                            console.log("\u2705 Loaded command: .".concat(commandName));
                        }
                        else {
                            console.log("\u26A0\uFE0F  Invalid command handler in ".concat(file));
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error("\u274C Failed to load command ".concat(commandName, ":"), error_1);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        console.log("\uD83C\uDF89 Successfully loaded ".concat(this.commands.size, " commands"));
                        return [3 /*break*/, 9];
                    case 8:
                        error_2 = _a.sent();
                        console.error('❌ Error loading commands:', error_2);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reload commands (hot reload)
     */
    DynamicMessageProcessor.prototype.reloadCommands = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔄 Reloading all commands...');
                        this.commands.clear();
                        return [4 /*yield*/, this.loadCommands()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process incoming message
     */
    DynamicMessageProcessor.prototype.processMessage = function (sock, message) {
        return __awaiter(this, void 0, void 0, function () {
            var messageInfo, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        // Skip invalid messages
                        if (!message || !message.key || !message.message)
                            return [2 /*return*/];
                        // Skip status broadcast
                        if (messageUtils_1.MessageUtils.isStatusBroadcast(message))
                            return [2 /*return*/];
                        // Skip messages from bot itself
                        if (messageUtils_1.MessageUtils.isFromBot(message))
                            return [2 /*return*/];
                        messageInfo = this.extractMessageInfo(message);
                        console.log('📨 New message from:', messageInfo.senderId);
                        console.log('📝 Message:', messageInfo.messageText);
                        if (!messageInfo.messageText.startsWith('.')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.processCommand(sock, messageInfo, message)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.processAutoReply(sock, messageInfo)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        console.error('❌ Error processing message:', error_3);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extract message information
     */
    DynamicMessageProcessor.prototype.extractMessageInfo = function (message) {
        return {
            chatId: messageUtils_1.MessageUtils.getChatId(message),
            senderId: messageUtils_1.MessageUtils.getSenderId(message),
            messageText: messageUtils_1.MessageUtils.extractMessageText(message),
            isFromMe: messageUtils_1.MessageUtils.isFromBot(message),
            timestamp: message.messageTimestamp
        };
    };
    /**
     * Process command with dynamic loading
     */
    DynamicMessageProcessor.prototype.processCommand = function (sock, messageInfo, message) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, command, args, commandKey, commandHandler, commandName, commandPath, tsCommandPath, existingPath, commandModule, handler, error_4, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = messageInfo.messageText.split(' '), command = _a[0], args = _a.slice(1);
                        commandKey = command.toLowerCase();
                        commandHandler = this.commands.get(commandKey);
                        if (!!commandHandler) return [3 /*break*/, 4];
                        commandName = commandKey.slice(1);
                        commandPath = path.join(this.commandsPath, "".concat(commandName, ".js"));
                        tsCommandPath = path.join(this.commandsPath, "".concat(commandName, ".ts"));
                        existingPath = fs.existsSync(commandPath) ? commandPath :
                            fs.existsSync(tsCommandPath) ? tsCommandPath : null;
                        if (!existingPath) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.resolve("".concat(existingPath)).then(function (s) { return require(s); })];
                    case 2:
                        commandModule = _b.sent();
                        handler = commandModule.default || commandModule;
                        if (typeof handler === 'function') {
                            commandHandler = {
                                command: commandKey,
                                handler: handler,
                                description: "Dynamic command ".concat(commandName)
                            };
                            // Cache for future use
                            this.commands.set(commandKey, commandHandler);
                            console.log("\u2705 Dynamically loaded command: ".concat(commandKey));
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _b.sent();
                        console.error("\u274C Error loading dynamic command ".concat(commandKey, ":"), error_4);
                        return [3 /*break*/, 4];
                    case 4:
                        if (!commandHandler) return [3 /*break*/, 10];
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 7, , 9]);
                        return [4 /*yield*/, commandHandler.handler(sock, messageInfo.chatId, messageInfo.senderId, args, message)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        error_5 = _b.sent();
                        console.error("\u274C Error executing command ".concat(command, ":"), error_5);
                        return [4 /*yield*/, messageUtils_1.MessageUtils.sendMessage(sock, messageInfo.chatId, '❌ An error occurred while processing your command.')];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, messageUtils_1.MessageUtils.sendMessage(sock, messageInfo.chatId, "\u274C Unknown command: ".concat(command, "\nType .help to see available commands."))];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process auto-reply
     */
    DynamicMessageProcessor.prototype.processAutoReply = function (sock, messageInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var lowerText, _i, AUTO_REPLY_PATTERNS_1, pattern;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lowerText = messageInfo.messageText.toLowerCase();
                        _i = 0, AUTO_REPLY_PATTERNS_1 = constants_1.AUTO_REPLY_PATTERNS;
                        _a.label = 1;
                    case 1:
                        if (!(_i < AUTO_REPLY_PATTERNS_1.length)) return [3 /*break*/, 4];
                        pattern = AUTO_REPLY_PATTERNS_1[_i];
                        if (!pattern.pattern.some(function (p) { return lowerText.includes(p); })) return [3 /*break*/, 3];
                        return [4 /*yield*/, messageUtils_1.MessageUtils.sendMessage(sock, messageInfo.chatId, pattern.response)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4]; // Only send one auto-reply
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all available commands
     */
    DynamicMessageProcessor.prototype.getAvailableCommands = function () {
        return Array.from(this.commands.values());
    };
    return DynamicMessageProcessor;
}());
exports.DynamicMessageProcessor = DynamicMessageProcessor;
