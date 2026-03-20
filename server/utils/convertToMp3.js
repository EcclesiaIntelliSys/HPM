const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const { PassThrough } = require("stream");

ffmpeg.setFfmpegPath(ffmpegPath);

function convertToMp3(buffer) {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough();
    inputStream.end(buffer);

    const outputStream = new PassThrough();
    const chunks = [];

    outputStream.on("data", (c) => chunks.push(c));
    outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    outputStream.on("error", reject);

    ffmpeg(inputStream)
      .audioCodec("libmp3lame")
      .format("mp3")
      .pipe(outputStream);
  });
}

module.exports = convertToMp3;
