with
    externalId := <str>$externalId

select dataset::DatasetCase filter ("", externalId) in std::array_unpack(.externalIdentifiers) limit 1
