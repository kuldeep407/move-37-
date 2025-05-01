import ffmpeg from "fluent-ffmpeg";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const uploadsDir = "uploads";
const processedDir = "processed";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export const uploadVideo = async (req, res) => {
  try {
    const { originalname, path: filePath, size } = req.file;

    ffmpeg.ffprobe(filePath, async (err, metadata) => {
      if (err) {
        return res.status(500).send("Error reading metadata");
      }

      const duration = metadata.format.duration;

      const videoUrl = `http://localhost:3000/uploads/${path.basename(
        filePath
      )}`;

      const video = await prisma.video.create({
        data: {
          name: originalname,
          path: filePath,
          finalPath: videoUrl,
          duration,
          size,
        },
      });

      res
        .status(201)
        .json({ success: true, message: "Video uploaded !", video });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Internal server error!" });
  }
};

export const trimVideo = async (req, res) => {
  const { id } = req.params;
  const { start, end } = req.body;
  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found !" });
    }

    const output = path.join(processedDir, `trimmed-${Date.now()}.mp4`);

    ffmpeg(video.path)
      .setStartTime(start)
      .setDuration(end - start)
      .output(output)
      .on("end", async () => {
        await prisma.video.update({
          where: { id: parseInt(id) },
          data: { path: output },
        });
        res.json({ success: true, message: "Trimmed successfully", output });
      })
      .on("error", (err) => res.status(500).send(err.message))
      .run();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Internal server error!" });
  }
};

export const addSubtitles = async (req, res) => {
  const { id } = req.params;
  const { text, start, end } = req.body;

  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });

    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found !" });
    }

    const fontPath = "C:/Windows/Fonts/arial.ttf";

    const output = `processed/subtitled-${Date.now()}.mp4`;

    const subtitleFilter = `drawtext=fontfile='${fontPath}':text='${text.replace(
      /:/g,
      "\\:"
    )}':enable='between(t\\,${start}\\,${end})':fontcolor=white:fontsize=24:x=10:y=H-th-10`;

    ffmpeg(video.path)
      .videoFilter(subtitleFilter)
      .output(output)
      .on("end", async () => {
        await prisma.video.update({
          where: { id: parseInt(id) },
          data: { path: output },
        });

        res.json({ success: true, message: "Subtitle added!", output });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).send("Failed to add subtitle");
      })
      .run();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const renderFinal = async (req, res) => {
  const { id } = req.params;
  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found !" });
    }

    const finalPath = path.join(processedDir, `final-${Date.now()}.mp4`);
    fs.copyFileSync(video.path, finalPath);

    await prisma.video.update({
      where: { id: parseInt(id) },
      data: { status: "rendered", finalPath },
    });
    res.json({ message: "Rendered", finalPath });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Internal server error!" });
  }
};

export const downloadFinal = async (req, res) => {
  const { id } = req.params;
  try {
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
    });
    if (!video || !video.finalPath) {
      return res
        .status(404)
        .json({ success: false, message: "Rendered Video not found !" });
    }

    res.download(video.finalPath);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Internal server error!" });
  }
};
