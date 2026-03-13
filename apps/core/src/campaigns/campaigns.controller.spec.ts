import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignStatus } from '@prisma/client';

describe('CampaignsController', () => {
  let controller: CampaignsController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateStatus: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignsController],
      providers: [{ provide: CampaignsService, useValue: service }],
    }).compile();

    controller = module.get<CampaignsController>(CampaignsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should delegate to service.findAll', async () => {
      const campaigns = [{ id: 'c-1' }];
      service.findAll.mockResolvedValue(campaigns);

      const result = await controller.findAll();

      expect(result).toEqual(campaigns);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne with id', async () => {
      const campaign = { id: 'c-1', name: 'Test' };
      service.findOne.mockResolvedValue(campaign);

      const result = await controller.findOne('c-1');

      expect(result).toEqual(campaign);
      expect(service.findOne).toHaveBeenCalledWith('c-1');
    });
  });

  describe('create', () => {
    it('should delegate to service.create with dto', async () => {
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
      const created = { id: 'c-1', ...dto };
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateStatus', () => {
    it('should delegate to service.updateStatus with id and dto', async () => {
      const dto = { status: CampaignStatus.FUNDRAISING };
      const updated = { id: 'c-1', status: CampaignStatus.FUNDRAISING };
      service.updateStatus.mockResolvedValue(updated);

      const result = await controller.updateStatus('c-1', dto);

      expect(result).toEqual(updated);
      expect(service.updateStatus).toHaveBeenCalledWith('c-1', dto);
    });
  });

  describe('update', () => {
    it('should delegate to service.update with id and dto', async () => {
      const dto = { name: 'Updated Name' };
      const updated = { id: 'c-1', name: 'Updated Name' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('c-1', dto);

      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith('c-1', dto);
    });
  });

  describe('remove', () => {
    it('should delegate to service.remove with id', async () => {
      const removed = { id: 'c-1' };
      service.remove.mockResolvedValue(removed);

      const result = await controller.remove('c-1');

      expect(result).toEqual(removed);
      expect(service.remove).toHaveBeenCalledWith('c-1');
    });
  });
});
