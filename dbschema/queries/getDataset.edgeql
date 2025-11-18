with
    id := <uuid>$id

select dataset::Dataset {
    id,
    uri,
    description,
    updatedDateTime,
    isInConfig,
    totalCaseCount := count(.cases),
    totalPatientCount := count(.cases.patients),
    totalSpecimenCount := count(.cases.patients.specimens),
    totalArtifactFastqPairCount := count(.cases.patients.specimens.artifacts)
} filter .id = id
