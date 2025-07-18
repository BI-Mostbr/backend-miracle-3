import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { setupSwagger } from './swagger'
import { ValidationMiddleware } from '@infra/middlewares/Validation.middleware'
import { createCreditSimulationRoutes } from '@infra/routes/CreditSimulation.routes'
import { RepositoryFactory } from '@infra/factories/Repository.factory'
import { CreditSimulationFactory } from '@infra/factories/CreditSimulation.factory'
import { ProposalControllerFactory } from '@infra/factories/ProposalController.factory'
import { createCreditProposalRoutes } from '@infra/routes/CreditProposal.routes'
import { ClientUpdateControllerFactory } from '@infra/factories/ClientUpdateController.factory'
import { createClientUpdateRoutes } from '@infra/routes/ClientUpdate.routes'
import { EvolucaoTeoricaFactory } from '@infra/factories/EvolucaoTeoricaInter.factory'
import { createEvolucaoTeoricaRoutes } from '@infra/routes/EvolucaoTeorica.routes'
const app = express()
app.use(
  cors({
    origin: [
      'https://api-miracle-hml.mostbr.com', // API homolog
      'https://hmlmiracle.mostbr.com.br', // Frontend homolog
      'http://localhost:3000', // Dev local
      'http://localhost:5173', // Vite dev
      'http://localhost:3001' // API local
    ],
    credentials: true
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
if (process.env.NODE_ENV !== 'production') {
  app.use(ValidationMiddleware.logRequest())
}
setupSwagger(app)
app.get('/', (req, res) => {
  res.json({
    message: 'Credit Simulation API',
    version: '1.0.0',
    status: 'running',
    docs: '/api-docs',
    timestamp: new Date().toISOString()
  })
})
const creditController = CreditSimulationFactory.createController()
const creditRoutes = createCreditSimulationRoutes(creditController)
app.use('/api/credit', creditRoutes)

const proposalController = ProposalControllerFactory.createController()
const proposalRoutes = createCreditProposalRoutes(proposalController)
app.use('/api/credit', proposalRoutes)

const clientUpdateController = ClientUpdateControllerFactory.createController()
const clientUpdateRoutes = createClientUpdateRoutes(clientUpdateController)
app.use('/api', clientUpdateRoutes)

const evolucaoTeoricaController = EvolucaoTeoricaFactory.createController()
const evolucaoTeoricaRoutes = createEvolucaoTeoricaRoutes(
  evolucaoTeoricaController
)
app.use('/api/credit', evolucaoTeoricaRoutes)

app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'unknown'
  }
  try {
    const prisma = RepositoryFactory.getPrismaClient()
    await prisma.$queryRaw`SELECT 1`
    healthCheck.database = 'connected'
  } catch (error) {
    healthCheck.database = 'disconnected'
    healthCheck.status = 'DEGRADED'
  }
  const statusCode = healthCheck.status === 'OK' ? 200 : 503
  res.status(statusCode).json(healthCheck)
})
// 404 - Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl,
    suggestion: 'Verifique a documentação em /api-docs'
  })
})
app.use(ValidationMiddleware.errorHandler())
const gracefulShutdown = async (signal: string) => {
  console.log(`Graceful shutdown iniciado por ${signal}...`)
  try {
    await RepositoryFactory.disconnect()
    console.log('Conexões com banco fechadas')
    process.exit(0)
  } catch (error) {
    console.error('Erro durante shutdown:', error)
    process.exit(1)
  }
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log('Credit Simulation API')
  console.log('================================')
  console.log(`Servidor: http://localhost:${PORT}`)
  console.log(`Docs: http://localhost:${PORT}/api-docs`)
  console.log(`Health: http://localhost:${PORT}/health`)
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Iniciado: ${new Date().toISOString()}`)
})
export { app }
