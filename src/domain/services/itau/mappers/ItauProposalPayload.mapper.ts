import { CreditProposal } from '@domain/entities'
import { mapToPropertyTypeItau } from 'Utils/mapToProperty'
import { mapToFeeTypeItau } from 'Utils/mapToFeeType'
import { convertDateBrToIso } from 'Utils/convertData'
import { productItau } from 'Utils/mapToProduct'
import { ItauProposalPayload } from '../types/ItauProposalPayload.type'
import { CreditProposalMapper } from '@infra/mappers/CreditProposal.mapper'

export interface ConsultorData {
  nome_itau?: string
  cpf?: string
}

export class ItauProposalPayloadMapper {
  static convertToPayload(
    proposal: CreditProposal,
    consultorData?: ConsultorData
  ): ItauProposalPayload {
    const propertyType = mapToPropertyTypeItau(proposal.propertyType)
    const feeType = mapToFeeTypeItau(proposal.financingRate)
    const productType = productItau(proposal.selectedProductOption)
    const birthDate = convertDateBrToIso(proposal.birthday)

    // Verificar se existe cônjuge válido
    const hasValidSpouse =
      proposal.spouse &&
      proposal.spouse.document &&
      proposal.spouse.name &&
      proposal.maritalStatus.toLowerCase() !== 'solteiro'

    const payload: ItauProposalPayload = {
      productType: productType,
      indication: {
        partner: {
          code: process.env.ITAU_CODE_PARTNER || '',
          cnpj: process.env.ITAU_CNPJ_PARTNER || '',
          agent: {
            name: consultorData?.nome_itau!,
            cpf: consultorData?.cpf!
          }
        }
      },
      property: {
        type: propertyType,
        state: proposal.uf
      },
      financing: {
        amortizationType: proposal.amortization.toUpperCase(),
        financingValue: CreditProposalMapper.getFinancedValueAsNumber(proposal),
        downPayment: CreditProposalMapper.getDownPayment(proposal),
        itbiValue: CreditProposalMapper.getItbiValueAsNumber(proposal),
        includeRegistryCosts: true,
        feeType: feeType,
        propertyPrice: CreditProposalMapper.getPropertyValueAsNumber(proposal),
        period: CreditProposalMapper.getTermAsNumber(proposal),
        walletType: 'SFH',
        insuranceType: 'ITAU'
      },
      proponents: [
        {
          email: proposal.email,
          holder: true,
          identification: {
            cpf: CreditProposalMapper.getCleanCpf(proposal),
            name: proposal.name,
            birthDate: birthDate,
            nationality: 'BRASILEIRA'
          },
          occupation: {
            profession: proposal.profession,
            incomeType: this.mapIncomeType(proposal.workType),
            incomeValue: CreditProposalMapper.getMonthlyIncomeAsNumber(proposal)
          },
          relationship: {
            maritalStatus: this.mapMaritalStatus(proposal.maritalStatus),
            liveTogether: !!hasValidSpouse,
            composeIncome: hasValidSpouse
              ? proposal.spouse?.spouseContributesIncome || false
              : false,
            spouse: hasValidSpouse
              ? {
                  email: proposal.spouse!.email,
                  identification: {
                    cpf: proposal.spouse!.document.replace(/\D/g, ''),
                    name: proposal.spouse!.name,
                    birthDate: convertDateBrToIso(proposal.spouse!.birthday),
                    nationality: 'BRASILEIRA'
                  },
                  occupation: {
                    profession: proposal.spouse!.profession,
                    incomeType: this.mapIncomeType(proposal.spouse!.workType),
                    incomeValue:
                      parseFloat(
                        proposal
                          .spouse!.monthlyIncome.replace(/[R$\s.,]/g, '')
                          .replace(',', '.')
                      ) || 0
                  },
                  address: {
                    type: 'RESIDENTIAL',
                    zipCode: proposal.spouse!.cep.replace(/\D/g, ''),
                    state: proposal.spouse!.ufRedisence,
                    city: proposal.spouse!.localidade,
                    street: proposal.spouse!.logradouro,
                    number: proposal.spouse!.number,
                    district: proposal.spouse!.bairro,
                    complement: proposal.spouse!.complement
                  },
                  contacts: [
                    {
                      type: 'MOBILE',
                      content: proposal.spouse!.phone.replace(/\D/g, ''),
                      preference: true
                    }
                  ]
                }
              : null // ✅ Explicitamente null quando não há cônjuge
          },
          contacts: [
            {
              type: 'MOBILE',
              content: CreditProposalMapper.getCleanPhone(proposal),
              preference: true
            }
          ],
          address: {
            type: 'RESIDENTIAL',
            zipCode: proposal.userAddress.cep.replace(/\D/g, ''),
            state: proposal.userAddress.uf,
            city: proposal.userAddress.localidade,
            street: proposal.userAddress.logradouro,
            number: proposal.userAddress.number,
            district: proposal.userAddress.bairro,
            complement: proposal.userAddress.complement
          }
        }
      ]
    }

    // Adicionar dados específicos baseados no tipo de produto
    switch (proposal.selectedProductOption) {
      case 'PILOTO':
      case 'REPASSE':
        payload.construction = {
          businessPersonId: proposal.construction?.businessPersonId || '',
          enterpriseId: proposal.construction?.enterpriseId || '',
          blockId: proposal.construction?.blockId,
          unitId: proposal.construction?.unitId
        }
        break

      case 'PORTABILIDADE':
        payload.portability = {
          amortizationType: proposal.amortization.toUpperCase(),
          feeType: feeType,
          insuranceType: 'ITAU',
          outstandingBalance: proposal.portability?.outstandingBalance || 0,
          propertyPrice:
            CreditProposalMapper.getPropertyValueAsNumber(proposal),
          remainingPeriod: proposal.portability?.remainingPeriod || 0,
          originalPeriod: proposal.portability?.originalPeriod || 0
        }
        // Remove financing para portabilidade
        delete payload.financing
        break
    }

    return payload
  }

  private static mapIncomeType(incomeType: string): string {
    const incomeMap: { [key: string]: string } = {
      assalariado: 'EMPLOYED',
      autonomo: 'SELF_EMPLOYED',
      empresario: 'BUSINESS_OWNER',
      aposentado: 'RETIRED',
      pensionista: 'PENSIONER'
    }

    return incomeMap[incomeType.toLowerCase()] || 'EMPLOYED'
  }

  private static mapMaritalStatus(maritalStatus: string): string {
    const statusMap: { [key: string]: string } = {
      solteiro: 'SINGLE',
      casado: 'MARRIED',
      divorciado: 'DIVORCED',
      viuvo: 'WIDOWED',
      uniao_estavel: 'STABLE_UNION'
    }

    return statusMap[maritalStatus.toLowerCase()] || 'SINGLE'
  }
}
