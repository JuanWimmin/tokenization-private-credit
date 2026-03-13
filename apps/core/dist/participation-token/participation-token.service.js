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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipationTokenService = void 0;
const common_1 = require("@nestjs/common");
const soroban_service_1 = require("../soroban/soroban.service");
let ParticipationTokenService = class ParticipationTokenService {
    soroban;
    constructor(soroban) {
        this.soroban = soroban;
    }
    mint(dto) {
        return this.soroban.buildContractCallTransaction(dto.contractId, 'mint', { to: dto.to, amount: dto.amount }, dto.callerPublicKey);
    }
    setAdmin(dto) {
        return this.soroban.buildContractCallTransaction(dto.contractId, 'set_admin', { new_admin: dto.newAdmin }, dto.callerPublicKey);
    }
    approve(dto) {
        return this.soroban.buildContractCallTransaction(dto.contractId, 'approve', {
            from: dto.from,
            spender: dto.spender,
            amount: dto.amount,
            expiration_ledger: dto.expirationLedger,
        }, dto.callerPublicKey);
    }
    transfer(dto) {
        return this.soroban.buildContractCallTransaction(dto.contractId, 'transfer', { from: dto.from, to_muxed: dto.to, amount: dto.amount }, dto.callerPublicKey);
    }
    transferFrom(dto) {
        return this.soroban.buildContractCallTransaction(dto.contractId, 'transfer_from', {
            spender: dto.spender,
            from: dto.from,
            to: dto.to,
            amount: dto.amount,
        }, dto.callerPublicKey);
    }
    burn(dto) {
        return this.soroban.buildContractCallTransaction(dto.contractId, 'burn', { from: dto.from, amount: dto.amount }, dto.callerPublicKey);
    }
    burnFrom(dto) {
        return this.soroban.buildContractCallTransaction(dto.contractId, 'burn_from', {
            spender: dto.spender,
            from: dto.from,
            amount: dto.amount,
        }, dto.callerPublicKey);
    }
    getBalance(contractId, address, callerPublicKey) {
        return this.soroban.readContractState(contractId, 'balance', { id: address }, callerPublicKey);
    }
    getAllowance(contractId, from, spender, callerPublicKey) {
        return this.soroban.readContractState(contractId, 'allowance', { from, spender }, callerPublicKey);
    }
    getDecimals(contractId, callerPublicKey) {
        return this.soroban.readContractState(contractId, 'decimals', {}, callerPublicKey);
    }
    getName(contractId, callerPublicKey) {
        return this.soroban.readContractState(contractId, 'name', {}, callerPublicKey);
    }
    getSymbol(contractId, callerPublicKey) {
        return this.soroban.readContractState(contractId, 'symbol', {}, callerPublicKey);
    }
    getEscrowId(contractId, callerPublicKey) {
        return this.soroban.readContractState(contractId, 'escrow_id', {}, callerPublicKey);
    }
};
exports.ParticipationTokenService = ParticipationTokenService;
exports.ParticipationTokenService = ParticipationTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [soroban_service_1.SorobanService])
], ParticipationTokenService);
//# sourceMappingURL=participation-token.service.js.map