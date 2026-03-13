import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoanStatus } from '@prisma/client';
import { LoansService } from './loans.service';
import { PrismaService } from '../prisma/prisma.service';

function makeCampaign(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'campaign-1',
    name: 'Test Campaign',
    description: null,
    status: 'ACTIVE',
    issuerAddress: '0xISSUER',
    escrowId: 'escrow-1',
    poolSize: 10000,
    loanDuration: 30,
    expectedReturn: 10,
    loanSize: 2000,
    vaultId: null,
    tokenSaleId: null,
    tokenFactoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeLoan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'loan-1',
    campaignId: 'campaign-1',
    description: 'Micro loan #1',
    amount: 1000,
    receiver: '0xRECEIVER',
    milestoneIndex: null,
    status: LoanStatus.PENDING,
    disbursedAt: null,
    repaidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    campaign: makeCampaign(),
    ...overrides,
  };
}

describe('LoansService', () => {
  let service: LoansService;
  let prisma: {
    loan: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      aggregate: jest.Mock;
    };
    campaign: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      loan: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
      campaign: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoansService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<LoansService>(LoansService);
  });

  describe('findAll', () => {
    it('returns all loans with campaigns', async () => {
      const loans = [makeLoan()];
      prisma.loan.findMany.mockResolvedValue(loans);

      const result = await service.findAll();

      expect(result).toEqual(loans);
      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { campaign: true },
      });
    });
  });

  describe('findOne', () => {
    it('returns a loan by id', async () => {
      const loan = makeLoan();
      prisma.loan.findUnique.mockResolvedValue(loan);

      const result = await service.findOne('loan-1');

      expect(result).toEqual(loan);
    });

    it('throws NotFoundException if loan not found', async () => {
      prisma.loan.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCampaign', () => {
    it('returns loans for a campaign ordered by createdAt asc', async () => {
      const loans = [makeLoan()];
      prisma.loan.findMany.mockResolvedValue(loans);

      const result = await service.findByCampaign('campaign-1');

      expect(result).toEqual(loans);
      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('creates a loan successfully', async () => {
      const campaign = makeCampaign();
      prisma.campaign.findUnique.mockResolvedValue(campaign);
      prisma.loan.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      const newLoan = makeLoan();
      prisma.loan.create.mockResolvedValue(newLoan);

      const dto = {
        campaignId: 'campaign-1',
        description: 'Micro loan #1',
        amount: 1000,
        receiver: '0xRECEIVER',
      };

      const result = await service.create(dto);

      expect(result).toEqual(newLoan);
      expect(prisma.loan.create).toHaveBeenCalledWith({
        data: dto,
        include: { campaign: true },
      });
    });

    it('throws NotFoundException if campaign does not exist', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          campaignId: 'missing',
          description: 'Test',
          amount: 1000,
          receiver: '0xRECEIVER',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if amount exceeds loanSize', async () => {
      const campaign = makeCampaign({ loanSize: 500 });
      prisma.campaign.findUnique.mockResolvedValue(campaign);

      await expect(
        service.create({
          campaignId: 'campaign-1',
          description: 'Test',
          amount: 1000,
          receiver: '0xRECEIVER',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if total loans exceed poolSize', async () => {
      const campaign = makeCampaign({ poolSize: 5000 });
      prisma.campaign.findUnique.mockResolvedValue(campaign);
      prisma.loan.aggregate.mockResolvedValue({
        _sum: { amount: 4500 },
      });

      await expect(
        service.create({
          campaignId: 'campaign-1',
          description: 'Test',
          amount: 1000,
          receiver: '0xRECEIVER',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates a loan status with valid transition', async () => {
      const loan = makeLoan({ status: LoanStatus.PENDING });
      prisma.loan.findUnique.mockResolvedValue(loan);
      prisma.loan.update.mockResolvedValue({
        ...loan,
        status: LoanStatus.DISBURSED,
      });

      const result = await service.update('loan-1', {
        status: LoanStatus.DISBURSED,
      });

      expect(result.status).toBe(LoanStatus.DISBURSED);
    });

    it('throws BadRequestException for invalid status transition', async () => {
      const loan = makeLoan({ status: LoanStatus.PENDING });
      prisma.loan.findUnique.mockResolvedValue(loan);

      await expect(
        service.update('loan-1', { status: LoanStatus.REPAID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if transitioning to same status', async () => {
      const loan = makeLoan({ status: LoanStatus.PENDING });
      prisma.loan.findUnique.mockResolvedValue(loan);

      await expect(
        service.update('loan-1', { status: LoanStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });

    it('DISBURSED → REPAID is valid', async () => {
      const loan = makeLoan({ status: LoanStatus.DISBURSED });
      prisma.loan.findUnique.mockResolvedValue(loan);
      prisma.loan.update.mockResolvedValue({
        ...loan,
        status: LoanStatus.REPAID,
      });

      const result = await service.update('loan-1', {
        status: LoanStatus.REPAID,
      });

      expect(result.status).toBe(LoanStatus.REPAID);
    });

    it('DISBURSED → DEFAULTED is valid', async () => {
      const loan = makeLoan({ status: LoanStatus.DISBURSED });
      prisma.loan.findUnique.mockResolvedValue(loan);
      prisma.loan.update.mockResolvedValue({
        ...loan,
        status: LoanStatus.DEFAULTED,
      });

      const result = await service.update('loan-1', {
        status: LoanStatus.DEFAULTED,
      });

      expect(result.status).toBe(LoanStatus.DEFAULTED);
    });

    it('REPAID cannot transition', async () => {
      const loan = makeLoan({ status: LoanStatus.REPAID });
      prisma.loan.findUnique.mockResolvedValue(loan);

      await expect(
        service.update('loan-1', { status: LoanStatus.DISBURSED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('DEFAULTED cannot transition', async () => {
      const loan = makeLoan({ status: LoanStatus.DEFAULTED });
      prisma.loan.findUnique.mockResolvedValue(loan);

      await expect(
        service.update('loan-1', { status: LoanStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deletes a PENDING loan', async () => {
      const loan = makeLoan({ status: LoanStatus.PENDING });
      prisma.loan.findUnique.mockResolvedValue(loan);
      prisma.loan.delete.mockResolvedValue(loan);

      const result = await service.remove('loan-1');

      expect(result).toEqual(loan);
      expect(prisma.loan.delete).toHaveBeenCalledWith({
        where: { id: 'loan-1' },
      });
    });

    it('throws BadRequestException when deleting non-PENDING loan', async () => {
      const loan = makeLoan({ status: LoanStatus.DISBURSED });
      prisma.loan.findUnique.mockResolvedValue(loan);

      await expect(service.remove('loan-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCampaignLoanStats', () => {
    it('returns aggregate stats for a campaign', async () => {
      const stats = { _sum: { amount: 5000 }, _count: 3 };
      prisma.loan.aggregate.mockResolvedValue(stats);

      const result = await service.getCampaignLoanStats('campaign-1');

      expect(result).toEqual(stats);
      expect(prisma.loan.aggregate).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-1' },
        _sum: { amount: true },
        _count: true,
      });
    });
  });
});
