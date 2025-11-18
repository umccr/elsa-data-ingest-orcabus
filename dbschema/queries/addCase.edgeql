with
    id := <uuid>$id,
    dCase := <dataset::DatasetCase>$dCase

update dataset::Dataset filter .id = id
set {
    cases += dCase
}
