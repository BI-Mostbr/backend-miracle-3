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
    const hasValidSecondProponent = this.hasValidSecondProponent(proposal)
    const isStableUnion = proposal.stableUnion === true
    const isMarried = proposal.maritalStatus?.toLowerCase() === 'casado'
    const hasValidSpouse =
      proposal.spouse &&
      proposal.spouse.document &&
      proposal.spouse.name &&
      !hasValidSecondProponent

    const secondProponentAsSpouse = hasValidSecondProponent && isStableUnion
    const secondProponentAsSecondHolder =
      hasValidSecondProponent && !isStableUnion && !isMarried

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
      proponents: []
    }

    // PROPONENTE PRINCIPAL
    const primaryProponent = {
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
        liveTogether: Boolean(secondProponentAsSpouse || hasValidSpouse),
        composeIncome: false,
        spouse: null as any
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

    if (secondProponentAsSpouse) {
      const secondProponentBirthDate = convertDateBrToIso(
        proposal.secondProponent!.birthday
      )

      primaryProponent.relationship.liveTogether = true
      primaryProponent.relationship.composeIncome = Boolean(
        proposal.secondProponent!.spouseContributesIncome
      )
      primaryProponent.relationship.spouse = {
        email: proposal.secondProponent!.email || proposal.email,
        identification: {
          cpf: proposal.secondProponent!.document.replace(/\D/g, ''),
          name: proposal.secondProponent!.name,
          birthDate: secondProponentBirthDate,
          nationality: 'BRASILEIRA'
        },
        occupation: {
          profession: proposal.secondProponent!.profession,
          incomeType: this.mapIncomeType(proposal.secondProponent!.workType),
          incomeValue: this.getSecondProponentIncome(proposal)
        },
        address: {
          type: 'RESIDENTIAL',
          zipCode:
            proposal.secondProponent!.cep?.replace(/\D/g, '') ||
            proposal.userAddress.cep.replace(/\D/g, ''),
          state: proposal.secondProponent!.uf || proposal.userAddress.uf,
          city:
            proposal.secondProponent!.localidade ||
            proposal.userAddress.localidade,
          street:
            proposal.secondProponent!.logradouro ||
            proposal.userAddress.logradouro,
          number:
            proposal.secondProponent!.number || proposal.userAddress.number,
          district:
            proposal.secondProponent!.bairro || proposal.userAddress.bairro,
          complement:
            proposal.secondProponent!.complement ||
            proposal.userAddress.complement
        },
        contacts: [
          {
            type: 'MOBILE',
            content:
              proposal.secondProponent!.phone?.replace(/\D/g, '') ||
              CreditProposalMapper.getCleanPhone(proposal),
            preference: true
          }
        ]
      }
    }

    //Cônjuge tradicional (se não tem secondProponent ou não é união estável)
    else if (hasValidSpouse) {
      primaryProponent.relationship.liveTogether = true
      primaryProponent.relationship.composeIncome = Boolean(
        proposal.spouse!.spouseContributesIncome
      )
      primaryProponent.relationship.spouse = {
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
    }

    //Sem cônjuge/companheiro
    else {
      primaryProponent.relationship.liveTogether = false
      primaryProponent.relationship.composeIncome = false
      primaryProponent.relationship.spouse = null
    }

    payload.proponents.push(primaryProponent)

    //stableUnion = false E maritalStatus ≠ casado → secondProponent vira segundo objeto
    if (secondProponentAsSecondHolder) {
      const secondProponentBirthDate = convertDateBrToIso(
        proposal.secondProponent!.birthday
      )

      const secondProponent = {
        email: proposal.secondProponent!.email || proposal.email,
        holder: true,
        identification: {
          cpf: proposal.secondProponent!.document.replace(/\D/g, ''),
          name: proposal.secondProponent!.name,
          birthDate: secondProponentBirthDate,
          nationality: 'BRASILEIRA'
        },
        occupation: {
          profession: proposal.secondProponent!.profession,
          incomeType: this.mapIncomeType(proposal.secondProponent!.workType),
          incomeValue: this.getSecondProponentIncome(proposal)
        },
        relationship: {
          maritalStatus: this.mapMaritalStatus(
            proposal.secondProponent!.civilStatus || proposal.maritalStatus
          ),
          liveTogether: false,
          composeIncome: true,
          spouse: null
        },
        contacts: [
          {
            type: 'MOBILE',
            content:
              proposal.secondProponent!.phone?.replace(/\D/g, '') ||
              CreditProposalMapper.getCleanPhone(proposal),
            preference: true
          }
        ],
        address: {
          type: 'RESIDENTIAL',
          zipCode:
            proposal.secondProponent!.cep?.replace(/\D/g, '') ||
            proposal.userAddress.cep.replace(/\D/g, ''),
          state: proposal.secondProponent!.uf || proposal.userAddress.uf,
          city:
            proposal.secondProponent!.localidade ||
            proposal.userAddress.localidade,
          street:
            proposal.secondProponent!.logradouro ||
            proposal.userAddress.logradouro,
          number:
            proposal.secondProponent!.number || proposal.userAddress.number,
          district:
            proposal.secondProponent!.bairro || proposal.userAddress.bairro,
          complement:
            proposal.secondProponent!.complement ||
            proposal.userAddress.complement
        }
      }

      payload.proponents.push(secondProponent)
    }

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
        delete payload.financing
        break
    }

    return payload
  }

  private static hasValidSecondProponent(proposal: CreditProposal): boolean {
    return !!(
      proposal.secondProponent &&
      proposal.secondProponent.document &&
      proposal.secondProponent.name
    )
  }

  private static getSecondProponentIncome(proposal: CreditProposal): number {
    if (!proposal.secondProponent?.monthlyIncome) return 0

    const income = proposal.secondProponent.monthlyIncome.toString()
    return (
      parseFloat(
        income.replace(/[R$\s.,]/g, '').replace(/(\d)(\d{2})$/, '$1.$2')
      ) || 0
    )
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
      divorciado: 'JUDICIALLY_SEPARATED',
      viuvo: 'WIDOWER',
      'uniao estavel': 'MARRIED',
      'união estável': 'MARRIED'
    }

    return statusMap[maritalStatus.toLowerCase()] || 'SINGLE'
  }
}
