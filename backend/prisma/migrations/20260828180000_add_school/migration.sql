-- Escola Bíblica: turmas, matrículas, aulas e chamada (a caderneta).
-- Só cria estruturas novas.
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teacherId" TEXT,
    "teacherName" TEXT,
    "room" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassEnrollment" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassLesson" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "topic" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassLesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassAttendance" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    CONSTRAINT "ClassAttendance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SchoolClass_churchId_active_idx" ON "SchoolClass"("churchId", "active");
CREATE UNIQUE INDEX "ClassEnrollment_classId_memberId_key" ON "ClassEnrollment"("classId", "memberId");
CREATE INDEX "ClassEnrollment_memberId_idx" ON "ClassEnrollment"("memberId");
CREATE UNIQUE INDEX "ClassLesson_classId_day_key" ON "ClassLesson"("classId", "day");
CREATE INDEX "ClassLesson_churchId_day_idx" ON "ClassLesson"("churchId", "day");
CREATE UNIQUE INDEX "ClassAttendance_lessonId_memberId_key" ON "ClassAttendance"("lessonId", "memberId");
CREATE INDEX "ClassAttendance_memberId_idx" ON "ClassAttendance"("memberId");

ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_churchId_fkey"
    FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassLesson" ADD CONSTRAINT "ClassLesson_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "ClassLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
