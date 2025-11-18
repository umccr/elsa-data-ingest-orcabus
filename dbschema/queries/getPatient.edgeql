with
    externalId := <str>$externalId

select dataset::DatasetPatient filter ("", externalId) in std::array_unpack(.externalIdentifiers) limit 1
