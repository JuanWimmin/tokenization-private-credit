"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@tokenization/ui/card";
import { Badge } from "@tokenization/ui/badge";
import {
  formatAddress,
} from "@tokenization/tw-blocks-shared/src/helpers/format.helper";
import { Calendar, DollarSign, ExternalLink, Coins } from "lucide-react";
import Link from "next/link";
import type { InvestmentFromApi } from "../services/investment.service";

type InvestmentCardProps = {
  investment: InvestmentFromApi;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  FUNDRAISING: "default",
  REPAYMENT: "secondary",
  CLAIMABLE: "secondary",
  CLOSED: "outline",
  PAUSED: "destructive",
  DRAFT: "outline",
};

export const InvestmentCard = ({ investment }: InvestmentCardProps) => {
  const { campaign } = investment;
  const usdcAmount = Number(investment.usdcAmount);
  const tokenAmount = Number(investment.tokenAmount);
  const createdAt = new Date(investment.createdAt);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-bold line-clamp-2">
            {campaign.name}
          </CardTitle>
          <Badge variant={STATUS_VARIANT[campaign.status] ?? "outline"}>
            {campaign.status}
          </Badge>
        </div>
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {campaign.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Invested
              </span>
            </div>
            <p className="text-2xl font-bold">
              {usdcAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-muted-foreground">USDC</p>
          </div>

          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tokens
              </span>
            </div>
            <p className="text-2xl font-bold">
              {tokenAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-muted-foreground">Received</p>
          </div>
        </div>

        {campaign.expectedReturn > 0 && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expected Return</span>
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                {Number(campaign.expectedReturn)}%
              </span>
            </div>
            {campaign.loanDuration > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-semibold">
                  {campaign.loanDuration} months
                </span>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Invested on
            </span>
            <span>
              {createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tx Hash</span>
            <Link
              href={`https://stellar.expert/explorer/testnet/tx/${investment.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:text-primary transition-colors flex items-center gap-1"
            >
              {formatAddress(investment.txHash)}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {campaign.escrowId && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Escrow</span>
              <Link
                href={`https://stellar.expert/explorer/testnet/contract/${campaign.escrowId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono hover:text-primary transition-colors flex items-center gap-1"
              >
                {formatAddress(campaign.escrowId)}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
