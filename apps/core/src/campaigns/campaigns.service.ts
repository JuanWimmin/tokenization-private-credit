import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CampaignStatus, Campaign } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';

const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  [CampaignStatus.DRAFT]: [CampaignStatus.FUNDRAISING, CampaignStatus.PAUSED],
  [CampaignStatus.FUNDRAISING]: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED],
  [CampaignStatus.ACTIVE]: [CampaignStatus.REPAYMENT, CampaignStatus.PAUSED],
  [CampaignStatus.REPAYMENT]: [CampaignStatus.CLAIMABLE, CampaignStatus.PAUSED],
  [CampaignStatus.CLAIMABLE]: [CampaignStatus.CLOSED, CampaignStatus.PAUSED],
  [CampaignStatus.CLOSED]: [],
  [CampaignStatus.PAUSED]: [],
};

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { investments: true },
    });

    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);

    return campaign;
  }

  create(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: { ...dto, status: CampaignStatus.FUNDRAISING },
    });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);

    return this.prisma.campaign.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.campaign.delete({ where: { id } });
  }

  async updateStatus(id: string, dto: UpdateCampaignStatusDto) {
    const campaign = await this.findOne(id);
    const currentStatus = campaign.status;
    const newStatus = dto.status;

    this.validateStatusTransition(
      currentStatus,
      newStatus,
      campaign.previousStatus,
    );
    this.validatePrerequisites(campaign, newStatus);

    const data: {
      status: CampaignStatus;
      previousStatus?: CampaignStatus | null;
    } = {
      status: newStatus,
    };

    if (newStatus === CampaignStatus.PAUSED) {
      data.previousStatus = currentStatus;
    } else if (currentStatus === CampaignStatus.PAUSED) {
      data.previousStatus = null;
    }

    return this.prisma.campaign.update({
      where: { id },
      data,
    });
  }

  private validateStatusTransition(
    current: CampaignStatus,
    next: CampaignStatus,
    previousStatus: CampaignStatus | null,
  ) {
    if (current === next) {
      throw new BadRequestException(`Campaign is already in status ${current}`);
    }

    if (current === CampaignStatus.PAUSED) {
      if (!previousStatus) {
        throw new BadRequestException(
          'Cannot resume: no previous status recorded',
        );
      }
      if (next !== previousStatus) {
        throw new BadRequestException(
          `Can only resume to previous status ${previousStatus}, not ${next}`,
        );
      }
      return;
    }

    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}`,
      );
    }
  }

  private validatePrerequisites(campaign: Campaign, newStatus: CampaignStatus) {
    if (newStatus === CampaignStatus.FUNDRAISING) {
      const missing: string[] = [];
      if (!campaign.escrowId) missing.push('escrowId');
      if (!campaign.tokenSaleId) missing.push('tokenSaleId');
      if (!campaign.tokenFactoryId) missing.push('tokenFactoryId');
      if (missing.length > 0) {
        throw new BadRequestException(
          `Cannot transition to FUNDRAISING: missing ${missing.join(', ')}`,
        );
      }
    }

    if (newStatus === CampaignStatus.CLAIMABLE) {
      if (!campaign.vaultId) {
        throw new BadRequestException(
          'Cannot transition to CLAIMABLE: missing vaultId',
        );
      }
    }
  }
}
