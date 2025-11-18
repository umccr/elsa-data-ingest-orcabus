with
    id := <uuid>$id,
    dArtifact := <lab::ArtifactFastqPair>$dArtifact

update dataset::DatasetSpecimen filter .id = id
set {
    artifacts += dArtifact
}
