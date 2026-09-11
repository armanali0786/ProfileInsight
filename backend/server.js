require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { connectDB } = require('./src/db');
const { authToken } = require('./src/middleware/authToken');

const contactsRouter = require('./src/routes/contacts');
const reviewsRouter = require('./src/routes/reviews');
const commentsRouter = require('./src/routes/comments');
const profileRouter = require('./src/routes/profile');
const referencesRouter = require('./src/routes/references');
const devRouter = require('./src/routes/dev');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PROFILE_UPLOADS_DIR = path.join(__dirname, 'uploads', 'profile');
fs.mkdirSync(PROFILE_UPLOADS_DIR, { recursive: true });

const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024; // 1MB

// The extension sends most fields via FormData (multipart/form-data). `.any()` parses
// both the text fields (into req.body, same as the old `.none()` behavior for every
// existing route) and any actual files (into req.files, an array) -- used today only by
// the profile image upload route. Files are written straight to disk via diskStorage.
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PROFILE_UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '') || '';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: MAX_PROFILE_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  },
});
app.use(upload.any());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/admin/api/contacts', authToken, contactsRouter);
app.use('/admin/api/profile', authToken, profileRouter);
app.use('/admin/reviews/comments', authToken, commentsRouter);
app.use('/admin/reviews', authToken, reviewsRouter);
app.use('/admin/references', authToken, referencesRouter);

if (process.env.NODE_ENV !== 'production') {
  app.use('/dev', devRouter);
}

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image is too large. Maximum allowed size is 1MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Only image files are allowed.') {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`ProfileInsight backend listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
