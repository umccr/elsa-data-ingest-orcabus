import { getDataset } from '../dbschema/queries.ts';
import { createClient } from 'gel';

async function main() {
  try {
    const args: string[] = process.argv.slice(2, 3);

    const datasetId = args[0] as string;

    if (datasetId == null) {
      console.log('Usage:\n bun run ingest/stats <dataset uuid>');
    }

    const datasetStats = await getDataset(createClient(), {
      id: datasetId,
    });
    console.log(datasetStats);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // sound-of-silence
  }
}

await main();
