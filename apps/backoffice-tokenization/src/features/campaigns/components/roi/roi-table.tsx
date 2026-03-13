"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@tokenization/ui/table";
import { Button } from "@tokenization/ui/button";
import { useGetMultipleEscrowBalancesQuery } from "@tokenization/tw-blocks-shared/src/tanstack/useGetMultipleEscrowBalances";
import { RoiTableRow } from "./roi-table-row";
import type { RoiTableProps } from "./types";

const PAGE_SIZE = 4;

export function RoiTable({ campaigns, onAddFunds }: RoiTableProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const escrowIds = campaigns.map((c) => c.escrowId).filter(Boolean);
  const { data: balances = [] } = useGetMultipleEscrowBalancesQuery({
    addresses: escrowIds,
    enabled: escrowIds.length > 0,
  });

  const balanceMap = new Map(balances.map((b) => [b.address, b.balance]));

  const visible = campaigns.slice(0, visibleCount);
  const hasMore = visibleCount < campaigns.length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden p-3">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Nombre del Proyecto
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Invertido
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Estado
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-widest text-text-muted text-right">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {visible.map((campaign) => (
            <RoiTableRow
              key={campaign.id}
              campaign={campaign}
              balance={balanceMap.get(campaign.escrowId) ?? 0}
              onAddFunds={onAddFunds}
            />
          ))}
        </TableBody>
      </Table>

      {hasMore && (
        <div className="flex justify-center mt-3 pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
