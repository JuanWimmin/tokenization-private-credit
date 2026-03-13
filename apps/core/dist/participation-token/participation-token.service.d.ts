import { SorobanService } from '../soroban/soroban.service';
import { MintDto } from './dto/mint.dto';
import { SetAdminDto } from './dto/set-admin.dto';
import { ApproveDto } from './dto/approve.dto';
import { TransferDto } from './dto/transfer.dto';
import { TransferFromDto } from './dto/transfer-from.dto';
import { BurnDto } from './dto/burn.dto';
import { BurnFromDto } from './dto/burn-from.dto';
export declare class ParticipationTokenService {
    private readonly soroban;
    constructor(soroban: SorobanService);
    mint(dto: MintDto): Promise<string>;
    setAdmin(dto: SetAdminDto): Promise<string>;
    approve(dto: ApproveDto): Promise<string>;
    transfer(dto: TransferDto): Promise<string>;
    transferFrom(dto: TransferFromDto): Promise<string>;
    burn(dto: BurnDto): Promise<string>;
    burnFrom(dto: BurnFromDto): Promise<string>;
    getBalance(contractId: string, address: string, callerPublicKey: string): Promise<unknown>;
    getAllowance(contractId: string, from: string, spender: string, callerPublicKey: string): Promise<unknown>;
    getDecimals(contractId: string, callerPublicKey: string): Promise<unknown>;
    getName(contractId: string, callerPublicKey: string): Promise<unknown>;
    getSymbol(contractId: string, callerPublicKey: string): Promise<unknown>;
    getEscrowId(contractId: string, callerPublicKey: string): Promise<unknown>;
}
