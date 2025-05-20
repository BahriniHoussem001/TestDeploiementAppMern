const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route   POST /auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, role, dateOfBirth, address, city, phone } = req.body;

  // Simple validation
  if (!username || !email || !password || !role || !dateOfBirth || !address || !city || !phone) {
    return res.status(400).json({ msg: 'Veuillez remplir tous les champs' });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Cet utilisateur existe déjà' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
      role,
      dateOfBirth,
      address,
      city,
      phone
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    // Create and return JWT token
    const payload = {
      id: user.id,
      role: user.role
    };

    jwt.sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: config.get('tokenExpire') },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route   POST /auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs' });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Identifiants invalides' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Identifiants invalides' });
    }

    // Create and return JWT token
    const payload = {
      id: user.id,
      role: user.role
    };

    jwt.sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: config.get('tokenExpire') },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// @route   GET /auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router;
