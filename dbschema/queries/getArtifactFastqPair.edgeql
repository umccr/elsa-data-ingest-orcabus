with
    forwardFileId := <uuid>$forwardFileId,
    reverseFileId := <uuid>$reverseFileId

select lab::ArtifactFastqPair filter
    .forwardFile.id = forwardFileId and
    .reverseFile.id = reverseFileId
limit 1
