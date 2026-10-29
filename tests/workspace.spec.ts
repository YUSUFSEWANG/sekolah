import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Halo, Ucup.' })).toBeVisible()
})

test('dashboard renders assets, filters and every workspace route', async ({ page }, testInfo) => {
  await expect(page.locator('.stat-card')).toHaveCount(4)
  await expect(page.locator('.event-feature img')).toHaveJSProperty('complete', true)
  expect(
    await page
      .locator('.event-feature img')
      .evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true })
  await page.getByRole('combobox', { name: 'Filter kelas dashboard' }).selectOption('X-1')
  await expect(page.getByRole('heading', { name: 'Agenda kelas X-1' })).toBeVisible()
  await page.getByRole('button', { name: 'Nilai', exact: true }).click()
  await expect(page.locator('.chart-summary')).toContainText('rata-rata nilai')
  for (const path of [
    'students',
    'teachers',
    'classes',
    'subjects',
    'schedules',
    'attendance',
    'assignments',
    'grades',
    'reports',
    'announcements',
    'settings',
    'profile',
  ]) {
    await page.goto(`/${path}`)
    await expect(page.locator('main h1')).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
})

test('student CRUD, attendance and grades persist via API', async ({ page }, testInfo) => {
  const name = `Nara E2E ${testInfo.project.name}`
  const nis = `E2E${Date.now()}`
  await page.goto('/students')
  await page.getByRole('button', { name: 'Tambah siswa', exact: true }).click()
  await page.getByLabel('Nama lengkap').fill(name)
  await page.getByLabel('NIS', { exact: true }).fill(nis)
  await page.getByLabel('Email', { exact: true }).fill(`${nis}@example.test`)
  await page.getByRole('button', { name: 'Simpan siswa' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('textbox', { name: 'Cari nama, NIS, atau kelas...' }).fill(nis)
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill(`${nis}.updated@example.test`)
  await page.getByRole('button', { name: 'Simpan siswa' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByText(`${nis}.updated@example.test`)).toBeVisible()
  await page.goto('/attendance')
  await page
    .getByRole('group', { name: `Kehadiran ${name}`, exact: true })
    .getByRole('button', { name: 'Izin', exact: true })
    .click()
  await page.getByRole('button', { name: 'Simpan absensi' }).click()
  await expect(page.getByRole('status')).toContainText('berhasil disimpan')
  await page.reload()
  await expect(
    page
      .getByRole('group', { name: `Kehadiran ${name}`, exact: true })
      .getByRole('button', { name: 'Izin', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/grades')
  await page.getByRole('spinbutton', { name: `Nilai ${name}`, exact: true }).fill('93')
  await page.getByRole('button', { name: 'Simpan nilai' }).click()
  await expect(page.getByRole('status')).toContainText('Nilai berhasil disimpan')
  await page.reload()
  await expect(page.getByRole('spinbutton', { name: `Nilai ${name}`, exact: true })).toHaveValue(
    '93',
  )
  await page.goto(`/students?q=${nis}`)
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Ekspor CSV' }).click()
  expect((await downloadEvent).suggestedFilename()).toBe('siswa-nusantara.csv')
  await page.getByRole('button', { name: `Arsipkan ${name}`, exact: true }).click()
  await page.getByRole('button', { name: 'Arsipkan siswa', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Siswa tidak ditemukan' })).toBeVisible()
})

test('AI fallback declares provenance and requires review before saving', async ({ page }) => {
  await page.goto('/ai-assistant')
  await expect(page.getByText('Mode ringkasan otomatis', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ringkasan kehadiran', exact: true }).click()
  await expect(page.locator('.source-note')).toContainText('tanpa model AI')
  await page.getByRole('button', { name: 'Tinjau & simpan' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Konfirmasi & simpan' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Draf tersimpan' })).toBeDisabled()
  await page.goto('/reports')
  await expect(
    page.getByRole('button', { name: /Ringkasan akademik sekolah/ }).first(),
  ).toBeVisible()
})

test('student permissions and logout cannot be bypassed by direct navigation', async ({ page }) => {
  await page.request.post('/api/auth/demo', {
    headers: { 'X-Edupilot-Action': '1' },
    data: { role: 'STUDENT' },
  })
  await page.goto('/students')
  await expect(page.getByRole('heading', { name: 'Akses terbatas' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Data siswa', exact: true })).toHaveCount(0)
  const session = await page.request.get('/api/auth/me')
  const member = await session.json()
  const denied = await page.request.post(`/api/schools/${member.schoolId}/ai`, {
    headers: { 'X-Edupilot-Action': '1' },
    data: { prompt: 'Data sekolah' },
  })
  expect(denied.status()).toBe(403)
  const otherSchool = await page.request.get('/api/schools/another-school/workspace')
  expect(otherSchool.status()).toBe(403)
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Keluar dari akun' }).click()
  await expect(page.getByRole('button', { name: 'Buka workspace demo' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Buka workspace demo' })).toBeVisible()
  const me = await page.request.get('/api/auth/me')
  expect(me.status()).toBe(401)
})
