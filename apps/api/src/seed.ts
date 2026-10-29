import { config } from 'dotenv'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { makeDemoData, Role, SCHOOL_ID, schoolName } from './data'

config({ path: resolve(__dirname, '../../../.env'), quiet: true })
const prisma = new PrismaClient()
async function seed() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Demo seeding is disabled in production.')
  if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 12)
    throw new Error(
      'Set SEED_PASSWORD to a unique password of at least 12 characters in the backend environment.',
    )
  if (await prisma.school.findUnique({ where: { id: SCHOOL_ID } })) {
    console.log('Demo school already exists; no records changed.')
    return
  }
  const data = makeDemoData()
  const passwordHash = await hash(process.env.SEED_PASSWORD, 12)
  const roles: Role[] = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT']
  await prisma.$transaction(
    async (transaction) => {
      await transaction.school.create({
        data: { id: SCHOOL_ID, name: schoolName, slug: 'nusantara' },
      })
      await transaction.student.createMany({ data: data.students })
      await transaction.teacher.createMany({
        data: data.teachers.map((item) => ({ ...item, schoolId: SCHOOL_ID })),
      })
      await transaction.schoolClass.createMany({
        data: data.classes.map((item) => ({ ...item, schoolId: SCHOOL_ID })),
      })
      await transaction.subject.createMany({
        data: data.subjects.map((item) => ({ ...item, schoolId: SCHOOL_ID })),
      })
      await transaction.schedule.createMany({
        data: data.schedules.map((item) => ({ ...item, schoolId: SCHOOL_ID })),
      })
      await transaction.assignment.createMany({
        data: data.assignments.map((item) => ({ ...item, schoolId: SCHOOL_ID })),
      })
      await transaction.announcement.createMany({
        data: data.announcements.map((item) => ({ ...item, schoolId: SCHOOL_ID })),
      })
      await transaction.member.createMany({
        data: roles.map((role, index) => ({
          schoolId: SCHOOL_ID,
          role,
          name: ['Ucup', 'Ratna Puspita', 'Budi Santoso', data.students[0].name][index],
          email: `${role.toLowerCase()}@demo.edupilot.id`,
          passwordHash,
          className: index > 1 ? 'X-1' : null,
          studentId: role === 'STUDENT' ? data.students[0].id : null,
        })),
      })
    },
    { timeout: 30000 },
  )
  console.log(
    'Demo school seeded with 1,240 students, 64 teachers, 32 classes and 4 role accounts.',
  )
}
seed()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Seed failed')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
