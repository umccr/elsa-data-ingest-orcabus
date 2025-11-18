// Extract module

import {
  AthenaClient,
  GetQueryExecutionCommand,
  QueryExecutionState,
  StartQueryExecutionCommand,
} from '@aws-sdk/client-athena';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import type { Readable } from 'node:stream';
import { parse } from 'csv-parse';

// Standard AWS credential loading.
// The deployment script should set up the execution role with necessary access.
const athenaClient = new AthenaClient({});
const s3Client = new S3Client({});

// Configure the data warehouse constants (OrcaHouse Athena settings).
// https://github.com/umccr/orcahouse-doc/tree/main/athena
const CATALOG_NAME = 'orcavault';
const DATABASE_NAME = 'mart';
const WORKGROUP_NAME = 'orcahouse';

// Use parameters pass-in to the Athena SQL query script.
const SQL_QUERY_PARAMS = [
  'archive-prod-fastq-503977275616-ap-southeast-2',
  'CUP',
  'Tothill',
  'WGS',
];

// Load Athena SQL script
const SQL_QUERY = fs.readFileSync(path.join(__dirname, 'getByProject.sql'), 'utf-8');

// Interface contract from data warehouse side
// Keep the structure in sync with "getByProject.sql" column names
export interface CsvRow {
  sequencingRunId: string;
  sequencingRunDate: string;
  internalSubjectId: string;
  externalSubjectId: string;
  sampleId: string;
  phenotype: string;
  libraryId: string;
  source: string;
  type: string;
  ownerId: string;
  projectId: string;
  fastqPairedEndReadLabel: string;
  fastqPairedEndReadId: string;
  fastqFilename: string;
  fastqFilesize: string;
  fastqUri: string;
}

export async function extract() {
  const queryExecutionId = await runAthenaQuery();

  if (!queryExecutionId) {
    throw new Error('Failed to start query execution.');
  }

  const output = await pollForQueryCompletion(queryExecutionId);

  const { bucket, key } = parseS3Uri(output);

  return await readCsvFromS3(bucket, key);
}

async function runAthenaQuery() {
  try {
    const startCommand = new StartQueryExecutionCommand({
      QueryString: SQL_QUERY,
      QueryExecutionContext: {
        Catalog: CATALOG_NAME,
        Database: DATABASE_NAME,
      },
      WorkGroup: WORKGROUP_NAME,
      ExecutionParameters: SQL_QUERY_PARAMS,
    });

    const startResponse = await athenaClient.send(startCommand);
    const queryExecutionId = startResponse.QueryExecutionId;
    console.log(`Query started with ID: ${queryExecutionId}`);
    return queryExecutionId;
  } catch (error) {
    console.error('An error occurred during Athena query execution:', error);
  }
}

async function pollForQueryCompletion(queryExecutionId: string): Promise<string> {
  let status: QueryExecutionState | undefined;
  let output: string | undefined;
  console.log('Polling for query completion...');

  while (
    status !== QueryExecutionState.SUCCEEDED &&
    status !== QueryExecutionState.FAILED &&
    status !== QueryExecutionState.CANCELLED
  ) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const command = new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId });
    const response = await athenaClient.send(command);
    status = response.QueryExecution?.Status?.State;
    output = response.QueryExecution?.ResultConfiguration?.OutputLocation;
    const reason = response.QueryExecution?.Status?.StateChangeReason;

    console.log(`Current query status: ${status}`);

    if (status === QueryExecutionState.FAILED || status === QueryExecutionState.CANCELLED) {
      throw new Error(`Query failed or was cancelled. Reason: ${reason}`);
    }
  }

  if (!output) {
    throw new Error(`Athena query failed: ${queryExecutionId}`);
  }

  return output;
}

export function parseS3Uri(s3Uri: string): { bucket: string; key: string } {
  // Regular expression to match common S3 URI formats
  // Handles s3://bucket/key and https://bucket.s3.region.amazonaws.com/key
  const s3Regex =
    /^(?:s3:\/\/|https:\/\/(?:[a-zA-Z0-9.-]+\.)?s3(?:-[a-zA-Z0-9.-]+)?\.amazonaws\.com\/)([a-zA-Z0-9.-]+)(?:\/(.*))?$/;

  const match = s3Uri.match(s3Regex);

  if (match) {
    const bucket = match[1];
    if (!bucket) {
      throw new Error(`Could not parse bucket for ${s3Uri}`);
    }
    // The key might be undefined if the URI only contains the bucket,
    // so default to an empty string in that case.
    const key = match[2] || '';
    return { bucket, key };
  } else {
    throw new Error(`${s3Uri} is not a valid S3 URI format.`);
  }
}

export async function readCsvFromS3(bucketName: string, objectKey: string): Promise<CsvRow[]> {
  const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });

  try {
    const response = await s3Client.send(command);
    // The Body is a Readable stream in Node.js environments
    const stream = response.Body as Readable;

    if (!stream) {
      throw new Error('Failed to get object body from S3');
    }

    const results: CsvRow[] = [];

    // Create a new CSV parser instance and pipe the S3 stream into it
    const parser = stream.pipe(
      parse({
        columns: true, // Treat the first row as headers and return objects
        delimiter: ',',
      })
    );

    // Use a Promise to handle the stream events asynchronously
    return new Promise((resolve, reject) => {
      parser.on('data', (data: CsvRow) => {
        results.push(data); // Push each parsed row into the results array
      });
      parser.on('end', () => {
        console.log(`Successfully parsed ${results.length} rows.`);
        resolve(results); // Resolve the promise when parsing is complete
      });
      parser.on('error', (error) => {
        reject(error); // Reject the promise if an error occurs
      });
    });
  } catch (err) {
    console.error('Error reading from S3:', err);
    throw err;
  }
}
