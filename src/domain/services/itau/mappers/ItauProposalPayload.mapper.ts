import { CreditProposal } from '@domain/entities'
import { mapToPropertyTypeItau } from 'Utils/mapToProperty'
import { mapToFeeTypeItau } from 'Utils/mapToFeeType'
import { convertDateBrToIso } from 'Utils/convertData'
import { productItau } from 'Utils/mapToProduct'
import { ItauProposalPayload } from '../types/ItauProposalPayload.type'

export interface ConsultorData {
  nome_itau: string | null
  cpf: string
}
export class ItauProposalPayloadMapper {
  static convertToPayload(
    proposal: CreditProposal,
    consultorData?: ConsultorData
  ): ItauProposalPayload {
    const propertyType = mapToPropertyTypeItau(proposal.propertyType)
    const feeType = mapToFeeTypeItau(proposal.financingRate)
    const productType = productItau(proposal.productType)
    const birthDate = convertDateBrToIso(proposal.customerBirthDate)

    const payload: ItauProposalPayload = {
      indication: {
        partner: {
          code: process.env.ITAU_CODE_PARTNER!,
          cnpj: process.env.ITAU_CNPJ_PARTNER!,
          agent: {
            name: consultorData?.nome_itau || '',
            cpf: consultorData?.cpf || ''
          }
        }
      },

      productType: productType,
      property: {
        type: propertyType,
        state: proposal.propertyState
      },
      proponents: [
        {
          email: proposal.customerEmail,
          holder: true,
          identification: {
            cpf: proposal.customerCpf,
            name: proposal.customerName,
            birthDate: birthDate,
            nationality: 'BRASILEIRA'
          },
          occupation: {
            profession: proposal.customerProfession,
            incomeType: this.mapIncomeType(proposal.customerIncomeType),
            incomeValue: proposal.customerIncome
          },
          contacts: [
            {
              type: 'MOBILE',
              content: proposal.customerPhone,
              preference: true
            }
          ],
          address: {
            type: 'RESIDENTIAL',
            zipCode: proposal.customerAddress.zipCode,
            state: proposal.customerAddress.state,
            city: proposal.customerAddress.city,
            street: proposal.customerAddress.street,
            number: proposal.customerAddress.number,
            district: proposal.customerAddress.neighborhood,
            complement: proposal.customerAddress.complement
          }
        }
      ]
    }

    // Adicionar dados específicos baseados no tipo de produto
    switch (proposal.productType) {
      case 'ISOLADO':
        payload.financing = {
          amortizationType: proposal.amortizationType,
          financingValue: proposal.financingValue,
          downPayment: proposal.downPayment,
          itbiValue: proposal.itbiValue,
          includeRegistryCosts: true,
          feeType: feeType,
          propertyPrice: proposal.propertyValue,
          period: proposal.installments,
          walletType: 'SFH',
          insuranceType: 'ITAU'
        }
        break

      case 'PILOTO':
      case 'REPASSE':
        payload.construction = {
          businessPersonId: proposal.construction?.businessPersonId || '',
          enterpriseId: proposal.construction?.enterpriseId || '',
          blockId: proposal.construction?.blockId,
          unitId: proposal.construction?.unitId
        }
        payload.financing = {
          amortizationType: proposal.amortizationType,
          financingValue: proposal.financingValue,
          downPayment: proposal.downPayment,
          includeRegistryCosts: true,
          feeType: feeType,
          propertyPrice: proposal.propertyValue,
          period: proposal.installments,
          walletType: 'SFH',
          insuranceType: 'ITAU'
        }
        break

      case 'PORTABILIDADE':
        payload.portability = {
          amortizationType: proposal.amortizationType,
          feeType: feeType,
          insuranceType: 'ITAU',
          outstandingBalance: proposal.portability?.outstandingBalance || 0,
          propertyPrice: proposal.propertyValue,
          remainingPeriod: proposal.portability?.remainingPeriod || 0,
          originalPeriod: proposal.portability?.originalPeriod || 0
        }
        break
    }

    // Adicionar cônjuge se existir
    if (proposal.spouse) {
      const spouseBirthDate = convertDateBrToIso(proposal.spouse.birthDate)

      payload.proponents[0].relationship = {
        maritalStatus: this.mapMaritalStatus(proposal.customerMaritalStatus),
        liveTogether: false,
        composeIncome: proposal.spouse.composeIncome,
        spouse: {
          email: proposal.spouse.email,
          identification: {
            cpf: proposal.spouse.cpf,
            name: proposal.spouse.name,
            birthDate: spouseBirthDate,
            nationality: 'BRASILEIRA'
          },
          occupation: {
            profession: proposal.spouse.profession,
            incomeType: this.mapIncomeType(proposal.spouse.incomeType),
            incomeValue: proposal.spouse.income
          },
          address: {
            type: 'RESIDENTIAL',
            zipCode: proposal.spouse.address.zipCode,
            state: proposal.spouse.address.state,
            city: proposal.spouse.address.city,
            street: proposal.spouse.address.street,
            number: proposal.spouse.address.number,
            district: proposal.spouse.address.neighborhood,
            complement: proposal.spouse.address.complement
          },
          contacts: [
            {
              type: 'MOBILE',
              content: proposal.spouse.phone,
              preference: true
            }
          ]
        }
      }
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
