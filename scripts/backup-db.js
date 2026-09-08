const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const [people, skills, personSkills, events, assignments] =
    await Promise.all([
      prisma.person.findMany(),
      prisma.skill.findMany(),
      prisma.personSkill.findMany(),
      prisma.event.findMany(),
      prisma.assignment.findMany(),
    ]);

  const backup = { people, skills, personSkills, events, assignments };

  const dir = path.join(__dirname, "..", "backups");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(dir, `backup-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2));

  console.log(`Backup written to ${outPath}`);
  console.log(
    `people=${people.length} skills=${skills.length} events=${events.length} assignments=${assignments.length}`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
