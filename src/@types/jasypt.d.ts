declare module 'jasypt' {
  class Jasypt {
    constructor()
    setPassword(password: string): void
    encrypt(text: string): string
    decrypt(encryptedText: string): string
  }
  export = Jasypt
}
