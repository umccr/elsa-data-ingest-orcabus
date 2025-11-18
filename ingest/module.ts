// Transform & Ingest module

import * as crypto from 'crypto';
import _ from 'lodash';
import type { CsvRow } from '../extract/module.ts';
import {
  addArtifactFastqPair,
  addCase,
  addPatient,
  addSpecimen,
  getArtifactFastqPair,
  getCase,
  getPatient,
  getSpecimen,
  insertArtifactFastqPair,
  insertCase,
  insertPatient,
  insertSpecimen,
  upsertDataset,
  upsertFile,
} from '../dbschema/queries.ts';
import { createClient } from 'gel';

const client = createClient();

const FASTQ_FORWARD_FILE_ID = 'R1';
const FASTQ_REVERSE_FILE_ID = 'R2';

export async function ingest(csvRows: CsvRow[]) {
  return await ingestDataset(csvRows);
}

async function ingestDataset(csvRows: CsvRow[]) {
  const datasetTypes = _.chain(csvRows)
    .map('type')
    .map((item) => (typeof item === 'string' ? _.trim(item) : item))
    .uniq()
    .compact()
    .value();
  const datasets = _.chain(csvRows)
    .map('projectId')
    .map((item) => (typeof item === 'string' ? _.trim(item) : item))
    .uniq()
    .compact()
    .value();
  if (datasets.length > 1) {
    throw new Error(`Too many datasets found ${datasets.length}.`); // FIXME For POC, consider only mapping 1 dataset from 1 project.
  }
  const datasetId = datasets[0];
  if (!datasetId) {
    throw new Error(`DatasetId is ${datasetId}.`);
  }

  // upsert dataset
  const ingestedDataset = await upsertDataset(client, {
    uri: `urn:fdc:umccr.org:2025:dataset/${datasetId.toLowerCase()}`,
    description: `Dataset for ${datasetId} ${datasetTypes.join(',')}`,
    updatedDateTime: new Date(),
    externalIdentifiers: [
      {
        system: '',
        value: datasetId.toLowerCase(),
      },
    ],
  });
  await afterDatasetExists(ingestedDataset.id, csvRows);
  return ingestedDataset.id;
}

async function afterDatasetExists(ingestedDatasetId: string, csvRows: CsvRow[]) {
  // map to cases
  const groupedByCase = _.groupBy(csvRows, 'internalSubjectId');

  for (const caseId in groupedByCase) {
    const caseCsvRows = groupedByCase[caseId];
    if (!caseCsvRows) {
      throw new Error('The caseCsvRows is null');
    }

    // upsert case
    let caseFound = await getCase(client, {
      externalId: caseId,
    });

    if (caseFound == null) {
      caseFound = await insertCase(client, {
        externalIdentifiers: [
          {
            system: '',
            value: caseId,
          },
        ],
      });
    }

    // add case to dataset
    await addCase(client, {
      id: ingestedDatasetId,
      dCase: caseFound.id,
    });

    await afterCaseExists(caseFound.id, caseCsvRows);
  }
}

async function afterCaseExists(caseFoundId: string, caseCsvRows: CsvRow[]) {
  // map to patients
  const groupedByPatient = _.groupBy(caseCsvRows, 'externalSubjectId');

  for (const patientId in groupedByPatient) {
    const patientCsvRows = groupedByPatient[patientId];
    if (!patientCsvRows) {
      throw new Error('The patientCsvRows is null');
    }

    // upsert patient
    let patientFound = await getPatient(client, {
      externalId: patientId,
    });

    if (patientFound == null) {
      patientFound = await insertPatient(client, {
        sexAtBirth: 'other', // FIXME gender info not available
        externalIdentifiers: [
          {
            system: '',
            value: patientId,
          },
        ],
      });
    }

    // add patient to case
    await addPatient(client, {
      id: caseFoundId,
      dPatient: patientFound.id,
    });

    await afterPatientExists(patientFound.id, patientCsvRows);
  }
}

async function afterPatientExists(patientFoundId: string, patientCsvRows: CsvRow[]) {
  // map to specimens
  const groupedBySpecimen = _.groupBy(patientCsvRows, 'sampleId');

  for (const specimenId in groupedBySpecimen) {
    const specimenCsvRows = groupedBySpecimen[specimenId];
    if (!specimenCsvRows) {
      throw new Error('The specimenCsvRows is null');
    }

    // map to sample type (of specimen)
    const sampleTypes = _.chain(specimenCsvRows)
      .map('phenotype')
      .map((item) => (typeof item === 'string' ? _.trim(item) : item))
      .uniq()
      .compact()
      .value();

    if (sampleTypes.length > 1) {
      throw new Error(`${specimenId} has many sample types ${sampleTypes}.`);
    }

    // upsert specimen
    let specimenFound = await getSpecimen(client, {
      externalId: specimenId,
    });

    if (specimenFound == null) {
      specimenFound = await insertSpecimen(client, {
        sampleType: sampleTypes[0],
        externalIdentifiers: [
          {
            system: '',
            value: specimenId,
          },
        ],
      });
    }

    // add specimen to patient
    await addSpecimen(client, {
      id: patientFoundId,
      dSpecimen: specimenFound.id,
    });

    await afterSpecimenExists(specimenFound.id, specimenCsvRows);
  }
}

async function afterSpecimenExists(specimenFoundId: string, specimenCsvRows: CsvRow[]) {
  // map to artifact fastq pair
  const groupedByArtifactFastqPair = _.groupBy(specimenCsvRows, 'fastqPairedEndReadLabel');

  for (const label in groupedByArtifactFastqPair) {
    const fastqPairedEndReadGroup = groupedByArtifactFastqPair[label];
    if (!fastqPairedEndReadGroup) {
      throw new Error('The fastqPairedEndReadGroup is null');
    }

    if (fastqPairedEndReadGroup.length > 2) {
      throw new Error(
        `fastqPairedEndReadLabel ${label} having too many files ${fastqPairedEndReadGroup.length}`
      );
    }

    // map R1, R2
    const forwardFastqCsvRow = _.chain(fastqPairedEndReadGroup)
      .filter((f) => f.fastqPairedEndReadId === FASTQ_FORWARD_FILE_ID)
      .uniq()
      .first()
      .value();
    const reverseFastqCsvRow = _.chain(fastqPairedEndReadGroup)
      .filter((f) => f.fastqPairedEndReadId === FASTQ_REVERSE_FILE_ID)
      .uniq()
      .first()
      .value();

    const forwardFile = await upsertFile(client, MappingFactory.createFile(forwardFastqCsvRow));
    const reverseFile = await upsertFile(client, MappingFactory.createFile(reverseFastqCsvRow));

    // upsert artifactFastqPair using forwardFile and reverseFile
    let artifactFastqPairFound = await getArtifactFastqPair(client, {
      forwardFileId: forwardFile.id,
      reverseFileId: reverseFile.id,
    });

    if (artifactFastqPairFound == null) {
      artifactFastqPairFound = await insertArtifactFastqPair(client, {
        forwardFile: forwardFile.id,
        reverseFile: reverseFile.id,
      });
    }

    // add artifact to specimen
    await addArtifactFastqPair(client, {
      id: specimenFoundId,
      dArtifact: artifactFastqPairFound.id,
    });
  }
}

class MappingFactory {
  static createFile(csvRow: CsvRow) {
    return {
      url: csvRow.fastqUri,
      size: parseInt(csvRow.fastqFilesize),
      checksums: [
        {
          type: 'MD5',
          value: crypto.createHash('md5').update(csvRow.fastqUri).digest('hex'), // FIXME FileManager checksum info not available
        },
      ],
      isDeleted: false,
    };
  }
}
