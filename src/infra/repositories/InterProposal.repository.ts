import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { IInterProposalRepository, IInterProposalData } from '@infra/interfaces'
import { PrismaClient } from '@prisma/client'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'

export class InterProposalRepository implements IInterProposalRepository {
  constructor(private prisma: PrismaClient) {}

  async save(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    clientId?: bigint
  ): Promise<IInterProposalData> {
    try {
      console.log('💾 Salvando proposta Inter na tb_inter...')

      // Calcular LTV
      const valorFinanciamento =
        CreditProposalMapper.getFinancedValueAsNumber(proposal)
      const valorImovel =
        CreditProposalMapper.getPropertyValueAsNumber(proposal)
      const ltv = this.calculateLTV(valorFinanciamento, valorImovel)
      const valorEntrada = valorImovel - valorFinanciamento

      const interData = await this.prisma.tb_inter.create({
        data: {
          cpf: CreditProposalMapper.getCleanCpf(proposal) || '',
          id_proposta: bankResponse.bankSpecificData?.inter?.idProposta || '',
          id_simulacao: bankResponse.simulationId || '',
          valorFinanciamento: valorFinanciamento,
          prazoEmprestimo: BigInt(
            CreditProposalMapper.getTermAsNumber(proposal)
          ),
          etapaAtual: 'AGUARDANDO PROCESSAMENTO',
          ltv: ltv,
          ltv_text: `${ltv.toFixed(2)}%`,
          numero_proposta: bankResponse.proposalNumber || '',
          id_status_most: BigInt(1),
          id_situacao_most: BigInt(4),
          id_cliente_most: clientId,
          taxaIof: 0,
          taxa: undefined,
          taxaJuros: undefined,
          cet: 0,
          cesh: 0,
          valorEntrada: valorEntrada,
          valorImovel: valorImovel,
          valorLiberado: 0,
          tarifaAvaliacao: 0,
          valorPrimeiraParcela: 0,
          valorUltimaParcela: 0,
          totalDevido: 0,
          produtoAprovado: undefined,
          tipoProduto: undefined,
          etapaTarefaPreAnalise: undefined,
          etapaTarefaAnaliseCredito: undefined,
          statusAnaliseCredito: undefined,
          modeloOperacional: undefined,
          sistemaAmortizacao: undefined,
          indexador: undefined,
          despesas: 0,
          dataProposta: undefined,
          rendaSugerida: 0,
          estadoImovel: undefined,
          tipoImovel: undefined,
          id_substatus_most: undefined,
          situacao: undefined,
          taxa_de_juros_float: 0,
          id_cliente_incorporador: undefined,
          id_produto: undefined,
          created_at: new Date()
        }
      })

      const result: IInterProposalData = {
        id: interData.id,
        created_at: interData.created_at,
        cpf: interData.cpf ?? undefined,
        id_cliente_most: clientId,
        id_proposta: interData.id_proposta ?? undefined,
        id_simulacao: interData.id_simulacao ?? undefined,
        taxaIof: interData.taxaIof ?? undefined,
        taxa: interData.taxa ?? undefined,
        taxaJuros: interData.taxaJuros ?? undefined,
        cet: interData.cet ?? undefined,
        cesh: interData.cesh ?? undefined,
        valorFinanciamento: interData.valorFinanciamento ?? undefined,
        valorEntrada: interData.valorEntrada ?? undefined,
        valorImovel: interData.valorImovel ?? undefined,
        valorLiberado: interData.valorLiberado ?? undefined,
        tarifaAvaliacao: interData.tarifaAvaliacao ?? undefined,
        valorPrimeiraParcela: interData.valorPrimeiraParcela ?? undefined,
        valorUltimaParcela: interData.valorUltimaParcela ?? undefined,
        totalDevido: interData.totalDevido ?? undefined,
        prazoEmprestimo: interData.prazoEmprestimo ?? undefined,
        produtoAprovado: interData.produtoAprovado ?? undefined,
        tipoProduto: interData.tipoProduto ?? undefined,
        etapaAtual: interData.etapaAtual ?? undefined,
        etapaTarefaPreAnalise: interData.etapaTarefaPreAnalise ?? undefined,
        etapaTarefaAnaliseCredito:
          interData.etapaTarefaAnaliseCredito ?? undefined,
        statusAnaliseCredito: interData.statusAnaliseCredito ?? undefined,
        modeloOperacional: interData.modeloOperacional ?? undefined,
        sistemaAmortizacao: interData.sistemaAmortizacao ?? undefined,
        indexador: interData.indexador ?? undefined,
        despesas: interData.despesas ?? undefined,
        dataProposta: interData.dataProposta ?? undefined,
        rendaSugerida: interData.rendaSugerida ?? undefined,
        estadoImovel: interData.estadoImovel ?? undefined,
        tipoImovel: interData.tipoImovel ?? undefined,
        id_status_most: interData.id_status_most ?? undefined,
        id_situacao_most: interData.id_situacao_most ?? undefined,
        id_substatus_most: interData.id_substatus_most ?? undefined,
        situacao: interData.situacao ?? undefined,
        ltv: interData.ltv ?? undefined,
        taxa_de_juros_float: interData.taxa_de_juros_float ?? undefined,
        ltv_text: interData.ltv_text ?? undefined,
        numero_proposta: interData.numero_proposta ?? undefined,
        id_cliente_incorporador: interData.id_cliente_incorporador ?? undefined,
        id_produto: interData.id_produto ?? undefined
      }

      return result
    } catch (error) {
      console.error('Erro ao salvar proposta Inter:', error)
      throw new Error(
        `Falha ao salvar proposta Inter: ${(error as Error).message}`
      )
    }
  }

  private calculateLTV(
    valorFinanciamento: number,
    valorImovel: number
  ): number {
    if (valorFinanciamento < 0 || valorImovel < 0) {
      throw new Error('Valores não podem ser negativos')
    }

    if (!valorImovel || valorImovel === 0) {
      console.warn('Valor do imóvel é 0, LTV será 0')
      return 0
    }

    if (valorFinanciamento === 0) {
      return 0
    }

    const ltv = (valorFinanciamento / valorImovel) * 100
    const ltvFinal = ltv > 75 ? 75 : ltv

    if (ltv > 80) {
      console.log(`LTV ajustado: ${ltv.toFixed(2)}% → 75% (limite aplicado)`)
    } else {
      console.log(`LTV calculado: ${ltvFinal.toFixed(2)}%`)
    }

    return Number(ltvFinal.toFixed(2))
  }
}
