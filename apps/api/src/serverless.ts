import type { Request, Response } from 'express'
import { createApi } from './create-app'

let application: ReturnType<typeof createApi> | undefined

export async function handler(request: Request, response: Response) {
  try {
    application ??= createApi()
      .then(async (app) => {
        await app.init()
        return app
      })
      .catch((error) => {
        application = undefined
        throw error
      })
    const app = await application
    app.getHttpAdapter().getInstance()(request, response)
  } catch {
    if (!response.headersSent) {
      response.status(503).json({
        statusCode: 503,
        message: 'Layanan belum siap. Silakan coba kembali.',
      })
    }
  }
}
