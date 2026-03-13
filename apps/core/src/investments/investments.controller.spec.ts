import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';

describe('InvestmentsController', () => {
  let controller: InvestmentsController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findByCampaign: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByCampaign: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentsController],
      providers: [{ provide: InvestmentsService, useValue: service }],
    }).compile();

    controller = module.get<InvestmentsController>(InvestmentsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should delegate to service.findAll', async () => {
      const investments = [{ id: 'inv-1' }];
      service.findAll.mockResolvedValue(investments);

      const result = await controller.findAll();

      expect(result).toEqual(investments);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne with id', async () => {
      const investment = { id: 'inv-1' };
      service.findOne.mockResolvedValue(investment);

      const result = await controller.findOne('inv-1');

      expect(result).toEqual(investment);
      expect(service.findOne).toHaveBeenCalledWith('inv-1');
    });
  });

  describe('findByCampaign', () => {
    it('should delegate to service.findByCampaign with campaignId', async () => {
      const investments = [{ id: 'inv-1', campaignId: 'c-1' }];
      service.findByCampaign.mockResolvedValue(investments);

      const result = await controller.findByCampaign('c-1');

      expect(result).toEqual(investments);
      expect(service.findByCampaign).toHaveBeenCalledWith('c-1');
    });
  });

  describe('create', () => {
    it('should delegate to service.create with dto', async () => {
      const dto = {
        campaignId: 'c-1',
        investorAddress: '0xINVESTOR',
        usdcAmount: 500,
        tokenAmount: 500,
        txHash: 'tx-abc',
      };
      const created = { id: 'inv-1', ...dto };
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });
});
