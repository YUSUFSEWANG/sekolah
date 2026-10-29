import 'reflect-metadata'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { createApi } from './create-app'

async function bootstrap() {
  loadEnv({ path: resolve(__dirname, '../../../.env'), quiet: true })
  const app = await createApi()
  app.enableShutdownHooks()
  await app.listen(Number(process.env.PORT ?? 3001), '127.0.0.1')
}
bootstrap().catch(() => {
  console.error('API gagal dimulai. Periksa konfigurasi PostgreSQL dan port.')
  process.exitCode = 1
})
