with
    externalIdentifiers := <array<tuple<system: str, value: str>>>$externalIdentifiers

insert dataset::DatasetCase {
    externalIdentifiers := externalIdentifiers
}
