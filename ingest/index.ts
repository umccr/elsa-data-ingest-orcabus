// Show example usage of the Ingest module
//      bun run ingest

import { ingest } from './module.ts';

async function main() {
  const mockRows = [
    {
      sequencingRunId: '999999_A01000_0009_BHGGFMDSX3',
      sequencingRunDate: '2022-04-08',
      internalSubjectId: 'SBJ00000',
      externalSubjectId: 'SN_1190',
      sampleId: 'PRJ990400',
      phenotype: 'tumor',
      libraryId: 'L9900135',
      source: '',
      type: 'WGS',
      ownerId: 'Mock',
      projectId: 'MockCUP',
      fastqPairedEndReadLabel: 'L9900135_S36_L004',
      fastqPairedEndReadId: 'R1',
      fastqFilename: 'L9900135_S36_L004_R1_001.fastq.ora',
      fastqFilesize: '17357197030',
      fastqUri: 's3://bucket/v1/year=2022/month=04/L9900135_S36_L004_R1_001.fastq.ora',
    },
    {
      sequencingRunId: '999999_A01000_0009_BHGGFMDSX3',
      sequencingRunDate: '2022-04-08',
      internalSubjectId: 'SBJ00000',
      externalSubjectId: 'SN_1190',
      sampleId: 'PRJ990400',
      phenotype: 'tumor',
      libraryId: 'L9900135',
      source: '',
      type: 'WGS',
      ownerId: 'Mock',
      projectId: 'MockCUP',
      fastqPairedEndReadLabel: 'L9900135_S36_L004',
      fastqPairedEndReadId: 'R2',
      fastqFilename: 'L9900135_S36_L004_R2_001.fastq.ora',
      fastqFilesize: '19148682691',
      fastqUri: 's3://bucket/v1/year=2022/month=04/L9900135_S36_L004_R2_001.fastq.ora',
    },
  ];

  const ingestedDatasetId = await ingest(mockRows);
  console.log(ingestedDatasetId);
}

await main();
