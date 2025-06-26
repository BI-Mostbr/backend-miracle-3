import { decryptJasypt, encryptAes, encryptJasypt } from 'Utils/crypto'
const original = 'dyjGYAMS0qKnzPZt/JmMKoGOaGGoNzSB'
const encrypted = encryptAes(original)
console.log('Encrypted:', encrypted)
console.log('Decrypted:', decryptJasypt('83sbAcPbUs2b935cguFkqcx36la2iQMI')) // Deve retornar "meu segredo"
