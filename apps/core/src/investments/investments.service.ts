import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.investment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { campaign: true },
    });
  }

  async findOne(id: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!investment) throw new NotFoundException(`Investment ${id} not found`);

    return investment;
  }

  findByInvestor(investorAddress: string) {
    return this.prisma.investment.findMany({
      where: { investorAddress },
      orderBy: { createdAt: 'desc' },
      include: { campaign: true },
    });
  }

  findByCampaign(campaignId: string) {
    return this.prisma.investment.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateInvestmentDto) {
    return this.prisma.investment.create({
      data: dto,
      include: { campaign: true },
    });
  }
}
