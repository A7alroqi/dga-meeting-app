import { z } from "zod";
import { prisma } from "../db";
import { simpleCrudRouter } from "./simpleCrud";

export const categoriesRouter = simpleCrudRouter(
  prisma.priorityCategory,
  z.object({
    code: z.string().min(1),
    nameAr: z.string().min(1),
    descriptionAr: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
  }),
  z.object({
    code: z.string().min(1).optional(),
    nameAr: z.string().min(1).optional(),
    descriptionAr: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
  })
);

export const governanceRouter = simpleCrudRouter(
  prisma.governanceItem,
  z.object({
    responsibilityTask: z.string().min(1),
    responsibleText: z.string().min(1),
    sortOrder: z.number().int().optional(),
  }),
  z.object({
    responsibilityTask: z.string().min(1).optional(),
    responsibleText: z.string().min(1).optional(),
    sortOrder: z.number().int().optional(),
  })
);

export const agendaRouter = simpleCrudRouter(
  prisma.agendaItem,
  z.object({ label: z.string().min(1), sortOrder: z.number().int().optional() }),
  z.object({ label: z.string().min(1).optional(), sortOrder: z.number().int().optional() })
);

export const objectivesRouter = simpleCrudRouter(
  prisma.meetingObjective,
  z.object({ text: z.string().min(1), sortOrder: z.number().int().optional() }),
  z.object({ text: z.string().min(1).optional(), sortOrder: z.number().int().optional() })
);

export const groundRulesRouter = simpleCrudRouter(
  prisma.groundRule,
  z.object({ text: z.string().min(1), sortOrder: z.number().int().optional() }),
  z.object({ text: z.string().min(1).optional(), sortOrder: z.number().int().optional() })
);

export const communitiesRouter = simpleCrudRouter(
  prisma.community,
  z.object({
    name: z.string().min(1),
    sourceUrl: z.string().nullable().optional(),
    statValue: z.string().nullable().optional(),
    statLabel: z.string().nullable().optional(),
    statCaption: z.string().nullable().optional(),
    whatIsIt: z.string().nullable().optional(),
    whatItDoes: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
  }),
  z.object({
    name: z.string().min(1).optional(),
    sourceUrl: z.string().nullable().optional(),
    statValue: z.string().nullable().optional(),
    statLabel: z.string().nullable().optional(),
    statCaption: z.string().nullable().optional(),
    whatIsIt: z.string().nullable().optional(),
    whatItDoes: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
  })
);

export const peopleRouter = simpleCrudRouter(
  prisma.person,
  z.object({
    name: z.string().min(1),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
  z.object({
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
);

export const capabilitiesRouter = simpleCrudRouter(
  prisma.communityCapability,
  z.object({ name: z.string().min(1), sortOrder: z.number().int().optional() }),
  z.object({ name: z.string().min(1).optional(), sortOrder: z.number().int().optional() })
);
