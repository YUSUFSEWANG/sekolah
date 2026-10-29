import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { makeDemoData, Member, Role, SCHOOL_ID, SchoolData, Status, Student } from './data'

@Injectable()
export class Store implements OnModuleInit, OnModuleDestroy {
  readonly demo =
    process.env.NODE_ENV !== 'production' &&
    process.env.DEMO_MODE !== 'false' &&
    !process.env.DATABASE_URL
  readonly prisma = this.demo ? null : new PrismaClient()
  readonly data = new Map<string, SchoolData>()
  readonly members: Member[] = []
  private sessions = new Map<string, { memberId: string; expiresAt: Date }>()

  async onModuleInit() {
    if (this.prisma) {
      await this.prisma.$connect()
      return
    }
    const data = makeDemoData()
    this.data.set(SCHOOL_ID, data)
    const passwordHash = await hash('EduPilot-Demo2026!', 12)
    const roles: Role[] = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT']
    const names = ['Ucup', 'Ratna Puspita', 'Budi Santoso', data.students[0].name]
    roles.forEach((role, index) =>
      this.members.push({
        id: randomUUID(),
        schoolId: SCHOOL_ID,
        email: `${role.toLowerCase()}@demo.edupilot.id`,
        name: names[index],
        role,
        passwordHash,
        className: index > 1 ? 'X-1' : null,
        studentId: role === 'STUDENT' ? data.students[0].id : null,
      }),
    )
  }
  async onModuleDestroy() {
    await this.prisma?.$disconnect()
  }
  async memberByEmail(email: string, schoolId: string) {
    return this.prisma
      ? this.prisma.member.findUnique({ where: { schoolId_email: { schoolId, email } } })
      : this.members.find((member) => member.email === email && member.schoolId === schoolId)
  }
  async session(token: string): Promise<Member | null> {
    const tokenHash = createHash('sha256').update(token).digest('hex')
    if (this.prisma) {
      const session = await this.prisma.session.findUnique({
        where: { tokenHash },
        include: { member: true },
      })
      return session && session.expiresAt > new Date() ? session.member : null
    }
    const session = this.sessions.get(tokenHash)
    if (!session || session.expiresAt <= new Date()) {
      this.sessions.delete(tokenHash)
      return null
    }
    return this.members.find((member) => member.id === session.memberId) ?? null
  }
  async createSession(memberId: string) {
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
    if (this.prisma) await this.prisma.session.create({ data: { tokenHash, memberId, expiresAt } })
    else {
      for (const [key, value] of this.sessions)
        if (value.expiresAt <= new Date()) this.sessions.delete(key)
      if (this.sessions.size >= 1000) this.sessions.delete(this.sessions.keys().next().value!)
      this.sessions.set(tokenHash, { memberId, expiresAt })
    }
    return token
  }
  async logout(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex')
    if (this.prisma) await this.prisma.session.deleteMany({ where: { tokenHash } })
    else this.sessions.delete(tokenHash)
  }
  async read(schoolId: string): Promise<SchoolData> {
    if (!this.prisma) return this.data.get(schoolId)!
    const where = { schoolId }
    const [
      students,
      teachers,
      classes,
      subjects,
      assignments,
      announcements,
      reports,
      audit,
      attendanceHistory,
      schedules,
    ] = await Promise.all([
      this.prisma.student.findMany({
        where: { ...where, archived: false },
        orderBy: { number: 'asc' },
      }),
      this.prisma.teacher.findMany({ where }),
      this.prisma.schoolClass.findMany({ where }),
      this.prisma.subject.findMany({ where }),
      this.prisma.assignment.findMany({ where }),
      this.prisma.announcement.findMany({ where, orderBy: { date: 'desc' } }),
      this.prisma.report.findMany({ where, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }),
      this.prisma.attendanceRecord.findMany({ where }),
      this.prisma.schedule.findMany({ where }),
    ])
    return {
      students: students as Student[],
      teachers,
      classes,
      subjects,
      assignments,
      announcements,
      reports,
      audit,
      schedules,
      attendanceHistory: attendanceHistory as SchoolData['attendanceHistory'],
    }
  }
  async student(schoolId: string, student: Student, archive = false) {
    if (this.prisma)
      await this.prisma.student.upsert({
        where: { id: student.id },
        create: { ...student, archived: archive },
        update: { ...student, archived: archive },
      })
    else {
      const data = this.data.get(schoolId)!
      const index = data.students.findIndex((item) => item.id === student.id)
      if (archive) {
        if (index >= 0) data.students.splice(index, 1)
      } else if (index >= 0) data.students[index] = student
      else data.students.unshift(student)
    }
  }
  async attendance(
    schoolId: string,
    date: string,
    records: { studentId: string; status: Status }[],
  ) {
    if (this.prisma) {
      await this.prisma.$transaction(
        records.flatMap((record) => [
          this.prisma!.attendanceRecord.upsert({
            where: { schoolId_studentId_date: { schoolId, studentId: record.studentId, date } },
            create: { schoolId, date, ...record },
            update: { status: record.status },
          }),
          this.prisma!.student.updateMany({
            where: { schoolId, id: record.studentId },
            data: { status: record.status },
          }),
        ]),
      )
    } else {
      const data = this.data.get(schoolId)!
      for (const record of records) {
        const student = data.students.find((item) => item.id === record.studentId)!
        student.status = record.status
        const previous = data.attendanceHistory.find(
          (item) => item.date === date && item.studentId === record.studentId,
        )
        if (previous) previous.status = record.status
        else data.attendanceHistory.push({ date, ...record })
      }
    }
  }
  async add(
    schoolId: string,
    kind: 'assignments' | 'announcements' | 'reports' | 'audit',
    value: any,
  ) {
    if (!this.prisma) {
      this.data.get(schoolId)![kind].unshift(value)
      return
    }
    const data = { ...value, schoolId }
    if (kind === 'assignments') await this.prisma.assignment.create({ data })
    if (kind === 'announcements') await this.prisma.announcement.create({ data })
    if (kind === 'reports') await this.prisma.report.create({ data })
    if (kind === 'audit') await this.prisma.auditLog.create({ data })
  }
  async audit(member: Member, action: string) {
    await this.add(member.schoolId, 'audit', {
      id: randomUUID(),
      actor: member.name,
      action,
      createdAt: new Date().toISOString(),
    })
  }
}
