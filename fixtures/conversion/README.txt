Original Alcydeo test media only: synthetic color patterns and an audio tone.
The original six-second media/high.mp4 is remuxed or encoded for these fixtures.
copy.mkv/copy.mov: H.264 + AAC, for packet-copy MP4 output.
transcode.webm: VP8 + Opus, for actual H.264 + AAC conversion.
settings.mp4: original two-second 1280x720 H.264/AAC color/tone test for resolution and quality options.
unsupported.mkv: MPEG-4 Part 2 + AAC; must not yield a successful audio-only MP4.
Regenerate with FFMPEG_FOR_FIXTURES=/path/to/development/ffmpeg node scripts/conversion-fixtures.mjs.
Add --long to generate an ignored 60-second 1280x720 WebM for interruption tests.
FFmpeg is a fixture preparation tool only; no native program is required by the extension.
