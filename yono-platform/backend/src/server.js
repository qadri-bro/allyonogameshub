
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

import { Game, Admin } from './models.js';
import { requireAdmin } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Backend folder: yono-platform/backend
const root = path.resolve(__dirname, '..');

// Main project folder: yono-platform
const projectRoot = path.resolve(root, '..');

// React production build folders
const websiteDist = path.join(projectRoot, 'website', 'dist');
const adminDist = path.join(projectRoot, 'admin', 'dist');

// Upload folders
const uploads = path.join(root, 'assets', 'uploads');
const thumbs = path.join(root, 'assets', 'thumbnails');

fs.mkdirSync(uploads, { recursive: true });
fs.mkdirSync(thumbs, { recursive: true });

// Environment validation
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required.');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required.');
}

const app = express();

// Middleware
const frontendOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: frontendOrigins.length ? frontendOrigins : true
}));

app.use(express.json({ limit: '1mb' }));

// Backend uploaded assets
app.use('/assets', express.static(path.join(root, 'assets')));

// API rate limiter
app.use(
  '/api',
  rateLimit({
    windowMs: 60_000,
    max: 180,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === 'apk' ? uploads : thumbs);
  },

  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${path.extname(file.originalname).toLowerCase()}`
    );
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 120 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const ok = file.fieldname === 'apk'
      ? path.extname(file.originalname).toLowerCase() === '.apk'
      : ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);

    cb(
      ok ? null : new Error('APK must be .apk; thumbnail must be JPG, PNG or WEBP.'),
      ok
    );
  }
});

// Async route handler
const asyncRoute = handler => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

// Slug generator
const slugify = value =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Safe game response
const safeGame = (g, admin = false) => ({
  id: g._id,
  name: g.name,
  slug: g.slug,
  category: g.category,
  description: g.description,
  signupBonus: g.signupBonus,
  minWithdrawal: g.minWithdrawal,
  version: g.version,
  size: g.size,
  thumbnail: g.thumbnail,
  hasApk: !!g.apkPath,
  hasDownload: !!(g.apkPath || g.referralUrl),
  hasReferralLink: !!g.referralUrl,
  isFeatured: g.isFeatured,
  status: g.status,
  clicks: g.clicks,
  createdAt: g.createdAt,
  ...(admin ? { referralUrl: g.referralUrl } : {})
});

// Uploaded file helpers
const uploadedPaths = files =>
  Object.values(files || {}).flat().map(file => file.path);

const removeFiles = files =>
  uploadedPaths(files).forEach(file => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

// Referral URL validation
function validReferralUrl(value) {
  if (!value) return true;

  if (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\')
  ) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function publicSiteBaseUrl() {
  return process.env.PUBLIC_SITE_URL
    || process.env.RENDER_EXTERNAL_URL
    || 'http://localhost:5173';
}

// =====================================
// API ROUTES
// =====================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Admin login
app.post('/api/admin/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === 'string'
    ? email.trim().toLowerCase()
    : '';

  const admin = normalizedEmail
    ? await Admin.findOne({
        email: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      })
    : null;

  if (
    !admin ||
    !await bcrypt.compare(password || '', admin.passwordHash)
  ) {
    return res.status(401).json({
      message: 'Invalid email or password'
    });
  }

  const token = jwt.sign(
    { id: admin._id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    email: admin.email
  });
}));

// Public games
app.get('/api/games', asyncRoute(async (req, res) => {
  const games = await Game.find({ status: 'published' })
    .sort({ createdAt: -1 });

  res.json(games.map(game => safeGame(game)));
}));

// Admin games
app.get('/api/admin/games', requireAdmin, asyncRoute(async (req, res) => {
  const games = await Game.find().sort({ createdAt: -1 });

  res.json(games.map(game => safeGame(game, true)));
}));

// Admin dashboard stats
app.get('/api/admin/stats', requireAdmin, asyncRoute(async (req, res) => {
  const [total, published, clicks] = await Promise.all([
    Game.countDocuments(),
    Game.countDocuments({ status: 'published' }),
    Game.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$clicks' }
        }
      }
    ])
  ]);

  res.json({
    total,
    published,
    clicks: clicks[0]?.total || 0
  });
}));

// Add new game
app.post(
  '/api/admin/games',
  requireAdmin,
  upload.fields([
    { name: 'apk', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  asyncRoute(async (req, res) => {
    try {
      const body = req.body;

      if (!body.name?.trim()) {
        return res.status(400).json({
          message: 'Game name is required.'
        });
      }

      if (!validReferralUrl(body.referralUrl)) {
        return res.status(400).json({
          message: 'Download link must be an HTTPS URL or a site-relative path.'
        });
      }

      const slug = slugify(body.slug || body.name);

      if (!slug) {
        return res.status(400).json({
          message: 'Game name must contain at least one letter or number.'
        });
      }

      const game = await Game.create({
        name: body.name,
        slug,
        category: body.category,
        description: body.description,
        signupBonus: body.signupBonus,
        minWithdrawal: body.minWithdrawal,
        version: body.version,
        size: body.size,
        referralUrl: body.referralUrl,
        status: body.status === 'published' ? 'published' : 'draft',
        isFeatured: body.isFeatured === 'true',

        apkPath: req.files?.apk?.[0]
          ? `/assets/uploads/${req.files.apk[0].filename}`
          : '',

        thumbnail: req.files?.thumbnail?.[0]
          ? `/assets/thumbnails/${req.files.thumbnail[0].filename}`
          : ''
      });

      res.status(201).json(safeGame(game, true));

    } catch (error) {
      removeFiles(req.files);
      throw error;
    }
  })
);

// Update game
app.put(
  '/api/admin/games/:id',
  requireAdmin,
  upload.fields([
    { name: 'apk', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  asyncRoute(async (req, res) => {
    const game = await Game.findById(req.params.id);

    if (!game) {
      removeFiles(req.files);

      return res.status(404).json({
        message: 'Game not found'
      });
    }

    const body = req.body;
    const oldFiles = [];

    if (body.name !== undefined && !body.name.trim()) {
      removeFiles(req.files);

      return res.status(400).json({
        message: 'Game name is required.'
      });
    }

    if (
      body.referralUrl !== undefined &&
      !validReferralUrl(body.referralUrl)
    ) {
      removeFiles(req.files);

      return res.status(400).json({
        message: 'Download link must be an HTTPS URL or a site-relative path.'
      });
    }

    for (const key of [
      'name',
      'category',
      'description',
      'signupBonus',
      'minWithdrawal',
      'version',
      'size',
      'referralUrl'
    ]) {
      if (body[key] !== undefined) {
        game[key] = body[key];
      }
    }

    if (body.slug) {
      game.slug = slugify(body.slug);
    }

    if (body.status !== undefined) {
      game.status = body.status === 'published' ? 'published' : 'draft';
    }

    if (body.isFeatured !== undefined) {
      game.isFeatured = body.isFeatured === 'true';
    }

    // Update APK
    if (req.files?.apk?.[0]) {
      if (game.apkPath) {
        oldFiles.push(
          path.join(root, game.apkPath.replace(/^\/+/, ''))
        );
      }

      game.apkPath = `/assets/uploads/${req.files.apk[0].filename}`;
    }

    // Update thumbnail
    if (req.files?.thumbnail?.[0]) {
      if (game.thumbnail) {
        oldFiles.push(
          path.join(root, game.thumbnail.replace(/^\/+/, ''))
        );
      }

      game.thumbnail = `/assets/thumbnails/${req.files.thumbnail[0].filename}`;
    }

    try {
      await game.save();
    } catch (error) {
      removeFiles(req.files);
      throw error;
    }

    oldFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    res.json(safeGame(game, true));
  })
);

// Delete game
app.delete(
  '/api/admin/games/:id',
  requireAdmin,
  asyncRoute(async (req, res) => {
    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) {
      return res.status(404).json({
        message: 'Game not found'
      });
    }

    for (const file of [game.apkPath, game.thumbnail]) {
      if (file) {
        const absolutePath = path.join(
          root,
          file.replace(/^\/+/, '')
        );

        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }
      }
    }

    res.json({
      message: 'Game deleted'
    });
  })
);

// Download game
app.get('/api/download/:slug', asyncRoute(async (req, res) => {
  const game = await Game.findOne({
    slug: req.params.slug,
    status: 'published'
  });

  if (!game) {
    return res.status(404).send('Game not found');
  }

  if (game.apkPath) {
    const apkFile = path.resolve(
      root,
      game.apkPath.replace(/^\/+/, '')
    );

    if (
      path.dirname(apkFile) !== uploads ||
      !fs.existsSync(apkFile)
    ) {
      return res.status(404).send('APK file not found.');
    }

    await Game.updateOne(
      { _id: game._id },
      { $inc: { clicks: 1 } }
    );

    res.type('application/vnd.android.package-archive');

    return res.download(apkFile, `${game.slug}.apk`);
  }

  if (!game.referralUrl) {
    return res.status(404).send(
      'No APK or referral URL is configured.'
    );
  }

  await Game.updateOne(
    { _id: game._id },
    { $inc: { clicks: 1 } }
  );

  const target = game.referralUrl.startsWith('/')
    ? new URL(
        game.referralUrl,
        publicSiteBaseUrl()
      ).toString()
    : game.referralUrl;

  return res.redirect(302, target);
}));

// Referral redirect
app.get('/api/referral/:slug', asyncRoute(async (req, res) => {
  const game = await Game.findOne({
    slug: req.params.slug,
    status: 'published'
  });

  if (!game) {
    return res.status(404).send('Game not found');
  }

  if (
    !game.referralUrl ||
    !validReferralUrl(game.referralUrl)
  ) {
    return res.status(404).send(
      'No valid referral URL is configured.'
    );
  }

  await Game.updateOne(
    { _id: game._id },
    { $inc: { clicks: 1 } }
  );

  const target = game.referralUrl.startsWith('/')
    ? new URL(
        game.referralUrl,
        publicSiteBaseUrl()
      ).toString()
    : game.referralUrl;

  return res.redirect(302, target);
}));

// =====================================
// FRONTEND + ADMIN PRODUCTION ROUTES
// =====================================

// Admin panel static files
app.use(
  '/admin',
  express.static(adminDist, { index: false })
);

// Admin panel fallback
app.get(['/admin', '/admin/*'], (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

// Main website static files
app.use(
  express.static(websiteDist, { index: false })
);

// Main website React Router fallback
// API, assets and admin paths are excluded
app.get(
  /^\/(?!api(?:\/|$)|assets(?:\/|$)|admin(?:\/|$)).*/,
  (req, res) => {
    res.sendFile(path.join(websiteDist, 'index.html'));
  }
);

// =====================================
// ERROR HANDLER
// =====================================

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.code === 11000
    ? 409
    : (err.status || 400);

  res.status(status).json({
    message: err.code === 11000
      ? 'This game URL/slug already exists.'
      : err.message || 'Request failed'
  });
});

// =====================================
// START SERVER
// =====================================

const port = process.env.PORT || 5000;

try {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('MongoDB connected successfully');

  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });

} catch (error) {
  console.error('Server startup failed:', error);
  process.exit(1);
}
