select
    l.sequencing_run_id as sequencingRunId,
    l.sequencing_run_date as sequencingRunDate,
    l.internal_subject_id as internalSubjectId,
    l.external_subject_id as externalSubjectId,
    l.sample_id as sampleId,
    l.phenotype as phenotype,
    l.library_id as libraryId,
    l.source as source,
    l.type as type,
    l.owner_id as ownerId,
    l.project_id as projectId,
    regexp_extract(f.filename, '(.*)(?:_R\d{1}_\d*)', 1) as fastqPairedEndReadLabel,
    regexp_extract(f.filename, '(?:_)(R\d)(?:_\d*)', 1) as fastqPairedEndReadId,
    f.filename as fastqFilename,
    f.size as fastqFilesize,
    concat('s3://', f.bucket, '/', f.key) as fastqUri
from
    mart.lims l
        join mart.fastq f on f.library_id = l.library_id and f.sequencing_run_id = l.sequencing_run_id
where
    f.bucket = ? and
    l.project_id = ? and
    l.owner_id = ? and
    l.type = ?
order by f.filename
