import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import governance from "./seedData/governance.json";
import agenda from "./seedData/agenda.json";
import objectives from "./seedData/objectives.json";
import groundRules from "./seedData/groundRules.json";
import categories from "./seedData/categories.json";
import tasksData from "./seedData/tasks.json";
import communitiesData from "./seedData/communities.json";
import capabilitiesData from "./seedData/capabilities.json";
import capabilityMatrix from "./seedData/capabilityMatrix.json";
import kpisData from "./seedData/kpis.json";

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log("Users already exist, skipping admin bootstrap.");
    return;
  }
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD env vars are required to bootstrap the first admin account."
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: "مدير النظام",
      role: "admin",
      isActive: true,
    },
  });
  console.log(`Created initial admin account: ${email} (change the password after first login).`);
}

async function seedReferenceContent() {
  if ((await prisma.governanceItem.count()) === 0) {
    await prisma.governanceItem.createMany({ data: governance });
  }
  if ((await prisma.agendaItem.count()) === 0) {
    await prisma.agendaItem.createMany({ data: agenda });
  }
  if ((await prisma.meetingObjective.count()) === 0) {
    await prisma.meetingObjective.createMany({ data: objectives });
  }
  if ((await prisma.groundRule.count()) === 0) {
    await prisma.groundRule.createMany({ data: groundRules });
  }
  if ((await prisma.appSetting.count()) === 0) {
    await prisma.appSetting.createMany({
      data: [
        { key: "meeting_title", value: "الاجتماع الدوري - مهام تخطيط الابتكار" },
        { key: "department_name", value: "إدارة تخطيط الابتكار" },
        { key: "year", value: "2026" },
      ],
    });
  }
}

async function seedDefaultMeeting() {
  if ((await prisma.meeting.count()) === 0) {
    await prisma.meeting.create({
      data: {
        meetingDate: new Date(),
        title: "الاجتماع الدوري الأسبوعي",
      },
    });
  }
}

async function seedCategories() {
  const codeToId: Record<string, string> = {};
  for (const cat of categories) {
    const existing = await prisma.priorityCategory.findUnique({ where: { code: cat.code } });
    const record =
      existing ??
      (await prisma.priorityCategory.create({
        data: {
          code: cat.code,
          nameAr: cat.nameAr,
          descriptionAr: cat.descriptionAr,
          sortOrder: cat.sortOrder,
        },
      }));
    codeToId[cat.code] = record.id;
  }
  return codeToId;
}

async function seedTasks(codeToId: Record<string, string>, adminId: string) {
  if ((await prisma.task.count()) > 0) {
    console.log("Tasks already seeded, skipping.");
    return;
  }
  for (const t of tasksData as Array<{
    title: string;
    categoryCode: string;
    priorityLevel: string;
    status: string;
    completionPercent: number;
    latestUpdateNote: string | null;
    dueDateRaw: string | null;
    dueDate: string | null;
    isOngoing: boolean;
    owners: string[];
    milestones: { label: string; isDone: boolean }[];
  }>) {
    await prisma.task.create({
      data: {
        title: t.title,
        categoryId: codeToId[t.categoryCode] ?? null,
        priorityLevel: t.priorityLevel,
        status: t.status,
        completionPercent: t.completionPercent,
        latestUpdateNote: t.latestUpdateNote,
        dueDateRaw: t.dueDateRaw,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        isOngoing: t.isOngoing,
        createdById: adminId,
        updatedById: adminId,
        assignees: t.owners.length
          ? { create: t.owners.map((name) => ({ displayName: name })) }
          : undefined,
        milestones: t.milestones.length
          ? {
              create: t.milestones.map((m, i) => ({
                label: m.label,
                isDone: m.isDone,
                sortOrder: i,
              })),
            }
          : undefined,
      },
    });
  }
  console.log(`Seeded ${tasksData.length} tasks (transcribed from the source deck's task tables).`);
}

async function seedKpis(codeToId: Record<string, string>, adminId: string) {
  if ((await prisma.kpi.count()) > 0) {
    console.log("KPIs already seeded, skipping.");
    return;
  }
  for (const k of kpisData as Array<{
    name: string;
    kpiType: string;
    targetUnit: string;
    achievedUnit: string;
    targetValue: number | null;
    achievedValue: number | null;
    year: number;
    sortOrder: number;
  }>) {
    await prisma.kpi.create({
      data: {
        categoryId: codeToId["gov_reference"] ?? null,
        kpiType: k.kpiType,
        name: k.name,
        targetValue: k.targetValue,
        targetUnit: k.targetUnit,
        achievedValue: k.achievedValue,
        achievedUnit: k.achievedUnit,
        year: k.year,
        sortOrder: k.sortOrder,
        updatedById: adminId,
      },
    });
  }
  console.log(
    "Seeded KPI names for 2026. IMPORTANT: most target/achieved numeric values were NOT " +
      "reliably extractable from the source slide's raw text layout and were left blank on " +
      "purpose rather than guessed — an admin must fill these in via the KPI editor against " +
      "the original deck (slides 9-10). Two indicators with unambiguous values were pre-filled."
  );
}

async function seedCommunities() {
  if ((await prisma.community.count()) > 0) {
    console.log("Communities already seeded, skipping.");
    return;
  }
  const codeToId: Record<string, string> = {};
  for (const c of communitiesData as Array<{
    code: string;
    name: string;
    sourceUrl: string;
    statValue: string;
    statLabel: string;
    statCaption: string;
    whatIsIt: string;
    whatItDoes: string;
    sortOrder: number;
  }>) {
    const record = await prisma.community.create({
      data: {
        name: c.name,
        sourceUrl: c.sourceUrl,
        statValue: c.statValue,
        statLabel: c.statLabel,
        statCaption: c.statCaption,
        whatIsIt: c.whatIsIt,
        whatItDoes: c.whatItDoes,
        sortOrder: c.sortOrder,
      },
    });
    codeToId[c.code] = record.id;
  }

  const capabilityIds: string[] = [];
  for (const cap of capabilitiesData as Array<{ name: string; sortOrder: number }>) {
    const record = await prisma.communityCapability.create({ data: cap });
    capabilityIds.push(record.id);
  }

  for (const row of capabilityMatrix as Array<{
    capabilityIndex: number;
    values: Record<string, string>;
  }>) {
    const capabilityId = capabilityIds[row.capabilityIndex];
    for (const [communityCode, value] of Object.entries(row.values)) {
      const communityId = codeToId[communityCode];
      if (!communityId) continue;
      await prisma.communityCapabilityValue.create({
        data: { communityId, capabilityId, value },
      });
    }
  }
  console.log(
    `Seeded ${communitiesData.length} communities and ${capabilitiesData.length} capability dimensions.`
  );
}

async function main() {
  await bootstrapAdmin();
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "admin" } });
  await seedReferenceContent();
  await seedDefaultMeeting();
  const codeToId = await seedCategories();
  await seedTasks(codeToId, admin.id);
  await seedKpis(codeToId, admin.id);
  await seedCommunities();
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
