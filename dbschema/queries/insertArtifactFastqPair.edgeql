with
    forwardFile := <storage::File>$forwardFile,
    reverseFile := <storage::File>$reverseFile

insert lab::ArtifactFastqPair {
    forwardFile := forwardFile,
    reverseFile := reverseFile
}
