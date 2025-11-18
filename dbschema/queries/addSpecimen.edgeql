with
    id := <uuid>$id,
    dSpecimen := <dataset::DatasetSpecimen>$dSpecimen

update dataset::DatasetPatient filter .id = id
set {
    specimens += dSpecimen
}
