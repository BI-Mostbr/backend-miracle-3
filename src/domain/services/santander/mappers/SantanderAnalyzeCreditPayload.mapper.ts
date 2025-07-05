import { SantanderAnalyzeCreditPayload } from '../types/santanderApiTypes'

export class SantanderAnalyzeCreditPayloadMapper {
  static convertToPayload(simulationId: string): SantanderAnalyzeCreditPayload {
    return {
      query:
        'mutation analyzeCredit($inputDataCredit : InputDataCredit){analyzeCredit(inputDataCredit: $inputDataCredit){returnCode returnMessage garraProposal proposalValidity reasonCode statusCode condictionalCredit}}',
      variables: {
        inputDataCredit: {
          simulationId: simulationId,
          utmSource: 'string',
          nrPgCom: '20495',
          userCode: '204951587699'
        }
      }
    }
  }
}
