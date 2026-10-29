const { randomBytes } = require('node:crypto')
const { existsSync, readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { spawnSync } = require('node:child_process')
const { parse } = require('dotenv')

const root = resolve(__dirname, '..')
const environmentPath = resolve(root, '.env.vercel.production.local')
const accountsPath = resolve(root, '.env.vercel-accounts.local')

function run() {
  if (!existsSync(environmentPath)) throw new Error('Pull the Vercel production environment first.')
  const cloud = parse(readFileSync(environmentPath))
  const databaseUrl = cloud.DATABASE_URL_UNPOOLED || cloud.DATABASE_URL
  if (!databaseUrl || ['localhost', '127.0.0.1', '::1'].includes(new URL(databaseUrl).hostname)) {
    throw new Error('A cloud PostgreSQL URL is required; local databases are not modified.')
  }
  if (!existsSync(accountsPath)) {
    writeFileSync(accountsPath, `SEED_PASSWORD=${randomBytes(24).toString('base64url')}\n`, {
      flag: 'wx',
      mode: 0o600,
    })
  }
  const credentials = parse(readFileSync(accountsPath))
  if (!credentials.SEED_PASSWORD || credentials.SEED_PASSWORD.length < 20) {
    throw new Error('The deployment seed password must contain at least 20 characters.')
  }
  const environment = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    SEED_PASSWORD: credentials.SEED_PASSWORD,
    NODE_ENV: 'development',
    DEMO_MODE: 'false',
  }
  for (const command of [
    [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    [resolve(root, 'apps/api/dist-vercel/seed.js')],
  ]) {
    const result = spawnSync(process.execPath, command, {
      cwd: root,
      env: environment,
      encoding: 'utf8',
    })
    if (result.status !== 0) {
      throw new Error('Cloud database setup failed. Credentials and provider output were withheld.')
    }
  }
  console.log(
    'Cloud migrations and demo seed completed. Deployment password is in .env.vercel-accounts.local; it was not printed.',
  )
}

try {
  run()
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Cloud database setup failed.')
  process.exitCode = 1
}
