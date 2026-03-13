import { Test, TestingModule } from '@nestjs/testing';
import { VaultService } from './vault.service';
import { SorobanService } from '../soroban/soroban.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VaultService', () => {
  let service: VaultService;
  let soroban: {
    buildContractCallTransaction: jest.Mock;
    readContractState: jest.Mock;
  };

  beforeEach(async () => {
    soroban = {
      buildContractCallTransaction: jest.fn().mockResolvedValue('unsigned-xdr'),
      readContractState: jest.fn().mockResolvedValue('mock-state'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultService,
        { provide: SorobanService, useValue: soroban },
        { provide: PrismaService, useValue: { campaign: { update: jest.fn() } } },
      ],
    }).compile();

    service = module.get<VaultService>(VaultService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('availabilityForExchange', () => {
    it('should build contract call with correct params', async () => {
      const dto = {
        contractId: 'vault-1',
        admin: '0xADMIN',
        enabled: true,
        callerPublicKey: '0xCALLER',
      };

      const result = await service.availabilityForExchange(dto);

      expect(result).toBe('unsigned-xdr');
      expect(soroban.buildContractCallTransaction).toHaveBeenCalledWith(
        'vault-1',
        'availability_for_exchange',
        { enabled: true },
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('claim', () => {
    it('should build claim transaction with beneficiary', async () => {
      const dto = {
        contractId: 'vault-1',
        beneficiary: '0xBENEFICIARY',
        callerPublicKey: '0xCALLER',
      };

      const result = await service.claim(dto);

      expect(result).toBe('unsigned-xdr');
      expect(soroban.buildContractCallTransaction).toHaveBeenCalledWith(
        'vault-1',
        'claim',
        { beneficiary: '0xBENEFICIARY' },
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('getOverview', () => {
    it('should read vault overview state', async () => {
      const result = await service.getOverview('vault-1', '0xCALLER');

      expect(result).toBe('mock-state');
      expect(soroban.readContractState).toHaveBeenCalledWith(
        'vault-1',
        'get_vault_overview',
        {},
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('previewClaim', () => {
    it('should read preview claim state with beneficiary', async () => {
      const result = await service.previewClaim(
        'vault-1',
        '0xBENEFICIARY',
        '0xCALLER',
        'vault',
      );

      expect(result).toBe('mock-state');
      expect(soroban.readContractState).toHaveBeenCalledWith(
        'vault-1',
        'preview_claim',
        { beneficiary: '0xBENEFICIARY' },
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('isEnabled', () => {
    it('should read is_enabled state', async () => {
      const result = await service.isEnabled('vault-1', '0xCALLER');

      expect(result).toBe('mock-state');
      expect(soroban.readContractState).toHaveBeenCalledWith(
        'vault-1',
        'is_enabled',
        {},
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('getUsdcBalance', () => {
    it('should read vault USDC balance', async () => {
      const result = await service.getUsdcBalance('vault-1', '0xCALLER');

      expect(result).toBe('mock-state');
      expect(soroban.readContractState).toHaveBeenCalledWith(
        'vault-1',
        'get_vault_usdc_balance',
        {},
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('getTotalTokensRedeemed', () => {
    it('should read total tokens redeemed', async () => {
      const result = await service.getTotalTokensRedeemed('vault-1', '0xCALLER');

      expect(result).toBe('mock-state');
      expect(soroban.readContractState).toHaveBeenCalledWith(
        'vault-1',
        'get_total_tokens_redeemed',
        {},
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('getAdmin', () => {
    it('should read admin address', async () => {
      const result = await service.getAdmin('vault-1', '0xCALLER');

      expect(result).toBe('mock-state');
      expect(soroban.readContractState).toHaveBeenCalledWith(
        'vault-1',
        'get_admin',
        {},
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('getRoiPercentage', () => {
    it('should read ROI percentage', async () => {
      const result = await service.getRoiPercentage('vault-1', '0xCALLER');

      expect(result).toBe('mock-state');
      expect(soroban.readContractState).toHaveBeenCalledWith(
        'vault-1',
        'get_roi_percentage',
        {},
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('getTokenAddress', () => {
    it('should read token address', async () => {
      const result = await service.getTokenAddress('vault-1', '0xCALLER');

      expect(result).toBe('mock-state');
      expect(soroban.readContractState).toHaveBeenCalledWith(
        'vault-1',
        'get_token_address',
        {},
        '0xCALLER',
        'vault',
      );
    });
  });

  describe('getUsdcAddress', () => {
    it('should read USDC address', async () => {
      const result = await service.getUsdcAddress('vault-1', '0xCALLER');

      expect(result).toBe('mock-state');
      expect(soroban.readContractState).toHaveBeenCalledWith(
        'vault-1',
        'get_usdc_address',
        {},
        '0xCALLER',
        'vault',
      );
    });
  });
});
