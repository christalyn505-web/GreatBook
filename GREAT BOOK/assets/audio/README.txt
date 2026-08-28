NARRATION AUDIO
===============

One file per story, named by the story's two-digit id:

    01.mp3   02.mp3   03.mp3   ...

These names must match the `audio` field in ../../stories.js.

ENCODING
--------
Mono MP3, 96–128 kbps. That is plenty for spoken narration and keeps the
zip small. Stereo and higher bitrates buy nothing here and cost real
megabytes across six files.

A three-minute mono 112 kbps narration is roughly 2.5 MB.

If a file is missing, the story page detects it and shows
"The narration for this story has not been recorded yet" instead of a
dead player control. So a missing recording degrades gracefully - but it
is still a missing brief requirement, so record them all.
