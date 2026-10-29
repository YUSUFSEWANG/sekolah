import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export async function createApi() {
  const { AppModule } = await import('./app')
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )
  app.use(
    (
      _request: unknown,
      response: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      response.setHeader('X-Content-Type-Options', 'nosniff')
      response.setHeader('X-Frame-Options', 'DENY')
      response.setHeader('Cache-Control', 'no-store')
      next()
    },
  )
  const config = new DocumentBuilder()
    .setTitle('EduPilot API')
    .setDescription(
      'School-scoped API. Mutations require X-Edupilot-Action: 1. Demo accounts exist only in demo mode.',
    )
    .setVersion('0.1.0')
    .addCookieAuth('edupilot_session')
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'X-Edupilot-Action', description: 'Set to 1' },
      'csrf',
    )
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))
  return app
}
