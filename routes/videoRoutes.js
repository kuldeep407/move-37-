import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  uploadVideo,
  trimVideo,
  addSubtitles,
  renderFinal,
  downloadFinal
} from '../controllers/videoController.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Only .mp4 format allowed!'));
    }
  }
});

const router = express.Router();

router.post('/upload', upload.single('video'), uploadVideo);
router.post('/:id/trim', trimVideo);
router.post('/:id/subtitles', addSubtitles);
router.post('/:id/render', renderFinal);
router.get('/:id/download', downloadFinal);

export default router;
