import { CreditProposal } from '@domain/entities'
import {
  IProposalClientData,
  IProposalClientDetailsData,
  IProposalClientRepository
} from '@infra/interfaces/ProposalClientRepository.interface'
import { PrismaClient } from '@prisma/client'
import { convertDateBrToIso } from 'Utils/convertData'
import { cleanCpf, cleanMoney } from 'Utils/removeMasks'

export class ClientRepository implements IProposalClientRepository {
  constructor(private prisma: PrismaClient) {}

  async save(proposal: CreditProposal): Promise<IProposalClientData> {
    try {
      console.log(`💾 Salvando cliente da proposta - CPF: ${proposal.document}`)
      const clientData = await this.prisma.tb_clientes.create({
        data: {
          cpf: cleanCpf(proposal.document),
          valor_solicitado: cleanMoney(proposal.financedValue),
          id_produto: this.getProductId(proposal.selectedProductOption),
          id_consultor: proposal.consultorId
            ? BigInt(proposal.consultorId)
            : null,
          parceiro: proposal.selectedPartnerOption || null,
          created_at: new Date()
        }
      })
      return clientData
    } catch (error) {
      console.error('❌ Erro ao salvar cliente da proposta:', error)
      throw new Error(
        `Falha ao salvar cliente da proposta: ${(error as Error).message}`
      )
    }
  }

  async saveDetails(
    proposal: CreditProposal,
    clientId: bigint
  ): Promise<IProposalClientDetailsData> {
    try {
      const propertyValue = cleanMoney(proposal.propertyValue)
      const financedValue = cleanMoney(proposal.financedValue)
      const downPayment = propertyValue - financedValue
      const clientDetails = await this.prisma.clientes_detalhes.create({
        data: {
          cpf_cnpj: BigInt(cleanCpf(proposal.document).replace(/\D/g, '')),
          nome: proposal.name,
          estado_civil: proposal.maritalStatus,
          nacionalidade: 'BRASILEIRA',
          tipo_imovel: proposal.propertyType,
          sexo: proposal.gender,
          tipo_contato: 'Celular',
          rg: proposal.documentNumber,
          tipo_endereco: 'Residencial',
          tipo_renda: proposal.workType,
          tipo_amortizacao: proposal.amortization,
          tipo_taxa_financiamento: proposal.financingRate,
          UF_proponente: proposal.ufDataUser,
          CEP: proposal.userAddress?.cep?.replace(/\D/g, '') || null,
          valor_entrada: downPayment,
          prazo: parseInt(proposal.term),
          municipio_imovel: proposal.cities,
          FGTS: proposal.useFGTS,
          nr_pis: null,
          UF_imovel: proposal.uf,
          tipo_carteira: 'SFH',
          seguradora: 'ITAU',
          ITBI: proposal.itbiPayment,
          percent_itbi: proposal.itbiValue ? '3%' : null,
          vlr_itbi: proposal.itbiValue ? cleanMoney(proposal.itbiValue) : 0,
          id_incorporadora: proposal.construction?.businessPersonId
            ? BigInt(proposal.construction.businessPersonId)
            : null,
          id_empreedimento: proposal.construction?.enterpriseId
            ? BigInt(proposal.construction.enterpriseId)
            : null,
          id_bloco: proposal.construction?.blockId
            ? BigInt(proposal.construction.blockId)
            : null,
          id_unidade: proposal.construction?.unitId
            ? BigInt(proposal.construction.unitId)
            : null,
          dt_nasc: convertDateBrToIso(proposal.birthday),
          nome_mae: proposal.motherName,
          orgao_expedidor: proposal.documentIssuer,
          uf_rg: proposal.ufDataUser,
          data_emissao_rg: proposal.documentIssueDate || null,
          nr_contato: proposal.phone.replace(/\D/g, ''),
          email: proposal.email,
          endereco: proposal.userAddress?.logradouro || null,
          numero_endereco: proposal.userAddress?.number || null,
          bairro_endereco: proposal.userAddress?.bairro || null,
          complemento_endereco: proposal.userAddress?.complement || null,
          cidade_endereco: proposal.userAddress?.localidade || null,
          profissao: proposal.profession,
          regime_trabalho: proposal.workType,
          cnpj_empresa_cliente: null,
          nome_empresa: null,
          dados_bancarios: null,
          data_admissao: null,
          outras_rendas: null,
          vlr_renda_mensal: cleanMoney(proposal.monthlyIncome),
          estado_civil_cliente: proposal.maritalStatus,
          regime_casamento: proposal.matrimonialRegime || null,
          segundo_proponente: !!proposal.spouse,
          uniao_estavel: proposal.maritalStatus.toLowerCase().includes('união'),
          id_segundo_proponente: null,
          id_terceiro_proponente: null,
          terceiro_proponente: false,
          cpf_cliente: cleanCpf(proposal.document),
          id_consultor: proposal.consultorId
            ? BigInt(proposal.consultorId)
            : null,
          id_lider: null,
          parceiro: proposal.selectedPartnerOption || null,
          valor_imovel: propertyValue,
          credito_aprovado: null,
          taxa_juros: null,
          vlr_solicitado: financedValue,
          vlr_fgts: proposal.fgtsValue ? cleanMoney(proposal.fgtsValue) : 0,
          id_profissao: null,
          tipo_documento: proposal.documentType,
          cargo: proposal.professionalPosition || null,
          tipo_residencia: 'PROPRIA',
          agencia: proposal.agency ? BigInt(proposal.agency) : null,
          conta: proposal.account ? BigInt(proposal.account) : null,
          digitoConta: proposal.accountId ? BigInt(proposal.accountId) : null,
          codigoCategoriaProfissao: null,
          percent_itbi_number: proposal.itbiValue ? 3 : null,
          created_at: new Date()
        }
      })
      return clientDetails
    } catch (error) {
      console.error('❌ Erro ao salvar detalhes do cliente da proposta:', error)
      console.error('❌ Detalhes do erro:', error)
      throw new Error(
        `Falha ao salvar detalhes do cliente da proposta: ${(error as Error).message}`
      )
    }
  }

  async findByCpf(cpf: string): Promise<IProposalClientData | null> {
    try {
      const client = await this.prisma.tb_clientes.findFirst({
        where: {
          cpf: cleanCpf(cpf)
        }
      })

      return client
    } catch (error) {
      console.error('❌ Erro ao buscar cliente da proposta por CPF:', error)
      return null
    }
  }

  async findDetailsByCpf(
    cpf: string
  ): Promise<IProposalClientDetailsData | null> {
    try {
      const cpfNumber = BigInt(cleanCpf(cpf).replace(/\D/g, ''))
      const details = await this.prisma.clientes_detalhes.findFirst({
        where: {
          cpf_cnpj: cpfNumber
        }
      })

      return details
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes do cliente da proposta:', error)
      return null
    }
  }

  async updateBankProposal(
    cpf: string,
    bankName: string,
    proposalId: string
  ): Promise<void> {
    try {
      const client = await this.findByCpf(cpf)
      if (!client) {
        throw new Error(`Cliente com CPF ${cpf} não encontrado`)
      }
      const bankField = `id_${bankName.toLowerCase()}`

      await this.prisma.tb_clientes.update({
        where: { id: client.id },
        data: {
          [bankField]: proposalId,
          dt_ult_atualizacao: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('❌ Erro ao atualizar proposta bancária:', error)
      throw error
    }
  }

  async updateProposalStatus(
    cpf: string,
    bankName: string,
    status: string
  ): Promise<void> {
    try {
      const client = await this.findByCpf(cpf)
      if (!client) {
        throw new Error(`Cliente com CPF ${cpf} não encontrado`)
      }

      await this.prisma.tb_clientes.update({
        where: { id: client.id },
        data: {
          situacao_itau_teste: status,
          dt_ult_atualizacao: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('❌ Erro ao atualizar status da proposta:', error)
      throw error
    }
  }

  private getProductId(productOption: string): number {
    const productMap: { [key: string]: number } = {
      ISOLADO: 1,
      PILOTO: 2,
      REPASSE: 3,
      PORTABILIDADE: 4
    }
    return productMap[productOption] || 1
  }
}
