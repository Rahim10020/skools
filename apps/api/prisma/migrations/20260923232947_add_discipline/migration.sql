-- CreateEnum
CREATE TYPE "DisciplineType" AS ENUM ('WARNING', 'REPRIMAND', 'DETENTION', 'SUSPENSION', 'EXPULSION', 'OBSERVATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DisciplineStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESOLVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "discipline_records" (
    "id" TEXT NOT NULL,
    "establishment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "reported_by_id" TEXT,
    "type" "DisciplineType" NOT NULL,
    "status" "DisciplineStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discipline_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "discipline_records" ADD CONSTRAINT "discipline_records_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_records" ADD CONSTRAINT "discipline_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_records" ADD CONSTRAINT "discipline_records_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
