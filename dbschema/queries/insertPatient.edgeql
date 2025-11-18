with
    externalIdentifiers := <array<tuple<system: str, value: str>>>$externalIdentifiers,
    sexAtBirth := <str>$sexAtBirth

insert dataset::DatasetPatient {
    externalIdentifiers := externalIdentifiers,
    sexAtBirth := sexAtBirth
}
