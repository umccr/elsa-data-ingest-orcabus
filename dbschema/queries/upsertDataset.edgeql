with
    description := <str>$description,
    updatedDateTime := <datetime>$updatedDateTime,
    uri := <str>$uri,
    externalIdentifiers := <array<tuple<system: str, value: str>>>$externalIdentifiers,

insert dataset::Dataset {
    description := description,
    updatedDateTime := updatedDateTime,
    uri := uri,
    externalIdentifiers := externalIdentifiers
}
unless conflict on .uri else (
    update dataset::Dataset set {
        description := description,
        updatedDateTime := updatedDateTime,
        externalIdentifiers := externalIdentifiers
    }
)
