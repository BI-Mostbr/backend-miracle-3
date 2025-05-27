import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export class ValidationMiddleware {
  static validateRequest(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.body)
        req.body = validatedData

        console.log('Request validation successful')
        next()
      } catch (error) {
        console.error('Request validation failed:', error)

        if (error instanceof ZodError) {
          res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          })
        } else {
          const err = error as Error
          res.status(400).json({
            success: false,
            message: 'Erro de validação',
            errors: [{ message: err.message }]
          })
        }
      }
    }
  }

  static validateParams(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedParams = schema.parse(req.params)
        req.params = validatedParams

        console.log('Params validation successful')
        next()
      } catch (error) {
        console.error('Params validation failed:', error)

        if (error instanceof ZodError) {
          res.status(400).json({
            success: false,
            message: 'Parâmetros inválidos',
            errors: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          })
        } else {
          res.status(400).json({
            success: false,
            message: 'Erro de validação de parâmetros'
          })
        }
      }
    }
  }

  static logRequest() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now()

      console.log(`🚀 ${req.method} ${req.path}`, {
        body: req.body,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString()
      })

      res.on('finish', () => {
        const duration = Date.now() - start
        console.log(
          `✅ ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
        )
      })

      next()
    }
  }

  static errorHandler() {
    return (
      error: Error,
      req: Request,
      res: Response,
      next: NextFunction
    ): void => {
      console.error('Unhandled error:', error)

      if (res.headersSent) {
        return next(error)
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}
