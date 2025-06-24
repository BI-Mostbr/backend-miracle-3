import { decryptJasypt, encryptJasypt } from 'Utils/crypto'

const original = '41525947'
const encrypted = encryptJasypt(original)
console.log('Encrypted:', encrypted)
console.log('Decrypted:', decryptJasypt('83sbAcPbUs2b935cguFkqcx36la2iQMI')) // Deve retornar "meu segredo"
