const { cpSync, copyFileSync, mkdirSync } = require('node:fs')
const { basename, join } = require('node:path')
const { spawnSync } = require('node:child_process')

const source = '/source'
const workspace = '/tmp/edupilot-linux'
mkdirSync(workspace, { recursive: true })
copyFileSync(join(source, 'package.json'), join(workspace, 'package.json'))
for (const directory of ['apps', 'prisma']) {
  cpSync(join(source, directory), join(workspace, directory), {
    recursive: true,
    filter: (path) =>
      !['node_modules', 'dist', 'dist-vercel', 'package-lock.json'].includes(basename(path)) &&
      !basename(path).startsWith('.env'),
  })
}
for (const args of [
  ['install', '--ignore-scripts'],
  ['run', 'build:vercel'],
]) {
  const result = spawnSync('npm', args, {
    cwd: workspace,
    env: { ...process.env, DEMO_MODE: 'true', DATABASE_URL: '', NODE_ENV: 'development' },
    stdio: 'inherit',
  })
  if (result.status !== 0) process.exit(result.status || 1)
}
copyFileSync(join(workspace, 'package-lock.json'), '/output/package-lock.json')
console.log('PASS: clean Linux install and complete Vercel build. Generated lockfile exported.')
