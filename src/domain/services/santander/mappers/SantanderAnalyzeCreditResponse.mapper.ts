import { ISantanderAnalyzeCredit } from '@infra/interfaces/SantanderAnalyzeCredit.interface'

export class SantanderAnalyzeCreditResponseMapper {
  static convetToInternApiResponse(
    santanderResponse: any
  ): ISantanderAnalyzeCredit {
    return {
      returnCode: santanderResponse.returnCode,
      returnMessage: santanderResponse.returnMessage,
      garraProposal: santanderResponse.garraProposal,
      proposalValidity: santanderResponse.proposalValidity,
      reasonCode: santanderResponse.reasonCode,
      statusCode: santanderResponse.statusCode,
      condictionalCredit: santanderResponse.condictionalCredit
    }
  }
}
