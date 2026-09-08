require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { connectDB } = require('./src/db');
const { authToken } = require('./src/middleware/authToken');

const contactsRouter = require('./src/routes/contacts');
const reviewsRouter = require('./src/routes/reviews');
const commentsRouter = require('./src/routes/comments');
const devRouter = require('./src/routes/dev');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// The extension sends fields via FormData (multipart/form-data) with no actual file uploads.
// multer with no fields configured just parses text fields into req.body and no-ops on
// non-multipart requests (e.g. the LinkedIn exchange call, which sends JSON).
app.use(multer().none());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/admin/api/contacts', authToken, contactsRouter);
app.use('/admin/reviews/comments', authToken, commentsRouter);
app.use('/admin/reviews', authToken, reviewsRouter);

if (process.env.NODE_ENV !== 'production') {
  app.use('/dev', devRouter);
}

app.use((err, req, res, next) => {
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
