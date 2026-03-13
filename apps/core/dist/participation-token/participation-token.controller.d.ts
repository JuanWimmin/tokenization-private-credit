import { ParticipationTokenService } from './participation-token.service';
import { MintDto } from './dto/mint.dto';
import { SetAdminDto } from './dto/set-admin.dto';
import { ApproveDto } from './dto/approve.dto';
import { TransferDto } from './dto/transfer.dto';
import { TransferFromDto } from './dto/transfer-from.dto';
import { BurnDto } from './dto/burn.dto';
import { BurnFromDto } from './dto/burn-from.dto';
export declare class ParticipationTokenController {
    private readonly participationTokenService;
    constructor(participationTokenService: ParticipationTokenService);
    mint(dto: MintDto): Promise<{
        unsignedXdr: string;
    }>;
    setAdmin(dto: SetAdminDto): Promise<{
        unsignedXdr: string;
    }>;
    approve(dto: ApproveDto): Promise<{
        unsignedXdr: string;
    }>;
    transfer(dto: TransferDto): Promise<{
        unsignedXdr: string;
    }>;
    transferFrom(dto: TransferFromDto): Promise<{
        unsignedXdr: string;
    }>;
    burn(dto: BurnDto): Promise<{
        unsignedXdr: string;
    }>;
    burnFrom(dto: BurnFromDto): Promise<{
        unsignedXdr: string;
    }>;
    getBalance(contractId: string, address: string, callerPublicKey: string): Promise<{
        balance: string;
    }>;
    getAllowance(contractId: string, from: string, spender: string, callerPublicKey: string): Promise<{
        allowance: string;
    }>;
    getDecimals(contractId: string, callerPublicKey: string): Promise<{
        decimals: unknown;
    }>;
    getName(contractId: string, callerPublicKey: string): Promise<{
        name: string;
    }>;
    getSymbol(contractId: string, callerPublicKey: string): Promise<{
        symbol: string;
    }>;
    getEscrowId(contractId: string, callerPublicKey: string): Promise<{
        escrowId: string;
    }>;
}
