import axios from 'axios'

export class ItauAuthService {
  private readonly tokenUrl: string
  private readonly clientId: string
  private readonly clientSecret: string
  private cachedToken?: { token: string; expiresAt: Date }

  constructor() {
    this.tokenUrl = process.env.ITAU_TOKEN_URL!
    this.clientId = process.env.ITAU_CLIENT_ID!
    this.clientSecret = process.env.ITAU_CLIENT_SECRET!
  }

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > new Date()) {
      return this.cachedToken.token
    }

    try {
      const response = await axios.post(
        this.tokenUrl,
        {
          grant_type: 'client_credentials',
          scope: 'credit_simulation'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Bearer eyJraWQiOiIxNDZlNTY1Yy02ZjQ4LTRhN2EtOTU3NS1kYjg2MjE5YTc5N2MucHJkLmdlbi4xNTk3NjAwMTI1ODQ4Lmp3dCIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkM2I3MDA3My1iYzE3LTQ1YjUtYmEzZS1kMWRlNzE0YWVlNjQiLCJpc3MiOiJodHRwczovL29wZW5pZC5pdGF1LmNvbS5ici9hcGkvb2F1dGgvdG9rZW4iLCJpYXQiOjE3MTIwODcxMDUsImV4cCI6MTcxMjA4NzQwNSwiQWNjZXNzX1Rva2VuIjoiMmFhM2ZlOTUuODM4ZTAzMzktMjBkZC00NGY3LTk1MmYtNmI4NDViNzc4Nzg4IiwidXNyIjoibnVsbCIsImZsb3ciOiJDQyIsInNvdXJjZSI6IkVYVCIsInNpdGUiOiJjdG1tMiIsImVudiI6IlAiLCJtYmkiOiJ0cnVlIiwiYXV0IjoiTUFSI'
          }
        }
      )
      const { access_token, expires_in } = response.data
      const expiresAt = new Date(Date.now() + expires_in * 1000 - 6000)

      this.cachedToken = {
        token: access_token,
        expiresAt: expiresAt
      }
      return access_token
    } catch (error) {
      console.error('Error getting Itaú access token:', error)
      throw new Error('Failed to authenticate with Itaú API')
    }
  }
}
