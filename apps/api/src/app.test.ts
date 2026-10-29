import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeDemoData, Member, SCHOOL_ID, scopedData, summarize } from './data'
import { Test } from '@nestjs/testing'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { ApiExceptionFilter, AppModule } from './app'
import type { ArgumentsHost } from '@nestjs/common'

test('database conflicts and internal errors return safe consistent messages', () => {
  let statusCode = 0
  let result: { statusCode: number; message: string } | undefined
  const response = {
    status: (status: number) => {
      statusCode = status
      return response
    },
    json: (body: typeof result) => {
      result = body
    },
  }
  const host = { switchToHttp: () => ({ getResponse: () => response }) } as unknown as ArgumentsHost
  const filter = new ApiExceptionFilter()
  filter.catch({ code: 'P2002', message: 'private database detail' }, host)
  assert.equal(statusCode, 409)
  assert.ok(!result?.message.includes('private'))
  filter.catch(new Error('database connection credential'), host)
  assert.equal(statusCode, 500)
  assert.ok(!result?.message.includes('credential'))
})

test('HTTP authentication, tenant isolation, RBAC and validation', async () => {
  const previousUrl = process.env.DATABASE_URL
  const previousMode = process.env.DEMO_MODE
  delete process.env.DATABASE_URL
  process.env.DEMO_MODE = 'true'
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = module.createNestApplication()
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )
  await app.init()
  try {
    const agent = request.agent(app.getHttpServer())
    const path = `/api/schools/${SCHOOL_ID}`
    await agent.get(`${path}/workspace`).expect(401)
    await agent.post('/api/auth/demo').send({ role: 'ADMIN' }).expect(403)
    await agent
      .post('/api/auth/demo')
      .set('X-Edupilot-Action', '1')
      .send({ role: 'ADMIN' })
      .expect(201)
    const workspace = await agent.get(`${path}/workspace`).expect(200)
    const admin = await agent.get('/api/auth/me').expect(200)
    assert.equal(admin.body.name, 'Ucup')
    assert.equal(workspace.body.stats.students, 1240)
    await agent.get('/api/schools/another-school/workspace').expect(403)
    await agent
      .post(`${path}/students`)
      .set('X-Edupilot-Action', '1')
      .send({ name: 'A' })
      .expect(400)
    await agent
      .post('/api/auth/demo')
      .set('X-Edupilot-Action', '1')
      .send({ role: 'STUDENT' })
      .expect(201)
    const student = await agent.get(`${path}/workspace`).expect(200)
    assert.equal(student.body.students.length, 1)
    await agent.post(`${path}/students`).set('X-Edupilot-Action', '1').send({}).expect(403)
    await agent
      .post(`${path}/ai`)
      .set('X-Edupilot-Action', '1')
      .send({ prompt: 'Ringkasan' })
      .expect(403)
    await agent.post('/api/auth/logout').set('X-Edupilot-Action', '1').expect(201)
    await agent.get(`${path}/workspace`).expect(401)
    await agent
      .post('/api/auth/login')
      .set('X-Edupilot-Action', '1')
      .send({ email: 'admin@demo.edupilot.id', password: 'wrong', schoolId: SCHOOL_ID })
      .expect(401)
    await agent
      .post('/api/auth/login')
      .set('X-Edupilot-Action', '1')
      .send({
        email: 'admin@demo.edupilot.id',
        password: 'EduPilot-Demo2026!',
        schoolId: SCHOOL_ID,
      })
      .expect(201)
    await agent
      .post('/api/auth/demo')
      .set('X-Edupilot-Action', '1')
      .send({ role: 'TEACHER' })
      .expect(201)
    const outsider = workspace.body.students.find(
      (item: { className: string }) => item.className !== 'X-1',
    )
    await agent
      .post(`${path}/attendance`)
      .set('X-Edupilot-Action', '1')
      .send({ date: '2026-10-29', records: [{ studentId: outsider.id, status: 'Hadir' }] })
      .expect(403)
    await agent
      .patch(`${path}/grades/${outsider.id}`)
      .set('X-Edupilot-Action', '1')
      .send({ score: 80 })
      .expect(403)
    const ownStudent = workspace.body.students.find(
      (item: { className: string }) => item.className === 'X-1',
    )
    await agent
      .patch(`${path}/grades/${ownStudent.id}`)
      .set('X-Edupilot-Action', '1')
      .send({ score: 101 })
      .expect(400)
    await agent
      .patch(`${path}/grades/${ownStudent.id}`)
      .set('X-Edupilot-Action', '1')
      .send({ score: 90 })
      .expect(200)
  } finally {
    await app.close()
    if (previousUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousUrl
    if (previousMode === undefined) delete process.env.DEMO_MODE
    else process.env.DEMO_MODE = previousMode
  }
})

test('dashboard statistics are derived from school records', () => {
  const data = makeDemoData()
  assert.equal(summarize(data).students, 1240)
  assert.equal(summarize(data).classes, 32)
  data.students.pop()
  assert.equal(summarize(data).students, 1239)
})

test('teacher can only see assigned class and student only sees self', () => {
  const data = makeDemoData()
  const member: Member = {
    id: 'teacher',
    schoolId: SCHOOL_ID,
    email: '',
    name: '',
    role: 'TEACHER',
    passwordHash: '',
    className: 'X-1',
    studentId: null,
  }
  const teacherData = scopedData(data, member)
  assert.ok(teacherData.students.length > 0)
  assert.ok(teacherData.students.every((student) => student.className === 'X-1'))
  assert.ok(teacherData.schedules.every((schedule) => schedule.className === 'X-1'))
  const student = data.students[0]
  const studentData = scopedData(data, { ...member, role: 'STUDENT', studentId: student.id })
  assert.equal(studentData.students.length, 1)
  assert.equal(studentData.students[0].id, student.id)
  assert.equal(studentData.teachers.length, 0)
})
