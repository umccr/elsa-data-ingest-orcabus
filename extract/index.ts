// Show example usage of the Extract module
//      export AWS_PROFILE=umccr-prod-operator
//      bun run extract

import { extract } from './module.ts';

async function main(): Promise<void> {
  const csvData = await extract();
  console.log('--------------------------------');
  console.log('Parsed CSV data:');
  console.log(csvData.slice(0, 2));
  // console.log(csvData);
  console.log(csvData.length);
}

await main();
