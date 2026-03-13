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
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const ALLOWED_TRANSITIONS = {
    [client_1.LoanStatus.PENDING]: [client_1.LoanStatus.DISBURSED],
    [client_1.LoanStatus.DISBURSED]: [client_1.LoanStatus.REPAID, client_1.LoanStatus.DEFAULTED],
    [client_1.LoanStatus.REPAID]: [],
    [client_1.LoanStatus.DEFAULTED]: [],
};
let LoansService = class LoansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.loan.findMany({
            orderBy: { createdAt: 'desc' },
            include: { campaign: true },
        });
    }
    async findOne(id) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: { campaign: true },
        });
        if (!loan)
            throw new common_1.NotFoundException(`Loan ${id} not found`);
        return loan;
    }
    findByCampaign(campaignId) {
        return this.prisma.loan.findMany({
            where: { campaignId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async create(dto) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: dto.campaignId },
        });
        if (!campaign) {
            throw new common_1.NotFoundException(`Campaign ${dto.campaignId} not found`);
        }
        if (dto.amount > Number(campaign.loanSize)) {
            throw new common_1.BadRequestException(`Loan amount ${dto.amount} exceeds campaign loan size ${campaign.loanSize}`);
        }
        const stats = await this.prisma.loan.aggregate({
            where: { campaignId: dto.campaignId },
            _sum: { amount: true },
        });
        const currentTotal = Number(stats._sum.amount ?? 0);
        if (currentTotal + dto.amount > Number(campaign.poolSize)) {
            throw new common_1.BadRequestException(`Total loans (${currentTotal + dto.amount}) would exceed pool size ${campaign.poolSize}`);
        }
        return this.prisma.loan.create({
            data: dto,
            include: { campaign: true },
        });
    }
    async update(id, dto) {
        const loan = await this.findOne(id);
        if (dto.status) {
            this.validateStatusTransition(loan.status, dto.status);
        }
        return this.prisma.loan.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        const loan = await this.findOne(id);
        if (loan.status !== client_1.LoanStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot delete loan in status ${loan.status}. Only PENDING loans can be deleted.`);
        }
        return this.prisma.loan.delete({ where: { id } });
    }
    getCampaignLoanStats(campaignId) {
        return this.prisma.loan.aggregate({
            where: { campaignId },
            _sum: { amount: true },
            _count: true,
        });
    }
    validateStatusTransition(current, next) {
        if (current === next) {
            throw new common_1.BadRequestException(`Loan is already in status ${current}`);
        }
        const allowed = ALLOWED_TRANSITIONS[current];
        if (!allowed.includes(next)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${current} to ${next}`);
        }
    }
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LoansService);
//# sourceMappingURL=loans.service.js.map