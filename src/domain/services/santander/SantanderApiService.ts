import { decryptAes, encryptAes } from '../../../Utils/crypto'
import {
  BankProposalResponse,
  BankResponseSimulation,
  CreditProposal,
  CreditSimulation
} from '@domain/entities'
import { SantanderAuthService } from './auth/santanderAuthService'
import { SantanderHttpClient } from './client/SantanderHttp.client'
import { SantanderPayloadMapper } from './mappers/SantanderPayload.mapper'
import { SantanderResponseMapper } from './mappers/SantanderResponse.mapper'
import { IBankApiService } from '@infra/interfaces'
import { SantanderProposalPayloadMapper } from './mappers/SantanderPropoposalPayload.mapper'
import { SantanderMiniPersonasPayloadMapper } from './mappers/SantanderMiniPersonasPayload.mapper'
import { SantanderAnalyzeCreditPayloadMapper } from './mappers/SantanderAnalyzeCreditPayload.mapper'
import { SantanderProposalResponseInternMapper } from './mappers/SantanderProposalResponseIntern.mapper'
import { cleanMoney } from 'Utils/removeMasks'
import { mapToStatusSantander } from 'Utils/mapToStatus'

export class SantanderApiService implements IBankApiService {
  private readonly authService: SantanderAuthService
  private readonly httpClient: SantanderHttpClient

  constructor() {
    this.authService = new SantanderAuthService()
    this.httpClient = new SantanderHttpClient()
  }

  getBankName(): string {
    return 'santander'
  }

  async simulationCredit(
    simulation: CreditSimulation
  ): Promise<BankResponseSimulation> {
    const accessToken = await this.authService.getAccessToken()
    const accessTokenDecript = JSON.parse(decryptAes(accessToken)).access_token
    const santanderPayload = SantanderPayloadMapper.convertToPayload(
      simulation,
      false
    )
    const bodyEncriptado = encryptAes(JSON.stringify(santanderPayload))
    const santanderResponse = await this.httpClient.simulateCredit(
      bodyEncriptado,
      accessTokenDecript
    )
    let santanderResponseDrcript = JSON.parse(decryptAes(santanderResponse.enc))
      .data.calculateSimulation

    if (simulation.amortizationType === 'PRICE') {
      const idSimulationEncript = encryptAes(
        santanderResponseDrcript.simulationId
      )
      const customPayload = SantanderPayloadMapper.convertToPayload(
        santanderResponseDrcript.simulationId,
        true
      )
      const customBodyEncriptado = encryptAes(JSON.stringify(customPayload))

      const customResponse = await this.httpClient.simulateCreditCustom(
        customBodyEncriptado,
        idSimulationEncript,
        accessTokenDecript
      )

      santanderResponseDrcript = JSON.parse(decryptAes(customResponse.enc))
    }

    const internSantanderResponse =
      SantanderResponseMapper.convertToInternApiResponse(
        santanderResponseDrcript,
        simulation
      )
    return internSantanderResponse
  }

  async getSimulation(request: any) {
    const idSimulation = request.idSimulation
    const accessToken = await this.authService.getAccessToken()
    const accessTokenDecript = JSON.parse(decryptAes(accessToken)).access_token
    const idSimulationEncript = encryptAes(idSimulation)
    const santanderPdfResponse = await this.httpClient.getPdf(
      idSimulationEncript,
      accessTokenDecript
    )
    const santanderPdfResponseDecript = JSON.parse(
      decryptAes(santanderPdfResponse.enc)
    )
    return santanderPdfResponseDecript
  }

  async sendProposal(proposal: CreditProposal): Promise<BankProposalResponse> {
    const accessToken = await this.authService.getAccessToken()
    const accessTokenDecript = JSON.parse(decryptAes(accessToken)).access_token
    let santanderPayload = SantanderProposalPayloadMapper.convertToPayload(
      proposal,
      false
    )
    console.log('-----------------Payload Simulação Simples')
    console.log(JSON.stringify(santanderPayload))
    let bodyEncriptado = encryptAes(JSON.stringify(santanderPayload))

    let valorFinanciado = cleanMoney(proposal.financedValue)

    let santanderResponse = await this.httpClient.simulateCredit(
      bodyEncriptado,
      accessTokenDecript
    )

    let santanderResponseDrcript = JSON.parse(decryptAes(santanderResponse.enc))

    const messageError = JSON.parse(decryptAes(santanderResponse.enc))
      .errors?.[0]?.extensions?.messages?.[1]?.message

    if (messageError) {
      const match = messageError.match(/menor que (\d+)/)

      if (match) {
        const valorLimite = Number(match[1])
        valorFinanciado = Number(valorLimite) - 1
        const proposalCorrigido = {
          ...proposal,
          financedValue: valorFinanciado.toString()
        }

        santanderPayload = SantanderProposalPayloadMapper.convertToPayload(
          proposalCorrigido,
          false
        )

        bodyEncriptado = encryptAes(JSON.stringify(santanderPayload))

        santanderResponse = await this.httpClient.simulateCredit(
          bodyEncriptado,
          accessTokenDecript
        )

        santanderResponseDrcript = JSON.parse(decryptAes(santanderResponse.enc))
          .data.calculateSimulation
      }
    } else {
      santanderResponseDrcript = JSON.parse(decryptAes(santanderResponse.enc))
        .data.calculateSimulation
    }

    const idSimulationEncript = encryptAes(
      santanderResponseDrcript.simulationId
    )

    if (
      proposal.amortization === 'PRICE' ||
      proposal.useFGTS ||
      proposal.itbiPayment
    ) {
      const customPayload = SantanderProposalPayloadMapper.convertToPayload(
        proposal,
        true,
        santanderResponseDrcript.simulationId
      )

      const customBodyEncriptado = encryptAes(JSON.stringify(customPayload))

      const customResponse = await this.httpClient.simulateCreditCustom(
        customBodyEncriptado,
        idSimulationEncript,
        accessTokenDecript
      )

      santanderResponseDrcript = JSON.parse(decryptAes(customResponse.enc))
    }

    console.log(santanderResponseDrcript)

    const saveSimulationResponse = await this.httpClient.saveSimulation(
      idSimulationEncript,
      accessTokenDecript
    )

    console.log('-----------------saveSimulation')
    console.log(saveSimulationResponse)
    console.log(decryptAes(saveSimulationResponse.enc))

    const analyzeCreditPayload =
      SantanderAnalyzeCreditPayloadMapper.convertToPayload(
        santanderResponseDrcript.simulationId
      )

    const analyzeCreditEncrypt = encryptAes(
      JSON.stringify(analyzeCreditPayload)
    )
    console.log('-----------------AnalyzeCredit')
    console.log('Payload analyze Credit: ', analyzeCreditPayload)

    let analyzeCreditResponse = await this.httpClient.analyzeCredit(
      analyzeCreditEncrypt,
      accessTokenDecript
    )

    let analyzeCreditDecript = JSON.parse(decryptAes(analyzeCreditResponse.enc))

    console.log(
      'AnalyzeCredit sem miniPersonas: ',
      JSON.stringify(analyzeCreditDecript)
    )

    if (analyzeCreditDecript.data.analyzeCredit.returnCode === '301') {
      const integrateMiniPersonasPayload =
        SantanderMiniPersonasPayloadMapper.convertToPayload(
          proposal,
          santanderResponseDrcript.simulationId,
          '1250'
        )
      console.log(JSON.stringify(integrateMiniPersonasPayload))
      const integrateMiniPersonasPayloadEncrypt = encryptAes(
        JSON.stringify(integrateMiniPersonasPayload)
      )
      const integrateMiniPersonasResponse =
        await this.httpClient.integrateMiniPersonas(
          integrateMiniPersonasPayloadEncrypt,
          accessTokenDecript
        )
      const integrateMiniPersonasDecript = JSON.parse(
        decryptAes(integrateMiniPersonasResponse.enc)
      )
      console.log(
        'Mini Personas 301: ',
        JSON.stringify(integrateMiniPersonasDecript)
      )
      analyzeCreditResponse = await this.httpClient.analyzeCredit(
        analyzeCreditEncrypt,
        accessTokenDecript
      )
      analyzeCreditDecript = JSON.parse(decryptAes(analyzeCreditResponse.enc))
      console.log(
        'Analyze Credit Integrate Mini Personas 301: ',
        JSON.stringify(analyzeCreditDecript)
      )

      // PRESERVAR O SIMULATION ID ORIGINAL
      const originalSimulationId = santanderResponseDrcript.simulationId
      console.log(
        '🔍 Original simulationId para frontend (301):',
        originalSimulationId
      )

      const bankResponse301: BankProposalResponse = {
        proposalId: analyzeCreditDecript.data.analyzeCredit.garraProposal || '',
        bankName: 'Santander',
        simulationId: originalSimulationId,
        status: mapToStatusSantander(
          analyzeCreditDecript.data.analyzeCredit.statusCode),
        bankSpecificData: {
          santander: {
            simulationId: originalSimulationId,
            financingObjective: santanderResponseDrcript.financingObjective,
            financingObjectiveKey:
              santanderResponseDrcript.financingObjectiveKey,
            propertyValue: santanderResponseDrcript.propertyValue,
            fgtsAmount: santanderResponseDrcript.fgtsAmount,
            financingValue: santanderResponseDrcript.financingValue,
            financingDeadlineInYears:
              santanderResponseDrcript.financingDeadlineInYears,
            financingDeadlineInMonths:
              santanderResponseDrcript.financingDeadlineInMonths,
            minimumFinancingDeadlineInMonths:
              santanderResponseDrcript.minimumFinancingDeadlineInMonths,
            maximumFinancingDeadlineInMonths:
              santanderResponseDrcript.maximumFinancingDeadlineInMonths,
            minFinancingAmount: santanderResponseDrcript.minFinancingAmount,
            maxFinancingAmount: santanderResponseDrcript.maxFinancingAmount,
            downPaymentAmount: santanderResponseDrcript.downPaymentAmount,
            expensesFinancedValue:
              santanderResponseDrcript.expensesFinancedValue,
            iofValue: santanderResponseDrcript.iofValue,
            valuationFeeAmount: santanderResponseDrcript.valuationFeeAmount,
            totalFinancingValueWithExpenses:
              santanderResponseDrcript.totalFinancingValueWithExpenses,
            trIndexer: santanderResponseDrcript.trIndexer,
            customerPortfolioName:
              santanderResponseDrcript.customerPortfolioName,
            campaign: santanderResponseDrcript.campaign,
            campaignKey: santanderResponseDrcript.campaignKey,
            segment: santanderResponseDrcript.segment,
            segmentKey: santanderResponseDrcript.segmentKey,
            relationShipOffer: santanderResponseDrcript.relationShipOffer,
            relationShipOfferKey: santanderResponseDrcript.relationShipOfferKey,
            insurer: santanderResponseDrcript.insurer,
            insurerKey: santanderResponseDrcript.insurerKey,
            amortizationType: santanderResponseDrcript.amortizationType,
            amortizationTypeKey: santanderResponseDrcript.amortizationTypeKey,
            paymentType: santanderResponseDrcript.paymentType,
            paymentTypeKey: santanderResponseDrcript.paymentTypeKey,
            allowsToFinanceWarrantyEvaluationFee:
              santanderResponseDrcript.allowsToFinanceWarrantyEvaluationFee,
            allowsToFinanceIOF: santanderResponseDrcript.allowsToFinanceIOF,
            allowsToFinancePropertyRegistrationAndITBI:
              santanderResponseDrcript.allowsToFinancePropertyRegistrationAndITBI,
            allowsFGTS: santanderResponseDrcript.allowsFGTS,
            relationShipFlow: santanderResponseDrcript.relationShipFlow,
            unrelatedFlow: {
              calculatedSimulationType:
                santanderResponseDrcript.unrelatedFlow
                  ?.calculatedSimulationType || '',
              annualInterestRate:
                santanderResponseDrcript.unrelatedFlow?.annualInterestRate || 0,
              monthlyInterestRate:
                santanderResponseDrcript.unrelatedFlow?.monthlyInterestRate ||
                0,
              firstPaymentAmount:
                santanderResponseDrcript.unrelatedFlow?.firstPaymentAmount || 0,
              lastPaymentAmount:
                santanderResponseDrcript.unrelatedFlow?.lastPaymentAmount || 0,
              cetRate: santanderResponseDrcript.unrelatedFlow?.cetRate || 0,
              ceshRate: santanderResponseDrcript.unrelatedFlow?.ceshRate || 0
            }
          }
        }
      }

      return bankResponse301
    }

    if (analyzeCreditDecript.data.analyzeCredit.returnCode === '302') {
      let proponenteParaPayload: CreditProposal | undefined = undefined

      if (proposal.spouse) {
        proponenteParaPayload = {
          ...proposal,
          document: proposal.spouse.document,
          name: proposal.spouse.name,
          birthday: proposal.spouse.birthday,
          phone: proposal.spouse.phone,
          email: proposal.spouse.email,
          motherName: proposal.spouse.motherName,
          gender: proposal.spouse.gender,
          documentType: proposal.spouse.documentType,
          documentNumber: proposal.spouse.documentNumber,
          documentIssuer: proposal.spouse.documentIssuer,
          documentIssueDate: proposal.spouse.documentIssueDate,
          ufDataUser: proposal.spouse.spouseUfDataUser,
          monthlyIncome: proposal.spouse.monthlyIncome,
          profession: proposal.spouse.profession,
          workType: proposal.spouse.workType,
          professionalPosition: proposal.spouse.professionalPosition,
          maritalStatus: proposal.spouse.civilStatus,
          userAddress: {
            cep: proposal.spouse.cep,
            logradouro: proposal.spouse.logradouro,
            complemento: proposal.spouse.complemento,
            bairro: proposal.spouse.bairro,
            localidade: proposal.spouse.localidade,
            uf: proposal.spouse.uf,
            estado: proposal.spouse.uf,
            regiao: proposal.spouse.regiao,
            ibge: '',
            gia: '',
            ddd: '',
            siafi: '',
            number: proposal.spouse.number,
            complement: proposal.spouse.complement,
            unidade: proposal.spouse.unidade
          }
        }
      } else if (proposal.secondProponent) {
        //If se for casado
        proponenteParaPayload = {
          ...proposal,
          document: proposal.secondProponent.document,
          name: proposal.secondProponent.name,
          birthday: proposal.secondProponent.birthday,
          phone: proposal.secondProponent.phone,
          email: proposal.secondProponent.email,
          motherName: proposal.secondProponent.motherName,
          gender: proposal.secondProponent.gender,
          documentType: proposal.secondProponent.documentType,
          documentNumber: proposal.secondProponent.documentNumber,
          documentIssuer: proposal.secondProponent.documentIssuer,
          documentIssueDate: proposal.secondProponent.documentIssueDate,
          ufDataUser: proposal.secondProponent.uf,
          monthlyIncome: proposal.secondProponent.monthlyIncome,
          profession: proposal.secondProponent.profession,
          workType: proposal.secondProponent.workType,
          professionalPosition: proposal.secondProponent.professionalPosition,
          maritalStatus: proposal.secondProponent.civilStatus,
          userAddress: {
            cep: proposal.secondProponent.cep,
            logradouro: proposal.secondProponent.logradouro,
            complemento: proposal.secondProponent.complement,
            bairro: proposal.secondProponent.bairro,
            localidade: proposal.secondProponent.localidade,
            uf: proposal.secondProponent.uf,
            estado: proposal.secondProponent.uf,
            regiao: '',
            ibge: '',
            gia: '',
            ddd: '',
            siafi: '',
            number: proposal.secondProponent.number,
            complement: proposal.secondProponent.complement,
            unidade: ''
          }
        }
      }
      const payloadParaIntegrate = proponenteParaPayload ?? proposal

      const integrateMiniPersonasPayload =
        SantanderMiniPersonasPayloadMapper.convertToPayload(
          payloadParaIntegrate,
          santanderResponseDrcript.simulationId,
          '1250'
        )

      console.log(JSON.stringify(integrateMiniPersonasPayload))

      const integrateMiniPersonasPayloadEncrypt = encryptAes(
        JSON.stringify(integrateMiniPersonasPayload)
      )

      const integrateMiniPersonasResponse =
        await this.httpClient.integrateMiniPersonas(
          integrateMiniPersonasPayloadEncrypt,
          accessTokenDecript
        )

      const integrateMiniPersonasDecript = JSON.parse(
        decryptAes(integrateMiniPersonasResponse.enc)
      )
      console.log('Mini Personas 302: ', integrateMiniPersonasDecript)

      analyzeCreditResponse = await this.httpClient.analyzeCredit(
        analyzeCreditEncrypt,
        accessTokenDecript
      )
      analyzeCreditDecript = JSON.parse(decryptAes(analyzeCreditResponse.enc))
      console.log(
        'Analyze Credit Integrate Mini Personas 302: ',
        JSON.stringify(analyzeCreditDecript)
      )

      // PRESERVAR O SIMULATION ID ORIGINAL
      const originalSimulationId = santanderResponseDrcript.simulationId
      console.log(
        '🔍 Original simulationId para frontend (302):',
        originalSimulationId
      )

      const bankResponse302: BankProposalResponse = {
        proposalId: analyzeCreditDecript.data.analyzeCredit.garraProposal || '',
        bankName: 'Santander',
        simulationId: originalSimulationId,
        status: mapToStatusSantander(
          analyzeCreditDecript.data.analyzeCredit.returnCode),
        bankSpecificData: {
          santander: {
            simulationId: originalSimulationId,
            financingObjective: santanderResponseDrcript.financingObjective,
            financingObjectiveKey:
              santanderResponseDrcript.financingObjectiveKey,
            propertyValue: santanderResponseDrcript.propertyValue,
            fgtsAmount: santanderResponseDrcript.fgtsAmount,
            financingValue: santanderResponseDrcript.financingValue,
            financingDeadlineInYears:
              santanderResponseDrcript.financingDeadlineInYears,
            financingDeadlineInMonths:
              santanderResponseDrcript.financingDeadlineInMonths,
            minimumFinancingDeadlineInMonths:
              santanderResponseDrcript.minimumFinancingDeadlineInMonths,
            maximumFinancingDeadlineInMonths:
              santanderResponseDrcript.maximumFinancingDeadlineInMonths,
            minFinancingAmount: santanderResponseDrcript.minFinancingAmount,
            maxFinancingAmount: santanderResponseDrcript.maxFinancingAmount,
            downPaymentAmount: santanderResponseDrcript.downPaymentAmount,
            expensesFinancedValue:
              santanderResponseDrcript.expensesFinancedValue,
            iofValue: santanderResponseDrcript.iofValue,
            valuationFeeAmount: santanderResponseDrcript.valuationFeeAmount,
            totalFinancingValueWithExpenses:
              santanderResponseDrcript.totalFinancingValueWithExpenses,
            trIndexer: santanderResponseDrcript.trIndexer,
            customerPortfolioName:
              santanderResponseDrcript.customerPortfolioName,
            campaign: santanderResponseDrcript.campaign,
            campaignKey: santanderResponseDrcript.campaignKey,
            segment: santanderResponseDrcript.segment,
            segmentKey: santanderResponseDrcript.segmentKey,
            relationShipOffer: santanderResponseDrcript.relationShipOffer,
            relationShipOfferKey: santanderResponseDrcript.relationShipOfferKey,
            insurer: santanderResponseDrcript.insurer,
            insurerKey: santanderResponseDrcript.insurerKey,
            amortizationType: santanderResponseDrcript.amortizationType,
            amortizationTypeKey: santanderResponseDrcript.amortizationTypeKey,
            paymentType: santanderResponseDrcript.paymentType,
            paymentTypeKey: santanderResponseDrcript.paymentTypeKey,
            allowsToFinanceWarrantyEvaluationFee:
              santanderResponseDrcript.allowsToFinanceWarrantyEvaluationFee,
            allowsToFinanceIOF: santanderResponseDrcript.allowsToFinanceIOF,
            allowsToFinancePropertyRegistrationAndITBI:
              santanderResponseDrcript.allowsToFinancePropertyRegistrationAndITBI,
            allowsFGTS: santanderResponseDrcript.allowsFGTS,
            relationShipFlow: santanderResponseDrcript.relationShipFlow,
            unrelatedFlow: {
              calculatedSimulationType:
                santanderResponseDrcript.unrelatedFlow
                  ?.calculatedSimulationType || '',
              annualInterestRate:
                santanderResponseDrcript.unrelatedFlow?.annualInterestRate || 0,
              monthlyInterestRate:
                santanderResponseDrcript.unrelatedFlow?.monthlyInterestRate ||
                0,
              firstPaymentAmount:
                santanderResponseDrcript.unrelatedFlow?.firstPaymentAmount || 0,
              lastPaymentAmount:
                santanderResponseDrcript.unrelatedFlow?.lastPaymentAmount || 0,
              cetRate: santanderResponseDrcript.unrelatedFlow?.cetRate || 0,
              ceshRate: santanderResponseDrcript.unrelatedFlow?.ceshRate || 0
            }
          }
        }
      }

      return bankResponse302
    }

    console.log(analyzeCreditDecript)

    // PRESERVAR O SIMULATION ID ORIGINAL
    const originalSimulationId = santanderResponseDrcript.simulationId
    console.log(
      '🔍 Original simulationId para frontend (default):',
      originalSimulationId
    )

    const bankResponse =
      SantanderProposalResponseInternMapper.convertToInternalResponse(
        santanderResponseDrcript, analyzeCreditDecript
      )

    // ADICIONAR O SIMULATION ID ORIGINAL NO RESPONSE
    bankResponse.simulationId = originalSimulationId

    // PRESERVAR OS DADOS DA SIMULAÇÃO ORIGINAL
    if (!bankResponse.bankSpecificData) {
      bankResponse.bankSpecificData = {}
    }

    // Sobrescrever completamente os dados do Santander com os dados da simulação original
    bankResponse.bankSpecificData.santander = {
      simulationId: originalSimulationId,
      financingObjective: santanderResponseDrcript.financingObjective,
      financingObjectiveKey: santanderResponseDrcript.financingObjectiveKey,
      propertyValue: santanderResponseDrcript.propertyValue,
      fgtsAmount: santanderResponseDrcript.fgtsAmount,
      financingValue: santanderResponseDrcript.financingValue,
      financingDeadlineInYears:
        santanderResponseDrcript.financingDeadlineInYears,
      financingDeadlineInMonths:
        santanderResponseDrcript.financingDeadlineInMonths,
      minimumFinancingDeadlineInMonths:
        santanderResponseDrcript.minimumFinancingDeadlineInMonths,
      maximumFinancingDeadlineInMonths:
        santanderResponseDrcript.maximumFinancingDeadlineInMonths,
      minFinancingAmount: santanderResponseDrcript.minFinancingAmount,
      maxFinancingAmount: santanderResponseDrcript.maxFinancingAmount,
      downPaymentAmount: santanderResponseDrcript.downPaymentAmount,
      expensesFinancedValue: santanderResponseDrcript.expensesFinancedValue,
      iofValue: santanderResponseDrcript.iofValue,
      valuationFeeAmount: santanderResponseDrcript.valuationFeeAmount,
      totalFinancingValueWithExpenses:
        santanderResponseDrcript.totalFinancingValueWithExpenses,
      trIndexer: santanderResponseDrcript.trIndexer,
      customerPortfolioName: santanderResponseDrcript.customerPortfolioName,
      campaign: santanderResponseDrcript.campaign,
      campaignKey: santanderResponseDrcript.campaignKey,
      segment: santanderResponseDrcript.segment,
      segmentKey: santanderResponseDrcript.segmentKey,
      relationShipOffer: santanderResponseDrcript.relationShipOffer,
      relationShipOfferKey: santanderResponseDrcript.relationShipOfferKey,
      insurer: santanderResponseDrcript.insurer,
      insurerKey: santanderResponseDrcript.insurerKey,
      amortizationType: santanderResponseDrcript.amortizationType,
      amortizationTypeKey: santanderResponseDrcript.amortizationTypeKey,
      paymentType: santanderResponseDrcript.paymentType,
      paymentTypeKey: santanderResponseDrcript.paymentTypeKey,
      allowsToFinanceWarrantyEvaluationFee:
        santanderResponseDrcript.allowsToFinanceWarrantyEvaluationFee,
      allowsToFinanceIOF: santanderResponseDrcript.allowsToFinanceIOF,
      allowsToFinancePropertyRegistrationAndITBI:
        santanderResponseDrcript.allowsToFinancePropertyRegistrationAndITBI,
      allowsFGTS: santanderResponseDrcript.allowsFGTS,
      relationShipFlow: santanderResponseDrcript.relationShipFlow,
      unrelatedFlow: {
        calculatedSimulationType:
          santanderResponseDrcript.unrelatedFlow?.calculatedSimulationType ||
          '',
        annualInterestRate:
          santanderResponseDrcript.unrelatedFlow?.annualInterestRate || 0,
        monthlyInterestRate:
          santanderResponseDrcript.unrelatedFlow?.monthlyInterestRate || 0,
        firstPaymentAmount:
          santanderResponseDrcript.unrelatedFlow?.firstPaymentAmount || 0,
        lastPaymentAmount:
          santanderResponseDrcript.unrelatedFlow?.lastPaymentAmount || 0,
        cetRate: santanderResponseDrcript.unrelatedFlow?.cetRate || 0,
        ceshRate: santanderResponseDrcript.unrelatedFlow?.ceshRate || 0
      }
    }

    return bankResponse
  }
}
