import { ensureProgrammesSeeded } from "../src/lib/programmes";
import { prisma } from "../src/lib/prisma";

async function main() {
  await ensureProgrammesSeeded();
  const programmes = await prisma.programme.count();
  const subjects = await prisma.subject.count();
  console.log(`Seeded programmes=${programmes} subjects=${subjects}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
