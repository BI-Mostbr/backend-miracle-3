import { BankProposalResponse, CreditProposal } from '@domain/entities'
import { IInterProposalRepository, IInterProposalData } from '@infra/interfaces'
import { PrismaClient } from '@prisma/client'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'

export class InterProposalRepository implements IInterProposalRepository {
  constructor(private prisma: PrismaClient) {}

  async save(
    proposal: CreditProposal,
    bankResponse: BankProposalResponse,
    flowType: string
  ): Promise<IInterProposalData> {
    try {
      console.log('💾 Salvando proposta Inter na tb_inter...')

      // Calcular LTV
      const valorFinanciamento =
        CreditProposalMapper.getFinancedValueAsNumber(proposal)
      const valorImovel =
        CreditProposalMapper.getPropertyValueAsNumber(proposal)
      const ltv = this.calculateLTV(valorFinanciamento, valorImovel)

      const interData = await this.prisma.tb_inter.create({
        data: {
          cpf: CreditProposalMapper.getCleanCpf(proposal) || '',
          id_proposta: bankResponse.proposalId || '',
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
          id_cliente_most: undefined,
          taxaIof: undefined,
          taxa: undefined,
          taxaJuros: undefined,
          cet: undefined,
          cesh: undefined,
          valorEntrada: undefined,
          valorImovel: undefined,
          valorLiberado: undefined,
          tarifaAvaliacao: undefined,
          valorPrimeiraParcela: undefined,
          valorUltimaParcela: undefined,
          totalDevido: undefined,
          produtoAprovado: undefined,
          tipoProduto: undefined,
          etapaTarefaPreAnalise: undefined,
          etapaTarefaAnaliseCredito: undefined,
          statusAnaliseCredito: undefined,
          modeloOperacional: undefined,
          sistemaAmortizacao: undefined,
          indexador: undefined,
          despesas: undefined,
          dataProposta: undefined,
          rendaSugerida: undefined,
          estadoImovel: undefined,
          tipoImovel: undefined,
          id_substatus_most: undefined,
          situacao: undefined,
          taxa_de_juros_float: undefined,
          id_cliente_incorporador: undefined,
          id_produto: undefined,
          created_at: new Date()
        }
      })

      const result: IInterProposalData = {
        id: interData.id,
        created_at: interData.created_at,
        cpf: interData.cpf ?? undefined,
        id_cliente_most: interData.id_cliente_most ?? undefined,
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
    if (!valorImovel || valorImovel === 0) {
      console.warn('⚠️ Valor do imóvel é 0, LTV será 0')
      return 0
    }

    const ltv = (valorFinanciamento / valorImovel) * 100
    console.log(
      `📊 LTV calculado: ${valorFinanciamento} / ${valorImovel} = ${ltv.toFixed(2)}%`
    )

    return Math.round(ltv * 100) / 100
  }
}
