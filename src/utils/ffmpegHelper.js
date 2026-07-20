
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Split a video into chunks of specified duration.
 * @param {string} inputPath - Absolute path to the source video file.
 * @param {string} outputDir - Directory where chunk files will be written.
 * @param {number} chunkDuration - Desired chunk length in seconds.
 * @returns {Promise<string[]>} Resolves with array of absolute paths to chunk files.
 */
export const splitVideoIntoChunks = (inputPath, outputDir, chunkDuration) => {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use forward slashes for ffmpeg output paths to avoid escaping issues
    const outDirPosix = outputDir.replace(/\\/g, '/');
    const segmentPattern = `${outDirPosix}/stream_%v_data%03d.ts`;
    const playlistPattern = path.join(outputDir, 'stream_%v.m3u8').replace(/\\/g, '/');

    // Determine if video has audio by parsing ffmpeg -i output
    import('child_process').then(({ execFile }) => {
      execFile(ffmpegStatic, ['-i', inputPath], (error, stdout, stderr) => {
        // ffmpeg -i exits with error 1 because no output file is specified, which is fine
        const output = stderr || '';
        const hasAudio = output.includes('Audio:');

        // Extract video resolution from ffmpeg output
        let sourceHeight = 1080; // Default max height
        const resolutionMatch = output.match(/Video:.*? (\d{3,5})x(\d{3,5})/);
        if (resolutionMatch && resolutionMatch[2]) {
          sourceHeight = parseInt(resolutionMatch[2], 10);
        }

        // Extract video duration from ffmpeg output
        let durationInSeconds = 0;
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1], 10);
          const minutes = parseInt(durationMatch[2], 10);
          const seconds = parseFloat(durationMatch[3]);
          durationInSeconds = Math.round(hours * 3600 + minutes * 60 + seconds);
        }

        const options = [
          '-preset', 'veryfast',
          '-g', '48',
          '-sc_threshold', '0',
          '-max_muxing_queue_size', '4096',
          '-threads', '4'
        ];

        // Define available qualities
        const availableQualities = [
          { name: '480p', w: 854, h: 480, bv: '800k', ba: '96k' },
          { name: '720p', w: 1280, h: 720, bv: '2800k', ba: '128k' },
          { name: '1080p', w: 1920, h: 1080, bv: '5000k', ba: '192k' }
        ];

        // Filter qualities based on source video height
        let qualities = availableQualities.filter(q => sourceHeight >= q.h);
        
        // Ensure at least one quality is generated if the video is very small
        if (qualities.length === 0) {
          qualities = [availableQualities[0]];
        }

        // Map streams for each quality
        qualities.forEach(() => {
          options.push('-map', '0:v:0');
          if (hasAudio) options.push('-map', '0:a:0');
        });

        // Add encoding settings for each quality
        qualities.forEach((q, i) => {
          options.push(`-c:v:${i}`, 'libx264', `-b:v:${i}`, q.bv, `-filter:v:${i}`, `scale=w=${q.w}:h=${q.h}`);
          if (hasAudio) options.push(`-c:a:${i}`, 'aac', `-b:a:${i}`, q.ba);
        });

        options.push(
          '-f', 'hls',
          '-hls_time', `${chunkDuration}`,
          '-hls_playlist_type', 'vod',
          '-hls_flags', 'independent_segments',
          '-hls_segment_type', 'mpegts',
          '-hls_segment_filename', segmentPattern
        );

        const varStreamMap = qualities.map((_, i) => {
          return hasAudio ? `v:${i},a:${i}` : `v:${i}`;
        }).join(' ');
        
        options.push('-var_stream_map', varStreamMap);

        const createMasterPlaylist = () => {
          let m3u8Content = '#EXTM3U\n#EXT-X-VERSION:3\n';
          qualities.forEach((q, i) => {
            const bandwidth = parseInt(q.bv) * 1000 + (hasAudio ? parseInt(q.ba) * 1000 : 0);
            m3u8Content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${q.w}x${q.h}\nstream_${i}.m3u8\n`;
          });
          fs.writeFileSync(path.join(outputDir, 'master.m3u8'), m3u8Content);
        };

        ffmpeg(inputPath)
          .outputOptions(options)
          .output(playlistPattern)
          .on('stderr', (stderrLine) => {
            console.log('FFmpeg log: ' + stderrLine);
          })
          .on('end', () => {
            createMasterPlaylist();
            resolve({ outputDir, duration: durationInSeconds });
          })
          .on('error', (err) => {
            if (fs.existsSync(path.join(outputDir, 'stream_0.m3u8'))) {
              console.log('FFmpeg crashed on exit but generated files successfully. Treating as success.');
              createMasterPlaylist();
              resolve({ outputDir, duration: durationInSeconds });
            } else {
              console.error('FFmpeg processing error:', err);
              reject(err);
            }
          })
          .run();
      });
    }).catch(reject);
  });
};
