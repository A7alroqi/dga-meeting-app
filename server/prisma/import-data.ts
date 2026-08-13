import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function reviveDates(_key: string, value: unknown) {
  return typeof value === "string" && ISO_DATE.test(value) ? new Date(value) : value;
}

function nullifyDanglingUserRefs(data: any) {
  const userIds = new Set(data.users.map((u: { id: string }) => u.id));
  const fields: [keyof typeof data, string][] = [
    ["tasks", "createdById"],
    ["tasks", "updatedById"],
    ["taskAssignees", "userId"],
    ["taskHistory", "changedById"],
    ["taskComments", "userId"],
    ["meetings", "createdById"],
    ["challenges", "createdById"],
    ["kpis", "updatedById"],
    ["meetingFiles", "uploadedById"],
  ];
  let nullified = 0;
  for (const [collection, field] of fields) {
    for (const row of data[collection] as Record<string, unknown>[]) {
      if (row[field] && !userIds.has(row[field])) {
        row[field] = null;
        nullified++;
      }
    }
  }
  if (nullified > 0) {
    console.log(`Nulled ${nullified} references to already-deleted user(s)`);
  }
}

async function main() {
  const inPath = path.join(__dirname, "data-export.json");
  const data = JSON.parse(readFileSync(inPath, "utf8"), reviveDates);
  nullifyDanglingUserRefs(data);

  await prisma.user.createMany({ data: data.users });
  await prisma.priorityCategory.createMany({ data: data.priorityCategories });
  await prisma.person.createMany({ data: data.people });
  await prisma.community.createMany({ data: data.communities });
  await prisma.communityCapability.createMany({ data: data.communityCapabilities });
  await prisma.governanceItem.createMany({ data: data.governanceItems });
  await prisma.agendaItem.createMany({ data: data.agendaItems });
  await prisma.meetingObjective.createMany({ data: data.meetingObjectives });
  await prisma.groundRule.createMany({ data: data.groundRules });
  await prisma.appSetting.createMany({ data: data.appSettings });

  await prisma.task.createMany({ data: data.tasks });
  await prisma.taskAssignee.createMany({ data: data.taskAssignees });
  await prisma.taskMilestone.createMany({ data: data.taskMilestones });
  await prisma.taskHistory.createMany({ data: data.taskHistory });
  await prisma.taskComment.createMany({ data: data.taskComments });

  await prisma.meeting.createMany({ data: data.meetings });
  await prisma.challenge.createMany({ data: data.challenges });
  await prisma.kpi.createMany({ data: data.kpis });
  await prisma.communityCapabilityValue.createMany({ data: data.communityCapabilityValues });
  await prisma.meetingFile.createMany({ data: data.meetingFiles });

  const counts = {
    users: await prisma.user.count(),
    priorityCategories: await prisma.priorityCategory.count(),
    tasks: await prisma.task.count(),
    taskAssignees: await prisma.taskAssignee.count(),
    taskMilestones: await prisma.taskMilestone.count(),
    taskHistory: await prisma.taskHistory.count(),
    taskComments: await prisma.taskComment.count(),
    meetings: await prisma.meeting.count(),
    challenges: await prisma.challenge.count(),
    kpis: await prisma.kpi.count(),
    communities: await prisma.community.count(),
    communityCapabilities: await prisma.communityCapability.count(),
    communityCapabilityValues: await prisma.communityCapabilityValue.count(),
    governanceItems: await prisma.governanceItem.count(),
    agendaItems: await prisma.agendaItem.count(),
    meetingObjectives: await prisma.meetingObjective.count(),
    groundRules: await prisma.groundRule.count(),
    appSettings: await prisma.appSetting.count(),
    people: await prisma.person.count(),
    meetingFiles: await prisma.meetingFile.count(),
  };
  console.log("Row counts after import:");
  console.log(counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
