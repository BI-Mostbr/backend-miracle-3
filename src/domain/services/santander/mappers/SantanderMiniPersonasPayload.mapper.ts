import { CreditProposal } from '@domain/entities/CreditProposal'
import { SantanderIntegrateMiniPersonasPayload } from '../types/santanderApiTypes'
import { genderSantander } from 'Utils/mapToGender'
import { workTypeSantander } from 'Utils/mapToWorkType'
import { phoneRegexSantander } from 'Utils/phoneRegex'
import { convertDateBrToIso } from 'Utils/convertData'
import { mapToMatrimonialRegimeSantander } from 'Utils/mapToMatrimonialRegime'
import { maritalStatusSantander } from 'Utils/mapToMaritalStatus'
import { mapToDocumentTypeSantander } from 'Utils/mapToDocumentType'
import { removeNonLetterChars } from 'Utils/removeNonLetterChars'

export class SantanderMiniPersonasPayloadMapper {
  static convertToPayload(
    proposal: CreditProposal,
    idSimulation: string,
    idKey: string
  ): SantanderIntegrateMiniPersonasPayload {
    return {
      query:
        'mutation integrateClientMiniPersonas(    $idSimulation: ID!,     $body: InputIntegrateClientMiniPersonas) {    integrateClientMiniPersonas(        idSimulation: $idSimulation        body: $body    )}',
      variables: {
        idSimulation: idSimulation,
        body: {
          utmSource: 'mostpp',
          nrPgCom: '20495',
          userCode: '204951587699',
          clientData: {
            cpf: proposal.document,
            name: proposal.name,
            gender: genderSantander(proposal.gender),
            motherName: proposal.motherName,
            natureOfOccupation: workTypeSantander(proposal.workType),
            occupation: idKey,
            role: removeNonLetterChars(proposal.professionalPosition),
            company: 'GLACEON CONSULTORIA',
            admissionDate: '2021-01-01',
            email: proposal.email,
            areaCodeCellPhone: phoneRegexSantander(proposal.phone).ddd,
            cellPhone: phoneRegexSantander(proposal.phone).numero,
            areaCodeHomePhone: '11',
            homePhoneNumber: '99999999',
            maritalStatus: maritalStatusSantander(proposal.maritalStatus),
            isConsensualMarriage: false,
            marriageDate: convertDateBrToIso(proposal.marriageDate ?? ''),
            matrimonialRegime:
              proposal.matrimonialRegime === ''
                ? null
                : mapToMatrimonialRegimeSantander(proposal.matrimonialRegime),
            nationality: '14',
            documentType: mapToDocumentTypeSantander(proposal.documentType),
            documentNumber: proposal.documentNumber,
            documentIssuingAuthority: proposal.documentIssuer,
            documentIssueState: proposal.ufDataUser,
            documentIssueDate: convertDateBrToIso(proposal.documentIssueDate),
            addressData: {
              zipCode: proposal.userAddress.cep.replace(/\D/g, ''),
              streetType: 'RUA',
              address: removeNonLetterChars(proposal.userAddress.logradouro),
              houseNumber: proposal.userAddress.number,
              addressComplement: removeNonLetterChars(
                proposal.userAddress.complemento ?? ''
              ),
              neighborhood: removeNonLetterChars(proposal.userAddress.bairro),
              city: removeNonLetterChars(proposal.userAddress.localidade),
              state: proposal.userAddress.estado,
              residenceType: '1'
            }
          }
        }
      }
    }
  }
}
