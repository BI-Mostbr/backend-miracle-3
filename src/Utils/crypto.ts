import aesjs from 'aes-js'
import Jasypt from 'jasypt'

function parseArrayString(arrayString: string): number[] {
  return arrayString
    .replace(/[\[\]\s]/g, '')
    .split(',')
    .map(Number)
}

const key = parseArrayString(process.env.KEY!)
const iv = parseArrayString(process.env.IV!)

export function decryptAes(value: string): string {
  try {
    const aesOfb = new aesjs.ModeOfOperation.ofb(key, iv)
    const encryptedBytes = aesjs.utils.hex.toBytes(value)
    const decryptedBytes = aesOfb.decrypt(encryptedBytes)
    const decryptedString = aesjs.utils.utf8.fromBytes(decryptedBytes)
    const deBase64 = Buffer.from(decryptedString, 'base64').toString('ascii')
    return decodeURI(deBase64)
  } catch {
    return 'valor invalido'
  }
}

export function encryptAes(value: string): string {
  try {
    const emBase64 = Buffer.from(encodeURI(value)).toString('base64')
    const aesOfb = new aesjs.ModeOfOperation.ofb(key, iv)
    const textBytes = aesjs.utils.utf8.toBytes(emBase64)
    const encryptedBytes = aesOfb.encrypt(textBytes)
    return aesjs.utils.hex.fromBytes(encryptedBytes)
  } catch {
    return 'valor invalido'
  }
}

export function decryptJasypt(encryptedText: string): string {
  const password = process.env.PASSWORD
  if (!password) {
    throw new Error('Missing environment variable: PASSWORD')
  }
  const jasypt = new Jasypt()
  jasypt.setPassword(password)
  return jasypt.decrypt(encryptedText)
}

export function encryptJasypt(text: string): string {
  const password = process.env.PASSWORD
  if (!password) {
    throw new Error('Missing environment variable: PASSWORD')
  }
  const jasypt = new Jasypt()
  jasypt.setPassword(password)
  return jasypt.encrypt(text)
}
