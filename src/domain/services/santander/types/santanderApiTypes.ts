export interface SantanderApiPayload {
  query: string
  variables: {
    inputDataSimulation: {
      objFinancing: number
      financingAmount: number
      financingDeadlineInYears: number
      realtyAmount: number
      realtyType: string
      realtyUf: string
      utmSource: string
      nrPgCom: string
      userCode: string
      dataFirstBuyer: {
        buyerName: string
        buyerCpf: string
        buyerMobilePhone: string
        buyerEmail: string
        buyerIncome: number
        buyerBirthDate: string
      }
    }
  }
  operationName: string
}

export interface SantanderApiCustomPayload {
  simulationId: string
  flagFinancePropertyRegistrationAndITBI: boolean
  flagFinanceWarrantyEvaluationFee: boolean
  flagFinanceIOF: boolean
  insurerKey: string
  relationShipOfferKey: string
  amortizationTypeKey: string
  paymentTypeKey: string
  campaignKey: string
  segmentKey: string
  fgtsAmount: number
  flowType: string
  utmSource: string
  nrPgCom: string
  userCode: string
}

export interface SantanderAnalyzeCreditPayload {
  query: string
  variables: {
    inputDataCredit: {
      simulationId: string
      utmSource: string
      nrPgCom: string
      userCode: string
    }
  }
}

export interface SantanderIntegrateMiniPersonasPayload {
  query: string
  variables: {
    idSimulation: string
    body: {
      utmSource: string
      nrPgCom: string
      userCode: string
      clientData: {
        cpf: string
        name: string
        gender: string
        motherName: string
        natureOfOccupation: string
        occupation: string
        role: string
        company: string
        admissionDate: string
        email: string
        areaCodeCellPhone: string
        cellPhone: string
        areaCodeHomePhone: string
        homePhoneNumber: string
        maritalStatus: string
        isConsensualMarriage: boolean
        marriageDate: string | null
        matrimonialRegime: string | null
        nationality: string
        documentType: string
        documentNumber: string
        documentIssuingAuthority: string
        documentIssueState: string
        documentIssueDate: string
        addressData: {
          zipCode: string
          streetType: string
          address: string
          houseNumber: string
          addressComplement: string
          neighborhood: string
          city: string
          state: string
          residenceType: string
        }
      }
    }
  }
}
