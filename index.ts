// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { extract, parseS3Uri, readCsvFromS3 } from './extract/module.ts';
import { ingest } from './ingest/module.ts';

async function main(): Promise<void> {
  const csvData = await extract();

  // DEBUG - Uncomment to bypass the real extraction process from Athena and reuse the existing query result.
  // const { bucket, key } = parseS3Uri('s3://orcahouse-staging-data-472057503814/athena-query-results/7949be4f-cf79-4acb-bc32-006ec157225d.csv');
  // const csvData = await readCsvFromS3(bucket, key);

  console.log('--------------------------------');
  console.log(`Ingesting ${csvData.length} rows.`);
  console.log('--------------------------------');
  const ingestedDatasetId = await ingest(csvData);
  console.log(ingestedDatasetId);
}
await main();
