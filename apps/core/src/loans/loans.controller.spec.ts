import { Test, TestingModule } from '@nestjs/testing';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { LoanStatus } from '@prisma/client';

describe('LoansController', () => {
  let controller: LoansController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findByCampaign: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    getCampaignLoanStats: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByCampaign: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getCampaignLoanStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoansController],
      providers: [{ provide: LoansService, useValue: service }],
    }).compile();

    controller = module.get<LoansController>(LoansController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should delegate to service.create with dto', async () => {
      const dto = {
        campaignId: 'c-1',
        description: 'Micro loan',
        amount: 1000,
        receiver: '0xRECEIVER',
      };
      const created = { id: 'loan-1', ...dto };
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should delegate to service.findAll', async () => {
      const loans = [{ id: 'loan-1' }];
      service.findAll.mockResolvedValue(loans);

      const result = await controller.findAll();

      expect(result).toEqual(loans);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCampaignLoanStats', () => {
    it('should delegate to service.getCampaignLoanStats with campaignId', async () => {
      const stats = { _sum: { amount: 5000 }, _count: 3 };
      service.getCampaignLoanStats.mockResolvedValue(stats);

      const result = await controller.getCampaignLoanStats('c-1');

      expect(result).toEqual(stats);
      expect(service.getCampaignLoanStats).toHaveBeenCalledWith('c-1');
    });
  });

  describe('findByCampaign', () => {
    it('should delegate to service.findByCampaign with campaignId', async () => {
      const loans = [{ id: 'loan-1', campaignId: 'c-1' }];
      service.findByCampaign.mockResolvedValue(loans);

      const result = await controller.findByCampaign('c-1');

      expect(result).toEqual(loans);
      expect(service.findByCampaign).toHaveBeenCalledWith('c-1');
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne with id', async () => {
      const loan = { id: 'loan-1' };
      service.findOne.mockResolvedValue(loan);

      const result = await controller.findOne('loan-1');

      expect(result).toEqual(loan);
      expect(service.findOne).toHaveBeenCalledWith('loan-1');
    });
  });

  describe('update', () => {
    it('should delegate to service.update with id and dto', async () => {
      const dto = { status: LoanStatus.DISBURSED };
      const updated = { id: 'loan-1', status: LoanStatus.DISBURSED };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('loan-1', dto);

      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith('loan-1', dto);
    });
  });

  describe('remove', () => {
    it('should delegate to service.remove with id', async () => {
      const removed = { id: 'loan-1' };
      service.remove.mockResolvedValue(removed);

      const result = await controller.remove('loan-1');

      expect(result).toEqual(removed);
      expect(service.remove).toHaveBeenCalledWith('loan-1');
    });
  });
});
