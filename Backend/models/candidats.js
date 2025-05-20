const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  dateNaissance: { type: String, required: true },
  Region: { type: String, required: true },
  linkedin: { type: String },
  github: { type: String },
  domaine: { type: String, required: true },
  competences: { type: [String], required: true },
  experience: { type: String, required: true },
  score: { type: Number, default: 0 }, // Pour le système de scoring
  cvUrl: { type: String }, // Stocke l'URL du CV sur AWS S3
  cvViews: { type: Number, default: 0 },
  // Reference to the user who created this candidate profile
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Candidate || mongoose.model("Candidate", CandidateSchema);

