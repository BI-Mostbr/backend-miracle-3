import { CreditProposal } from '@domain/entities'
import {
  IClientData,
  IClientDetailsData,
  IClientRepository
} from '@infra/interfaces'
import { PrismaClient } from '@prisma/client'
import { convertDateBrToIso } from 'Utils/convertData'
import { cleanCpf, cleanMoney } from 'Utils/removeMasks'

export class ClientRepository implements IClientRepository {
  constructor(private prisma: PrismaClient) {}

  async save(proposal: CreditProposal): Promise<IClientData> {
    try {
      const clientData = await this.prisma.tb_clientes.create({
        data: {
          cpf: cleanCpf(proposal.document),
          valor_solicitado: cleanMoney(proposal.financedValue),
          id_produto: this.getProductId(proposal.selectedProductOption),
          id_consultor: proposal.consultorId
            ? BigInt(proposal.consultorId)
            : undefined,
          parceiro: proposal.partnerId,
          dt_ult_atualizacao: new Date().toISOString()
        }
      })

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
      const propertyValue = cleanMoney(proposal.propertyValue)
      const financedValue = cleanMoney(proposal.financedValue)

      const downPayment = propertyValue - financedValue
      const clientDetailsData = await this.prisma.clientes_detalhes.create({
        data: {
          cpf_cnpj: 0,
          nome: proposal.name,
          estado_civil: proposal.maritalStatus,
          tipo_imovel: proposal.propertyType,
          sexo: proposal.gender,
          tipo_contato: 'Celular',
          rg: proposal.documentNumber,
          tipo_endereco: 'Residencial',
          tipo_renda: proposal.workType,
          tipo_amortizacao: proposal.amortization,
          tipo_taxa_financiamento: proposal.financingRate,
          UF_proponente: proposal.uf,
          CEP: proposal.userAddress.cep,
          valor_entrada: downPayment,
          prazo: Number(proposal.term),
          municipio_imovel: proposal.cities,
          FGTS: proposal.useFGTS,
          UF_imovel: proposal.uf,
          tipo_carteira: 'SFH',
          ITBI: proposal.itbiPayment,
          vlr_itbi: cleanMoney(proposal.itbiValue || '0'),
          dt_nasc: convertDateBrToIso(proposal.birthday),
          nome_mae: proposal.motherName,
          orgao_expedidor: proposal.documentIssuer,
          uf_rg: proposal.ufDataUser,
          data_emissao_rg: proposal.documentIssueDate,
          nr_contato: proposal.phone,
          email: proposal.email,
          endereco: proposal.userAddress.logradouro,
          numero_endereco: proposal.userAddress.number,
          bairro_endereco: proposal.userAddress.localidade,
          complemento_endereco: proposal.userAddress.complement,
          cidade_endereco: proposal.userAddress.localidade,
          profissao: proposal.profession,
          regime_trabalho: proposal.workType,
          vlr_renda_mensal: cleanMoney(proposal.monthlyIncome),
          estado_civil_cliente: proposal.maritalStatus,
          segundo_proponente: !!proposal.spouse,
          cpf_cliente: cleanCpf(proposal.document),
          id_consultor: proposal.consultorId
            ? BigInt(proposal.consultorId)
            : undefined,
          parceiro: proposal.partnerId,
          valor_imovel: propertyValue,
          vlr_solicitado: financedValue,
          vlr_fgts: cleanMoney(proposal.fgtsValue || '0'),
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
