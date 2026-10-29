import { expect, test } from '@playwright/test'

const schoolId = '8cdfd39e-1d3a-49e1-9af0-46c7773cb02a'
const scenarios = [
  {
    role: 'TEACHER',
    label: 'Guru',
    name: 'Budi Santoso',
    initialMode: 'database',
    mode: 'database',
  },
  {
    role: 'STUDENT',
    label: 'Siswa',
    name: 'Aditya Pratama',
    initialMode: 'demo',
    mode: 'database',
  },
  { role: 'TEACHER', label: 'Guru', name: 'Budi Santoso', initialMode: 'demo', mode: 'demo' },
] as const

for (const scenario of scenarios) {
  test(`${scenario.label}: ${scenario.initialMode} to ${scenario.mode} uses correct authentication`, async ({
    page,
  }) => {
    let mode: string = scenario.initialMode
    let demoRequests = 0
    let loginRequests = 0
    let member = {
      id: 'admin-test',
      schoolId,
      name: 'Ucup',
      email: 'admin@demo.edupilot.id',
      role: 'ADMIN',
      className: 'X-1',
      studentId: null,
    }
    const targetMember = {
      ...member,
      id: 'target-test',
      name: scenario.name,
      role: scenario.role,
      email: `${scenario.role.toLowerCase()}@demo.edupilot.id`,
    }
    await page.route('**/api/**', async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      if (path === '/api/health') {
        await route.fulfill({ json: { status: 'ok', mode } })
      } else if (path === '/api/auth/me') {
        await route.fulfill({ json: member })
      } else if (path === '/api/auth/demo') {
        demoRequests++
        if (mode !== 'demo') {
          await route.fulfill({ status: 404, json: { message: 'Not Found' } })
        } else {
          expect(request.postDataJSON().role).toBe(scenario.role)
          member = targetMember
          await route.fulfill({ status: 201, json: member })
        }
      } else if (path === '/api/auth/login') {
        loginRequests++
        const body = request.postDataJSON()
        expect(body.schoolId).toBe(schoolId)
        expect(body.email).toBe(targetMember.email)
        if (body.password !== 'account-switch-test-password') {
          await route.fulfill({
            status: 401,
            json: { message: 'Email atau password tidak sesuai.' },
          })
        } else {
          member = targetMember
          await route.fulfill({ status: 201, json: member })
        }
      } else if (path === `/api/schools/${schoolId}/workspace`) {
        await route.fulfill({
          json: {
            school: { id: schoolId, name: 'SMA Nusantara', slug: 'nusantara' },
            demo: mode === 'demo',
            aiConfigured: false,
            academicYear: '2026/2027',
            students: [],
            teachers: [],
            classes: [
              { id: 'class-test', name: 'X-1', teacher: 'Budi Santoso', room: 'Ruang 101' },
            ],
            subjects: [],
            schedules: [],
            assignments: [],
            announcements: [],
            reports: [],
            audit: [],
            attendanceHistory: [],
            stats: {
              students: 0,
              teachers: 0,
              classes: 1,
              assignments: 0,
              attendance: 0,
              average: 0,
              periodAttendance: 0,
              present: 0,
              absent: 0,
            },
          },
        })
      } else {
        await route.fulfill({ status: 404, json: { message: 'Unexpected test endpoint' } })
      }
    })
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Halo, Ucup.' })).toBeVisible()
    mode = scenario.mode
    if (test.info().project.name === 'mobile') {
      await page.getByRole('button', { name: 'Buka navigasi' }).click()
    }
    await page.getByRole('button', { name: 'SMA Nusantara School workspace' }).click()
    await page.getByRole('button', { name: scenario.label, exact: true }).click()
    if (scenario.mode === 'database') {
      await expect(page).toHaveURL(/\/login$/)
      await expect(page.getByLabel('Email', { exact: true })).toHaveValue(targetMember.email)
      await expect(page.getByLabel('ID sekolah')).toHaveValue(schoolId)
      await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
      await expect(page.getByRole('button', { name: 'Buka workspace demo' })).toHaveCount(0)
      await page.getByLabel('Password', { exact: true }).fill('incorrect-test-password')
      await page.getByRole('button', { name: 'Masuk ke workspace' }).click()
      await expect(page.getByRole('alert')).toHaveText('Email atau password tidak sesuai.')
      expect(member.role).toBe('ADMIN')
      await page.getByLabel('Password', { exact: true }).fill('account-switch-test-password')
      await page.getByRole('button', { name: 'Masuk ke workspace' }).click()
    }
    await expect(
      page.getByRole('heading', { name: `Halo, ${scenario.name.split(' ')[0]}.` }),
    ).toBeVisible()
    expect(demoRequests).toBe(scenario.mode === 'demo' ? 1 : 0)
    expect(loginRequests).toBe(scenario.mode === 'demo' ? 0 : 2)
    if (scenario.role === 'STUDENT') {
      await expect(page.getByRole('link', { name: 'Data siswa', exact: true })).toHaveCount(0)
    }
  })
}
