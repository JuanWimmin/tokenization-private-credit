import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../prisma/prisma.service';

function makeCampaign(overrides: Partial<any> = {}) {
  return {
    id: 'campaign-1',
    name: 'Test Campaign',
    description: null,
    status: CampaignStatus.DRAFT,
    previousStatus: null,
    issuerAddress: '0xISSUER',
    escrowId: 'escrow-1',
    poolSize: 1000,
    loanDuration: 30,
    expectedReturn: 10,
    loanSize: 500,
    vaultId: null,
    tokenSaleId: null,
    tokenFactoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    investments: [],
    ...overrides,
  };
}

describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: {
    campaign: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      campaign: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return all campaigns ordered by createdAt desc', async () => {
      const campaigns = [makeCampaign(), makeCampaign({ id: 'campaign-2' })];
      prisma.campaign.findMany.mockResolvedValue(campaigns);

      const result = await service.findAll();

      expect(result).toEqual(campaigns);
      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no campaigns exist', async () => {
      prisma.campaign.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a campaign by id with investments', async () => {
      const campaign = makeCampaign();
      prisma.campaign.findUnique.mockResolvedValue(campaign);

      const result = await service.findOne('campaign-1');

      expect(result).toEqual(campaign);
      expect(prisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        include: { investments: true },
      });
    });

    it('should throw NotFoundException when campaign does not exist', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a campaign', async () => {
      const dto = {
        name: 'New Campaign',
        issuerAddress: '0xISSUER',
        escrowId: 'escrow-1',
        poolSize: 10000,
        loanDuration: 30,
        expectedReturn: 10,
        loanSize: 2000,
        tokenFactoryId: 'tf-1',
        tokenSaleId: 'ts-1',
      };
      const created = makeCampaign(dto);
      prisma.campaign.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(prisma.campaign.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('update', () => {
    it('should update a campaign', async () => {
      const campaign = makeCampaign();
      prisma.campaign.findUnique.mockResolvedValue(campaign);
      const updated = { ...campaign, name: 'Updated' };
      prisma.campaign.update.mockResolvedValue(updated);

      const result = await service.update('campaign-1', { name: 'Updated' });

      expect(result).toEqual(updated);
      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: { name: 'Updated' },
      });
    });

    it('should throw NotFoundException when updating non-existent campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a campaign', async () => {
      const campaign = makeCampaign();
      prisma.campaign.findUnique.mockResolvedValue(campaign);
      prisma.campaign.delete.mockResolvedValue(campaign);

      const result = await service.remove('campaign-1');

      expect(result).toEqual(campaign);
      expect(prisma.campaign.delete).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
      });
    });

    it('should throw NotFoundException when deleting non-existent campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    describe('happy path transitions', () => {
      it('DRAFT → FUNDRAISING', async () => {
        const campaign = makeCampaign({
          tokenSaleId: 'ts-1',
          tokenFactoryId: 'tf-1',
        });
        prisma.campaign.findUnique.mockResolvedValue(campaign);
        prisma.campaign.update.mockResolvedValue({
          ...campaign,
          status: CampaignStatus.FUNDRAISING,
        });

        const result = await service.updateStatus('campaign-1', {
          status: CampaignStatus.FUNDRAISING,
        });

        expect(result.status).toBe(CampaignStatus.FUNDRAISING);
        expect(prisma.campaign.update).toHaveBeenCalledWith({
          where: { id: 'campaign-1' },
          data: { status: CampaignStatus.FUNDRAISING },
        });
      });

      it('FUNDRAISING → ACTIVE', async () => {
        const campaign = makeCampaign({
          status: CampaignStatus.FUNDRAISING,
          tokenSaleId: 'ts-1',
          tokenFactoryId: 'tf-1',
        });
        prisma.campaign.findUnique.mockResolvedValue(campaign);
        prisma.campaign.update.mockResolvedValue({
          ...campaign,
          status: CampaignStatus.ACTIVE,
        });

        const result = await service.updateStatus('campaign-1', {
          status: CampaignStatus.ACTIVE,
        });

        expect(result.status).toBe(CampaignStatus.ACTIVE);
      });

      it('ACTIVE → REPAYMENT', async () => {
        const campaign = makeCampaign({ status: CampaignStatus.ACTIVE });
        prisma.campaign.findUnique.mockResolvedValue(campaign);
        prisma.campaign.update.mockResolvedValue({
          ...campaign,
          status: CampaignStatus.REPAYMENT,
        });

        const result = await service.updateStatus('campaign-1', {
          status: CampaignStatus.REPAYMENT,
        });

        expect(result.status).toBe(CampaignStatus.REPAYMENT);
      });

      it('REPAYMENT → CLAIMABLE', async () => {
        const campaign = makeCampaign({
          status: CampaignStatus.REPAYMENT,
          vaultId: 'vault-1',
        });
        prisma.campaign.findUnique.mockResolvedValue(campaign);
        prisma.campaign.update.mockResolvedValue({
          ...campaign,
          status: CampaignStatus.CLAIMABLE,
        });

        const result = await service.updateStatus('campaign-1', {
          status: CampaignStatus.CLAIMABLE,
        });

        expect(result.status).toBe(CampaignStatus.CLAIMABLE);
      });

      it('CLAIMABLE → CLOSED', async () => {
        const campaign = makeCampaign({
          status: CampaignStatus.CLAIMABLE,
          vaultId: 'vault-1',
        });
        prisma.campaign.findUnique.mockResolvedValue(campaign);
        prisma.campaign.update.mockResolvedValue({
          ...campaign,
          status: CampaignStatus.CLOSED,
        });

        const result = await service.updateStatus('campaign-1', {
          status: CampaignStatus.CLOSED,
        });

        expect(result.status).toBe(CampaignStatus.CLOSED);
      });
    });

    describe('pause and resume', () => {
      it('pauses from ACTIVE and saves previousStatus', async () => {
        const campaign = makeCampaign({ status: CampaignStatus.ACTIVE });
        prisma.campaign.findUnique.mockResolvedValue(campaign);
        prisma.campaign.update.mockResolvedValue({
          ...campaign,
          status: CampaignStatus.PAUSED,
          previousStatus: CampaignStatus.ACTIVE,
        });

        await service.updateStatus('campaign-1', {
          status: CampaignStatus.PAUSED,
        });

        expect(prisma.campaign.update).toHaveBeenCalledWith({
          where: { id: 'campaign-1' },
          data: {
            status: CampaignStatus.PAUSED,
            previousStatus: CampaignStatus.ACTIVE,
          },
        });
      });

      it('pauses from FUNDRAISING and saves previousStatus', async () => {
        const campaign = makeCampaign({
          status: CampaignStatus.FUNDRAISING,
          tokenSaleId: 'ts-1',
          tokenFactoryId: 'tf-1',
        });
        prisma.campaign.findUnique.mockResolvedValue(campaign);
        prisma.campaign.update.mockResolvedValue({
          ...campaign,
          status: CampaignStatus.PAUSED,
          previousStatus: CampaignStatus.FUNDRAISING,
        });

        await service.updateStatus('campaign-1', {
          status: CampaignStatus.PAUSED,
        });

        expect(prisma.campaign.update).toHaveBeenCalledWith({
          where: { id: 'campaign-1' },
          data: {
            status: CampaignStatus.PAUSED,
            previousStatus: CampaignStatus.FUNDRAISING,
          },
        });
      });

      it('resumes from PAUSED to previousStatus and clears it', async () => {
        const campaign = makeCampaign({
          status: CampaignStatus.PAUSED,
          previousStatus: CampaignStatus.ACTIVE,
        });
        prisma.campaign.findUnique.mockResolvedValue(campaign);
        prisma.campaign.update.mockResolvedValue({
          ...campaign,
          status: CampaignStatus.ACTIVE,
          previousStatus: null,
        });

        await service.updateStatus('campaign-1', {
          status: CampaignStatus.ACTIVE,
        });

        expect(prisma.campaign.update).toHaveBeenCalledWith({
          where: { id: 'campaign-1' },
          data: {
            status: CampaignStatus.ACTIVE,
            previousStatus: null,
          },
        });
      });

      it('rejects resume to a different status than previousStatus', async () => {
        const campaign = makeCampaign({
          status: CampaignStatus.PAUSED,
          previousStatus: CampaignStatus.ACTIVE,
        });
        prisma.campaign.findUnique.mockResolvedValue(campaign);

        await expect(
          service.updateStatus('campaign-1', {
            status: CampaignStatus.FUNDRAISING,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('rejects resume when no previousStatus is recorded', async () => {
        const campaign = makeCampaign({
          status: CampaignStatus.PAUSED,
          previousStatus: null,
        });
        prisma.campaign.findUnique.mockResolvedValue(campaign);

        await expect(
          service.updateStatus('campaign-1', {
            status: CampaignStatus.ACTIVE,
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('invalid transitions', () => {
      it('rejects DRAFT → ACTIVE (skipping FUNDRAISING)', async () => {
        const campaign = makeCampaign();
        prisma.campaign.findUnique.mockResolvedValue(campaign);

        await expect(
          service.updateStatus('campaign-1', {
            status: CampaignStatus.ACTIVE,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('rejects CLOSED → any status', async () => {
        const campaign = makeCampaign({ status: CampaignStatus.CLOSED });
        prisma.campaign.findUnique.mockResolvedValue(campaign);

        await expect(
          service.updateStatus('campaign-1', {
            status: CampaignStatus.ACTIVE,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('rejects transitioning to the same status', async () => {
        const campaign = makeCampaign({ status: CampaignStatus.ACTIVE });
        prisma.campaign.findUnique.mockResolvedValue(campaign);

        await expect(
          service.updateStatus('campaign-1', {
            status: CampaignStatus.ACTIVE,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('rejects FUNDRAISING → CLOSED (skipping steps)', async () => {
        const campaign = makeCampaign({
          status: CampaignStatus.FUNDRAISING,
          tokenSaleId: 'ts-1',
          tokenFactoryId: 'tf-1',
        });
        prisma.campaign.findUnique.mockResolvedValue(campaign);

        await expect(
          service.updateStatus('campaign-1', {
            status: CampaignStatus.CLOSED,
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('prerequisite validation', () => {
      it('rejects DRAFT → FUNDRAISING without tokenSaleId', async () => {
        const campaign = makeCampaign({ tokenFactoryId: 'tf-1' });
        prisma.campaign.findUnique.mockResolvedValue(campaign);

        await expect(
          service.updateStatus('campaign-1', {
            status: CampaignStatus.FUNDRAISING,
          }),
        ).rejects.toThrow(/tokenSaleId/);
      });

      it('rejects DRAFT → FUNDRAISING without tokenFactoryId', async () => {
        const campaign = makeCampaign({ tokenSaleId: 'ts-1' });
        prisma.campaign.findUnique.mockResolvedValue(campaign);

        await expect(
          service.updateStatus('campaign-1', {
            status: CampaignStatus.FUNDRAISING,
          }),
        ).rejects.toThrow(/tokenFactoryId/);
      });

      it('rejects REPAYMENT → CLAIMABLE without vaultId', async () => {
        const campaign = makeCampaign({ status: CampaignStatus.REPAYMENT });
        prisma.campaign.findUnique.mockResolvedValue(campaign);

        await expect(
          service.updateStatus('campaign-1', {
            status: CampaignStatus.CLAIMABLE,
          }),
        ).rejects.toThrow(/vaultId/);
      });
    });

    it('throws NotFoundException for non-existent campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent', {
          status: CampaignStatus.FUNDRAISING,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
