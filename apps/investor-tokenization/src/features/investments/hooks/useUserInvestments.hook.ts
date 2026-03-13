import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import {
  fetchMyInvestments,
  type InvestmentFromApi,
} from "../services/investment.service";

export const useUserInvestments = () => {
  const { walletAddress } = useWalletContext();

  return useQuery<InvestmentFromApi[]>({
    queryKey: ["user-investments", walletAddress],
    queryFn: () => fetchMyInvestments(walletAddress!),
    enabled: Boolean(walletAddress),
    staleTime: 1000 * 60 * 2,
  });
};
