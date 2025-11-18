with
    externalId := <str>$externalId

select dataset::DatasetSpecimen filter ("", externalId) in std::array_unpack(.externalIdentifiers) limit 1
