import express from 'express'
import { setupSwagger } from './swagger'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
setupSwagger(app)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
