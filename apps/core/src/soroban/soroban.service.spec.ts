import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SorobanService } from './soroban.service';

jest.mock('@stellar/stellar-sdk', () => ({
  contract: {
    Client: {
      deploy: jest.fn(),
      from: jest.fn(),
    },
  },
  Networks: { TESTNET: 'Test SDF Network ; September 2015' },
}));

describe('SorobanService', () => {
  let service: SorobanService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sdkMock: any;

  beforeEach(async () => {
    process.env.SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
    sdkMock = jest.requireMock('@stellar/stellar-sdk');

    const module: TestingModule = await Test.createTestingModule({
      providers: [SorobanService],
    }).compile();

    service = module.get<SorobanService>(SorobanService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('contract error parsing with token-sale context', () => {
    it('should map error #5 to "Hard cap exceeded"', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('HostError: Error(Contract, #5)'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'buy', {}, 'pk', 'token-sale');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(5);
        expect(res.message).toContain('Hard cap exceeded');
      }
    });

    it('should map error #6 to "Investor cap exceeded"', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Error(Contract, #6)'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'buy', {}, 'pk', 'token-sale');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(6);
        expect(res.message).toContain('maximum investment');
      }
    });

    it('should map error #7 to "Amount must be positive"', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Error(Contract, #7)'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'buy', {}, 'pk', 'token-sale');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(7);
        expect(res.message).toContain('positive');
      }
    });
  });

  describe('contract error parsing with vault context', () => {
    it('should map error #3 to "Exchange is currently disabled"', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Error(Contract, #3)'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'claim', {}, 'pk', 'vault');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(3);
        expect(res.message).toContain('disabled');
      }
    });

    it('should map error #4 to "no tokens to claim"', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Error(Contract, #4)'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'claim', {}, 'pk', 'vault');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(4);
        expect(res.message).toContain('no tokens');
      }
    });

    it('should map error #5 to "not enough USDC"', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Error(Contract, #5)'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'claim', {}, 'pk', 'vault');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(5);
        expect(res.message).toContain('not have enough USDC');
      }
    });
  });

  describe('contract error parsing without context', () => {
    it('should return generic error code message', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Error(Contract, #5)'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'method', {}, 'pk');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(5);
        expect(res.message).toBe('Contract error code 5');
      }
    });

    it('should return generic message for unknown error code', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Error(Contract, #99)'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'method', {}, 'pk', 'vault');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(99);
        expect(res.message).toBe('Contract error code 99');
      }
    });
  });

  describe('simulation and host errors', () => {
    it('should throw BadRequestException for simulation errors', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('simulation failed: insufficient resources'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'method', {}, 'pk');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.error).toBe('SimulationError');
      }
    });

    it('should throw BadRequestException for HostError', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('HostError: some internal failure'),
      );

      try {
        await service.buildContractCallTransaction('cid', 'method', {}, 'pk');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const res = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.error).toBe('HostError');
      }
    });

    it('should re-throw non-contract errors as-is', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Network timeout'),
      );

      await expect(
        service.buildContractCallTransaction('cid', 'method', {}, 'pk'),
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('readContractState error handling', () => {
    it('should throw BadRequestException for contract errors in read calls', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Error(Contract, #4)'),
      );

      await expect(
        service.readContractState('cid', 'preview_claim', {}, 'pk', 'vault'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should re-throw non-contract errors in read calls', async () => {
      sdkMock.contract.Client.from.mockRejectedValue(
        new Error('Connection refused'),
      );

      await expect(
        service.readContractState('cid', 'method', {}, 'pk'),
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('buildDeployTransaction error handling', () => {
    it('should throw BadRequestException for contract errors in deploy', async () => {
      sdkMock.contract.Client.deploy.mockRejectedValue(
        new Error('Error(Contract, #8)'),
      );

      await expect(
        service.buildDeployTransaction('hash', {}, 'pk'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
