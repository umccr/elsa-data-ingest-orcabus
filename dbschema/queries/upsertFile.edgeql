with
    url := <str>$url,
    size := <int64>$size,
    checksums := <array<tuple<type: str, value: str>>>$checksums,
    isDeleted := <bool>$isDeleted,

insert storage::File {
    url := url,
    size := size,
    checksums := checksums,
    isDeleted := isDeleted
}
unless conflict on .url else (
    update storage::File set {
        size := size,
        checksums := checksums,
        isDeleted := isDeleted
    }
)
