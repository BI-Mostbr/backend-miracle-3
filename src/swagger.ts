import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import type { Express } from 'express'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Signatures',
      version: '1.0.0',
      description: 'Documentação da API de Assinaturas'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      }
    ]
  },
  // Caminho para os arquivos que contêm anotações Swagger
  apis: ['./src/infra/routes/*.ts', './src/models/*.ts']
}

const specs = swaggerJsdoc(options)

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
}
