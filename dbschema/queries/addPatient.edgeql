with
    id := <uuid>$id,
    dPatient := <dataset::DatasetPatient>$dPatient

update dataset::DatasetCase filter .id = id
set {
    # FIXME It seems to me that the current Elsa model exclusivity constraint one Case per Patient.
    # patients += dPatient
    patients := dPatient
}
