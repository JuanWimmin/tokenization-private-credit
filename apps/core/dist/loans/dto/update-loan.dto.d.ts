import { LoanStatus } from '@prisma/client';
export declare class UpdateLoanDto {
    status?: LoanStatus;
    milestoneIndex?: number;
    disbursedAt?: string;
    repaidAt?: string;
}
