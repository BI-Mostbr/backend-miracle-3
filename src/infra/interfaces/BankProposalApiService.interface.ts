import { BankProposalResponse, CreditProposal } from '@domain/entities'

export interface IBankProposalApiService {
  sendProposal(proposal: CreditProposal): Promise<BankProposalResponse>
  getBankName(): string
}
