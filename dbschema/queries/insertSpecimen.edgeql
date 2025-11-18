with
    externalIdentifiers := <array<tuple<system: str, value: str>>>$externalIdentifiers,
    sampleType := <optional str>$sampleType

insert dataset::DatasetSpecimen {
    externalIdentifiers := externalIdentifiers,
    sampleType := sampleType
}
