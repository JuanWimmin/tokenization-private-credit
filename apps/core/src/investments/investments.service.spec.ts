import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { PrismaService } from '../prisma/prisma.service';

function makeInvestment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'inv-1',
    campaignId: 'campaign-1',
    investorAddress: '0xINVESTOR',
    usdcAmount: 500,
    tokenAmount: 500,
    txHash: 'tx-abc123',
    createdAt: new Date(),
    campaign: { id: 'campaign-1', name: 'Test Campaign' },
    ...overrides,
  };
}

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let prisma: {
    investment: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      investment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return all investments ordered by createdAt desc', async () => {
      const investments = [makeInvestment(), makeInvestment({ id: 'inv-2' })];
      prisma.investment.findMany.mockResolvedValue(investments);

      const result = await service.findAll();

      expect(result).toEqual(investments);
      expect(prisma.investment.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { campaign: true },
      });
    });

    it('should return empty array when no investments exist', async () => {
      prisma.investment.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an investment by id', async () => {
      const investment = makeInvestment();
      prisma.investment.findUnique.mockResolvedValue(investment);

      const result = await service.findOne('inv-1');

      expect(result).toEqual(investment);
      expect(prisma.investment.findUnique).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        include: { campaign: true },
      });
    });

    it('should throw NotFoundException when investment does not exist', async () => {
      prisma.investment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCampaign', () => {
    it('should return investments for a campaign ordered by createdAt desc', async () => {
      const investments = [makeInvestment()];
      prisma.investment.findMany.mockResolvedValue(investments);

      const result = await service.findByCampaign('campaign-1');

      expect(result).toEqual(investments);
      expect(prisma.investment.findMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when campaign has no investments', async () => {
      prisma.investment.findMany.mockResolvedValue([]);

      const result = await service.findByCampaign('campaign-no-inv');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create an investment and include campaign', async () => {
      const newInvestment = makeInvestment();
      prisma.investment.create.mockResolvedValue(newInvestment);

      const dto = {
        campaignId: 'campaign-1',
        investorAddress: '0xINVESTOR',
        usdcAmount: 500,
        tokenAmount: 500,
        txHash: 'tx-abc123',
      };

      const result = await service.create(dto);

      expect(result).toEqual(newInvestment);
      expect(prisma.investment.create).toHaveBeenCalledWith({
        data: dto,
        include: { campaign: true },
      });
    });
  });
});
