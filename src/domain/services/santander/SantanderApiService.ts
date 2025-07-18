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

function safeNumberCreditoAprovado(value: any): number {
  if (
    typeof value === 'undefined' ||
    value === null ||
    value === 0 ||
    value === '0' ||
    value === '' ||
    isNaN(Number(value))
  ) {
    return 0
  }
  try {
    return Number(value)
  } catch {
    return 0
  }
}

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
    console.log(
      'Payload simulationCredit (descriptografado):',
      santanderPayload
    )

    const bodyEncriptado = encryptAes(JSON.stringify(santanderPayload))
    const santanderResponse = await this.httpClient.simulateCredit(
      bodyEncriptado,
      accessTokenDecript
    )
    let santanderResponseDrcript = JSON.parse(decryptAes(santanderResponse.enc))
      .data.calculateSimulation

    console.log(
      'Response simulationCredit (descriptografado):',
      santanderResponseDrcript
    )

    if (simulation.amortizationType === 'PRICE') {
      const idSimulationEncript = encryptAes(
        santanderResponseDrcript.simulationId
      )
      const customPayload = SantanderPayloadMapper.convertToPayload(
        santanderResponseDrcript.simulationId,
        true
      )
      console.log(
        'Payload simulationCredit custom (descriptografado):',
        customPayload
      )

      const customBodyEncriptado = encryptAes(JSON.stringify(customPayload))
      const customResponse = await this.httpClient.simulateCreditCustom(
        customBodyEncriptado,
        idSimulationEncript,
        accessTokenDecript
      )
      santanderResponseDrcript = JSON.parse(decryptAes(customResponse.enc))
      console.log(
        'Response simulationCredit custom (descriptografado):',
        santanderResponseDrcript
      )
    }

    const internSantanderResponse =
      SantanderResponseMapper.convertToInternApiResponse(
        santanderResponseDrcript,
        simulation
      )
    return internSantanderResponse
  }

  async getSimulation(request: any): Promise<any> {
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
    console.log(
      'getSimulation response (descriptografado):',
      santanderPdfResponseDecript
    )
    return santanderPdfResponseDecript
  }

  private getSegundoProponenteOuConjugePayload(
    proposal: CreditProposal
  ): CreditProposal {
    if (proposal.spouse) {
      return {
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
    }
    if (proposal.secondProponent) {
      return {
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
    return proposal
  }

  private async integrateMiniPersonas(
    proposal: CreditProposal,
    simulationId: string,
    code: string,
    accessToken: string
  ) {
    const payload = SantanderMiniPersonasPayloadMapper.convertToPayload(
      proposal,
      simulationId,
      code
    )
    console.log('Payload MiniPersonas (descriptografado):', payload)

    const encrypted = encryptAes(JSON.stringify(payload))
    const response = await this.httpClient.integrateMiniPersonas(
      encrypted,
      accessToken
    )
    const decrypted = JSON.parse(decryptAes(response.enc))
    console.log('Response MiniPersonas (descriptografado):', decrypted)
    return decrypted
  }

  async sendProposal(proposal: CreditProposal): Promise<BankProposalResponse> {
    const accessToken = await this.authService.getAccessToken()
    const accessTokenDecript = JSON.parse(decryptAes(accessToken)).access_token

    let santanderPayload = SantanderProposalPayloadMapper.convertToPayload(
      proposal,
      false
    )
    console.log(
      'Payload simulação simples (descriptografado):',
      santanderPayload
    )

    let bodyEncriptado = encryptAes(JSON.stringify(santanderPayload))
    let valorFinanciado = cleanMoney(proposal.financedValue)

    let santanderResponse = await this.httpClient.simulateCredit(
      bodyEncriptado,
      accessTokenDecript
    )
    let santanderResponseDrcript = JSON.parse(decryptAes(santanderResponse.enc))
    console.log(
      'Response simulação simples (descriptografado):',
      santanderResponseDrcript
    )

    const messageError =
      santanderResponseDrcript?.errors?.[0]?.extensions?.messages?.[1]?.message

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
        console.log('Payload corrigido (descriptografado):', santanderPayload)

        bodyEncriptado = encryptAes(JSON.stringify(santanderPayload))
        santanderResponse = await this.httpClient.simulateCredit(
          bodyEncriptado,
          accessTokenDecript
        )
        santanderResponseDrcript = JSON.parse(decryptAes(santanderResponse.enc))
          .data?.calculateSimulation
        console.log(
          'Response simulação corrigida (descriptografado):',
          santanderResponseDrcript
        )
      }
    } else {
      santanderResponseDrcript =
        santanderResponseDrcript.data?.calculateSimulation ??
        santanderResponseDrcript
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
      console.log('Payload custom (descriptografado):', customPayload)

      const customBodyEncriptado = encryptAes(JSON.stringify(customPayload))
      const customResponse = await this.httpClient.simulateCreditCustom(
        customBodyEncriptado,
        idSimulationEncript,
        accessTokenDecript
      )
      santanderResponseDrcript = JSON.parse(decryptAes(customResponse.enc))
      console.log(
        'Response custom (descriptografado):',
        santanderResponseDrcript
      )
    }

    await this.httpClient.saveSimulation(
      idSimulationEncript,
      accessTokenDecript
    )

    const analyzeCreditPayload =
      SantanderAnalyzeCreditPayloadMapper.convertToPayload(
        santanderResponseDrcript.simulationId
      )
    console.log(
      'Payload analyzeCredit (descriptografado):',
      analyzeCreditPayload
    )

    const analyzeCreditEncrypt = encryptAes(
      JSON.stringify(analyzeCreditPayload)
    )
    let analyzeCreditResponse = await this.httpClient.analyzeCredit(
      analyzeCreditEncrypt,
      accessTokenDecript
    )
    let analyzeCreditDecript = JSON.parse(decryptAes(analyzeCreditResponse.enc))
    console.log(
      'Response analyzeCredit (descriptografado):',
      analyzeCreditDecript
    )

    let returnCode = analyzeCreditDecript.data.analyzeCredit.returnCode

    if (returnCode === '301') {
      await this.integrateMiniPersonas(
        proposal,
        santanderResponseDrcript.simulationId,
        '1250',
        accessTokenDecript
      )
      analyzeCreditResponse = await this.httpClient.analyzeCredit(
        analyzeCreditEncrypt,
        accessTokenDecript
      )
      analyzeCreditDecript = JSON.parse(decryptAes(analyzeCreditResponse.enc))
      console.log(
        'Response analyzeCredit pós MiniPersonas 301 (descriptografado):',
        analyzeCreditDecript
      )
    }
    if (returnCode === '302') {
      const proponente = this.getSegundoProponenteOuConjugePayload(proposal)
      await this.integrateMiniPersonas(
        proponente,
        santanderResponseDrcript.simulationId,
        '1250',
        accessTokenDecript
      )
      analyzeCreditResponse = await this.httpClient.analyzeCredit(
        analyzeCreditEncrypt,
        accessTokenDecript
      )
      analyzeCreditDecript = JSON.parse(decryptAes(analyzeCreditResponse.enc))
      console.log(
        'Response analyzeCredit pós MiniPersonas 302 (descriptografado):',
        analyzeCreditDecript
      )
    }
    if (returnCode === '303') {
      await this.integrateMiniPersonas(
        proposal,
        santanderResponseDrcript.simulationId,
        '1250',
        accessTokenDecript
      )
      const proponente = this.getSegundoProponenteOuConjugePayload(proposal)
      await this.integrateMiniPersonas(
        proponente,
        santanderResponseDrcript.simulationId,
        '1250',
        accessTokenDecript
      )
      analyzeCreditResponse = await this.httpClient.analyzeCredit(
        analyzeCreditEncrypt,
        accessTokenDecript
      )
      analyzeCreditDecript = JSON.parse(decryptAes(analyzeCreditResponse.enc))
      console.log(
        'Response analyzeCredit pós MiniPersonas 303 (descriptografado):',
        analyzeCreditDecript
      )
    }

    // Safe helpers para campos numéricos e strings
    const safe = (value: any, fallback: any = 0) =>
      typeof value === 'undefined' || value === null ? fallback : value
    const safeString = (value: any, fallback: string = '') =>
      typeof value === 'undefined' || value === null ? fallback : String(value)

    const santander = santanderResponseDrcript || {}
    const unrelatedFlow = santander.unrelatedFlow || {}
    const originalSimulationId = santander.simulationId || ''

    // Garante que financingValue nunca será undefined ou inválido ao salvar
    const financingValueNumber = safeNumberCreditoAprovado(
      santander.financingValue
    )

    const bankResponse =
      SantanderProposalResponseInternMapper.convertToInternalResponse(
        santander,
        analyzeCreditDecript
      )
    bankResponse.simulationId = originalSimulationId
    if (!bankResponse.bankSpecificData) {
      bankResponse.bankSpecificData = {}
    }
    bankResponse.bankSpecificData.santander = {
      simulationId: originalSimulationId,
      financingObjective: safeString(santander.financingObjective),
      financingObjectiveKey: safeString(santander.financingObjectiveKey),
      propertyValue: safe(santander.propertyValue),
      fgtsAmount: safe(santander.fgtsAmount),
      financingValue: financingValueNumber,
      financingDeadlineInYears: safe(santander.financingDeadlineInYears),
      financingDeadlineInMonths: safe(santander.financingDeadlineInMonths),
      minimumFinancingDeadlineInMonths: safe(
        santander.minimumFinancingDeadlineInMonths
      ),
      maximumFinancingDeadlineInMonths: safe(
        santander.maximumFinancingDeadlineInMonths
      ),
      minFinancingAmount: safe(santander.minFinancingAmount),
      maxFinancingAmount: safe(santander.maxFinancingAmount),
      downPaymentAmount: safe(santander.downPaymentAmount),
      expensesFinancedValue: safe(santander.expensesFinancedValue),
      iofValue: safe(santander.iofValue),
      valuationFeeAmount: safe(santander.valuationFeeAmount),
      totalFinancingValueWithExpenses: safe(
        santander.totalFinancingValueWithExpenses
      ),
      trIndexer: safeString(santander.trIndexer),
      customerPortfolioName: safeString(santander.customerPortfolioName),
      campaign: safeString(santander.campaign),
      campaignKey: safeString(santander.campaignKey),
      segment: safeString(santander.segment),
      segmentKey: safeString(santander.segmentKey),
      relationShipOffer: safeString(santander.relationShipOffer),
      relationShipOfferKey: safeString(santander.relationShipOfferKey),
      insurer: safeString(santander.insurer),
      insurerKey: safeString(santander.insurerKey),
      amortizationType: safeString(santander.amortizationType),
      amortizationTypeKey: safeString(santander.amortizationTypeKey),
      paymentType: safeString(santander.paymentType),
      paymentTypeKey: safeString(santander.paymentTypeKey),
      allowsToFinanceWarrantyEvaluationFee:
        !!santander.allowsToFinanceWarrantyEvaluationFee,
      allowsToFinanceIOF: !!santander.allowsToFinanceIOF,
      allowsToFinancePropertyRegistrationAndITBI:
        !!santander.allowsToFinancePropertyRegistrationAndITBI,
      allowsFGTS: !!santander.allowsFGTS,
      relationShipFlow: santander.relationShipFlow || null,
      unrelatedFlow: {
        calculatedSimulationType: safeString(
          unrelatedFlow.calculatedSimulationType
        ),
        annualInterestRate: safe(unrelatedFlow.annualInterestRate),
        monthlyInterestRate: safe(unrelatedFlow.monthlyInterestRate),
        firstPaymentAmount: safe(unrelatedFlow.firstPaymentAmount),
        lastPaymentAmount: safe(unrelatedFlow.lastPaymentAmount),
        cetRate: safe(unrelatedFlow.cetRate),
        ceshRate: safe(unrelatedFlow.ceshRate)
      }
    }

    return bankResponse
  }
}
