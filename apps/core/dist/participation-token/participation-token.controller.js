"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipationTokenController = void 0;
const common_1 = require("@nestjs/common");
const participation_token_service_1 = require("./participation-token.service");
const mint_dto_1 = require("./dto/mint.dto");
const set_admin_dto_1 = require("./dto/set-admin.dto");
const approve_dto_1 = require("./dto/approve.dto");
const transfer_dto_1 = require("./dto/transfer.dto");
const transfer_from_dto_1 = require("./dto/transfer-from.dto");
const burn_dto_1 = require("./dto/burn.dto");
const burn_from_dto_1 = require("./dto/burn-from.dto");
let ParticipationTokenController = class ParticipationTokenController {
    participationTokenService;
    constructor(participationTokenService) {
        this.participationTokenService = participationTokenService;
    }
    async mint(dto) {
        const unsignedXdr = await this.participationTokenService.mint(dto);
        return { unsignedXdr };
    }
    async setAdmin(dto) {
        const unsignedXdr = await this.participationTokenService.setAdmin(dto);
        return { unsignedXdr };
    }
    async approve(dto) {
        const unsignedXdr = await this.participationTokenService.approve(dto);
        return { unsignedXdr };
    }
    async transfer(dto) {
        const unsignedXdr = await this.participationTokenService.transfer(dto);
        return { unsignedXdr };
    }
    async transferFrom(dto) {
        const unsignedXdr = await this.participationTokenService.transferFrom(dto);
        return { unsignedXdr };
    }
    async burn(dto) {
        const unsignedXdr = await this.participationTokenService.burn(dto);
        return { unsignedXdr };
    }
    async burnFrom(dto) {
        const unsignedXdr = await this.participationTokenService.burnFrom(dto);
        return { unsignedXdr };
    }
    async getBalance(contractId, address, callerPublicKey) {
        const balance = await this.participationTokenService.getBalance(contractId, address, callerPublicKey);
        return { balance: String(balance) };
    }
    async getAllowance(contractId, from, spender, callerPublicKey) {
        const allowance = await this.participationTokenService.getAllowance(contractId, from, spender, callerPublicKey);
        return { allowance: String(allowance) };
    }
    async getDecimals(contractId, callerPublicKey) {
        const decimals = await this.participationTokenService.getDecimals(contractId, callerPublicKey);
        return { decimals };
    }
    async getName(contractId, callerPublicKey) {
        const name = await this.participationTokenService.getName(contractId, callerPublicKey);
        return { name: String(name) };
    }
    async getSymbol(contractId, callerPublicKey) {
        const symbol = await this.participationTokenService.getSymbol(contractId, callerPublicKey);
        return { symbol: String(symbol) };
    }
    async getEscrowId(contractId, callerPublicKey) {
        const escrowId = await this.participationTokenService.getEscrowId(contractId, callerPublicKey);
        return { escrowId: String(escrowId) };
    }
};
exports.ParticipationTokenController = ParticipationTokenController;
__decorate([
    (0, common_1.Post)('mint'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mint_dto_1.MintDto]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "mint", null);
__decorate([
    (0, common_1.Post)('set-admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_admin_dto_1.SetAdminDto]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "setAdmin", null);
__decorate([
    (0, common_1.Post)('approve'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [approve_dto_1.ApproveDto]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('transfer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_dto_1.TransferDto]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "transfer", null);
__decorate([
    (0, common_1.Post)('transfer-from'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_from_dto_1.TransferFromDto]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "transferFrom", null);
__decorate([
    (0, common_1.Post)('burn'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [burn_dto_1.BurnDto]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "burn", null);
__decorate([
    (0, common_1.Post)('burn-from'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [burn_from_dto_1.BurnFromDto]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "burnFrom", null);
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Query)('contractId')),
    __param(1, (0, common_1.Query)('address')),
    __param(2, (0, common_1.Query)('callerPublicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('allowance'),
    __param(0, (0, common_1.Query)('contractId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('spender')),
    __param(3, (0, common_1.Query)('callerPublicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "getAllowance", null);
__decorate([
    (0, common_1.Get)('decimals'),
    __param(0, (0, common_1.Query)('contractId')),
    __param(1, (0, common_1.Query)('callerPublicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "getDecimals", null);
__decorate([
    (0, common_1.Get)('name'),
    __param(0, (0, common_1.Query)('contractId')),
    __param(1, (0, common_1.Query)('callerPublicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "getName", null);
__decorate([
    (0, common_1.Get)('symbol'),
    __param(0, (0, common_1.Query)('contractId')),
    __param(1, (0, common_1.Query)('callerPublicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "getSymbol", null);
__decorate([
    (0, common_1.Get)('escrow-id'),
    __param(0, (0, common_1.Query)('contractId')),
    __param(1, (0, common_1.Query)('callerPublicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ParticipationTokenController.prototype, "getEscrowId", null);
exports.ParticipationTokenController = ParticipationTokenController = __decorate([
    (0, common_1.Controller)('participation-token'),
    __metadata("design:paramtypes", [participation_token_service_1.ParticipationTokenService])
], ParticipationTokenController);
//# sourceMappingURL=participation-token.controller.js.map