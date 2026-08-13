import { writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const data = {
    users: await prisma.user.findMany(),
    priorityCategories: await prisma.priorityCategory.findMany(),
    tasks: await prisma.task.findMany(),
    taskAssignees: await prisma.taskAssignee.findMany(),
    taskMilestones: await prisma.taskMilestone.findMany(),
    taskHistory: await prisma.taskHistory.findMany(),
    taskComments: await prisma.taskComment.findMany(),
    meetings: await prisma.meeting.findMany(),
    challenges: await prisma.challenge.findMany(),
    kpis: await prisma.kpi.findMany(),
    communities: await prisma.community.findMany(),
    communityCapabilities: await prisma.communityCapability.findMany(),
    communityCapabilityValues: await prisma.communityCapabilityValue.findMany(),
    governanceItems: await prisma.governanceItem.findMany(),
    agendaItems: await prisma.agendaItem.findMany(),
    meetingObjectives: await prisma.meetingObjective.findMany(),
    groundRules: await prisma.groundRule.findMany(),
    appSettings: await prisma.appSetting.findMany(),
    people: await prisma.person.findMany(),
    meetingFiles: await prisma.meetingFile.findMany(),
  };

  const outPath = path.join(__dirname, "data-export.json");
  writeFileSync(outPath, JSON.stringify(data, null, 2));

  for (const [key, rows] of Object.entries(data)) {
    console.log(`${key}: ${(rows as unknown[]).length}`);
  }
  console.log(`\nWritten to ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
