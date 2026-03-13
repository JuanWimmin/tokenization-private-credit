import { Test, TestingModule } from '@nestjs/testing';
import { DeployService } from './deploy.service';
import { SorobanService } from '../soroban/soroban.service';

describe('DeployService', () => {
  let service: DeployService;
  let soroban: {
    buildDeployTransaction: jest.Mock;
    buildContractCallTransaction: jest.Mock;
  };

  const MOCK_PARTICIPATION_TOKEN_HASH = 'pt-wasm-hash';
  const MOCK_TOKEN_FACTORY_HASH = 'tf-wasm-hash';
  const MOCK_VAULT_HASH = 'vault-wasm-hash';

  beforeEach(async () => {
    process.env.PARTICIPATION_TOKEN_WASM_HASH = MOCK_PARTICIPATION_TOKEN_HASH;
    process.env.TOKEN_FACTORY_WASM_HASH = MOCK_TOKEN_FACTORY_HASH;
    process.env.VAULT_WASM_HASH = MOCK_VAULT_HASH;

    soroban = {
      buildDeployTransaction: jest.fn().mockResolvedValue('unsigned-xdr'),
      buildContractCallTransaction: jest
        .fn()
        .mockResolvedValue('unsigned-xdr'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeployService,
        { provide: SorobanService, useValue: soroban },
      ],
    }).compile();

    service = module.get<DeployService>(DeployService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('deployParticipationToken', () => {
    it('should build deploy transaction with correct wasm hash and params', async () => {
      const dto = {
        escrowContractId: 'escrow-1',
        tokenContractId: 'token-1',
        callerPublicKey: '0xCALLER',
      };

      const result = await service.deployParticipationToken(dto);

      expect(result).toBe('unsigned-xdr');
      expect(soroban.buildDeployTransaction).toHaveBeenCalledWith(
        MOCK_PARTICIPATION_TOKEN_HASH,
        {
          escrow_contract: 'escrow-1',
          participation_token: 'token-1',
        },
        '0xCALLER',
      );
    });
  });

  describe('deployTokenFactory', () => {
    it('should build deploy transaction with name, symbol, decimal 7, and mint authority', async () => {
      const dto = {
        name: 'MicroCredit',
        symbol: 'MCR',
        escrowContractId: 'escrow-1',
        mintAuthority: '0xMINT_AUTH',
        callerPublicKey: '0xCALLER',
      };

      const result = await service.deployTokenFactory(dto);

      expect(result).toBe('unsigned-xdr');
      expect(soroban.buildDeployTransaction).toHaveBeenCalledWith(
        MOCK_TOKEN_FACTORY_HASH,
        {
          name: 'MicroCredit',
          symbol: 'MCR',
          escrow_id: 'escrow-1',
          decimal: 7,
          mint_authority: '0xMINT_AUTH',
        },
        '0xCALLER',
      );
    });
  });

  describe('deployVault', () => {
    it('should build deploy transaction with vault params', async () => {
      const dto = {
        admin: '0xADMIN',
        enabled: true,
        roiPercentage: 10,
        token: 'token-address',
        usdc: 'usdc-address',
        callerPublicKey: '0xCALLER',
      };

      const result = await service.deployVault(dto);

      expect(result).toBe('unsigned-xdr');
      expect(soroban.buildDeployTransaction).toHaveBeenCalledWith(
        MOCK_VAULT_HASH,
        {
          admin: '0xADMIN',
          enabled: true,
          roi_percentage: 10,
          token: 'token-address',
          usdc: 'usdc-address',
        },
        '0xCALLER',
      );
    });
  });

  describe('buildSetAdminTransaction', () => {
    it('should build set_admin contract call transaction', async () => {
      const dto = {
        tokenFactoryContractId: 'tf-contract-1',
        newAdmin: '0xNEW_ADMIN',
        callerPublicKey: '0xCALLER',
      };

      const result = await service.buildSetAdminTransaction(dto);

      expect(result).toBe('unsigned-xdr');
      expect(soroban.buildContractCallTransaction).toHaveBeenCalledWith(
        'tf-contract-1',
        'set_admin',
        { new_admin: '0xNEW_ADMIN' },
        '0xCALLER',
      );
    });
  });
});
