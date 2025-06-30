import { CreditProposal } from '@domain/entities'
import {
  IClientData,
  IClientDetailsData,
  IClientRepository
} from '@infra/interfaces'
import { PrismaClient } from '@prisma/client'

export class ClientRepository implements IClientRepository {
  constructor(private prisma: PrismaClient) {}

  async save(proposal: CreditProposal): Promise<IClientData> {
    try {
      const clientData = await this.prisma.tb_clientes.create({
        data: {
          cpf: proposal.customerCpf,
          valor_solicitado: proposal.financingValue,
          id_produto: this.getProductId(proposal.productType),
          id_consultor: proposal.consultorId
            ? BigInt(proposal.consultorId)
            : undefined,
          parceiro: proposal.partnerId,
          dt_ult_atualizacao: new Date().toISOString(),
          created_at: new Date()
        }
      })

      console.log(`💾 Cliente salvo com ID: ${clientData.id}`)
      return clientData
    } catch (error) {
      console.error('❌ Erro ao salvar cliente:', error)
      throw new Error(`Falha ao salvar cliente: ${(error as Error).message}`)
    }
  }

  async saveDetails(
    proposal: CreditProposal,
    clientId: bigint
  ): Promise<IClientDetailsData> {
    try {
      // Converter valores monetários
      const cleanMoneyValue = (value: string): number => {
        if (typeof value === 'number') return value
        return (
          parseFloat(
            value
              ?.toString()
              .replace(/[R$\s.,]/g, '')
              .replace(',', '.') || '0'
          ) || 0
        )
      }

      const clientDetailsData = await this.prisma.clientes_detalhes.create({
        data: {
          cpf_cnpj: BigInt(proposal.customerCpf),
          nome: proposal.customerName,
          estado_civil: proposal.customerMaritalStatus,
          tipo_imovel: proposal.propertyType,
          sexo: proposal.customerGender,
          tipo_contato: 'Celular',
          rg: proposal.documentNumber,
          tipo_endereco: 'Residencial',
          tipo_renda: proposal.customerIncomeType,
          tipo_amortizacao: proposal.amortizationType,
          tipo_taxa_financiamento: proposal.financingRate,
          UF_proponente: proposal.customerAddress.state,
          CEP: proposal.customerAddress.zipCode,
          valor_entrada: proposal.downPayment,
          prazo: proposal.installments,
          municipio_imovel: proposal.propertyCity,
          FGTS: proposal.useFgts,
          UF_imovel: proposal.propertyState,
          tipo_carteira: 'SFH',
          ITBI: proposal.useItbi,
          vlr_itbi: proposal.itbiValue,
          dt_nasc: proposal.customerBirthDate,
          nome_mae: proposal.customerMotherName,
          orgao_expedidor: proposal.documentIssuer,
          uf_rg: proposal.documentUf,
          data_emissao_rg: proposal.documentIssueDate,
          nr_contato: proposal.customerPhone,
          email: proposal.customerEmail,
          endereco: proposal.customerAddress.street,
          numero_endereco: proposal.customerAddress.number,
          bairro_endereco: proposal.customerAddress.neighborhood,
          complemento_endereco: proposal.customerAddress.complement,
          cidade_endereco: proposal.customerAddress.city,
          profissao: proposal.customerProfession,
          regime_trabalho: proposal.customerWorkRegime,
          vlr_renda_mensal: proposal.customerIncome,
          estado_civil_cliente: proposal.customerMaritalStatus,
          segundo_proponente: !!proposal.spouse,
          cpf_cliente: proposal.customerCpf,
          id_consultor: proposal.consultorId
            ? BigInt(proposal.consultorId)
            : undefined,
          parceiro: proposal.partnerId,
          valor_imovel: proposal.propertyValue,
          vlr_solicitado: proposal.financingValue,
          vlr_fgts: proposal.fgtsValue,
          tipo_documento: proposal.documentType,
          created_at: new Date()
        }
      })

      console.log(
        `💾 Detalhes do cliente salvos com ID: ${clientDetailsData.id}`
      )
      return clientDetailsData
    } catch (error) {
      console.error('❌ Erro ao salvar detalhes do cliente:', error)
      throw new Error(
        `Falha ao salvar detalhes do cliente: ${(error as Error).message}`
      )
    }
  }

  async findByCpf(cpf: string): Promise<IClientData | null> {
    try {
      const client = await this.prisma.tb_clientes.findUnique({
        where: { cpf }
      })
      return client
    } catch (error) {
      console.error('❌ Erro ao buscar cliente por CPF:', error)
      return null
    }
  }

  async updateBankProposal(
    cpf: string,
    bankName: string,
    proposalId: string
  ): Promise<void> {
    try {
      const updateData: any = {}

      switch (bankName.toLowerCase()) {
        case 'itau':
          updateData.id_itau = proposalId
          break
        case 'inter':
          updateData.id_inter = proposalId
          break
        case 'santander':
          updateData.id_santander = BigInt(proposalId)
          break
        case 'bradesco':
          updateData.id_bradesco = BigInt(proposalId)
          break
      }

      updateData.dt_ult_atualizacao = new Date().toISOString()

      await this.prisma.tb_clientes.update({
        where: { cpf },
        data: updateData
      })

      console.log(
        `💾 Cliente atualizado com proposta ${bankName}: ${proposalId}`
      )
    } catch (error) {
      console.error('❌ Erro ao atualizar proposta do cliente:', error)
      throw new Error(
        `Falha ao atualizar proposta do cliente: ${(error as Error).message}`
      )
    }
  }

  private getProductId(productType: string): number {
    const productMap: { [key: string]: number } = {
      ISOLADO: 1,
      PILOTO: 2,
      REPASSE: 3,
      PORTABILIDADE: 4
    }
    return productMap[productType] || 1
  }
}
