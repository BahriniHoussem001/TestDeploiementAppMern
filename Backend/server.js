const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("config");
const mongoose = require("mongoose");
const Candidate = require("./models/candidats");
const User = require("./models/User");
const generatePDF = require("./utils/generatePDF");
const uploadToS3 = require("./utils/uploadToS3");
const fs = require("fs");
const path = require("path");
const auth = require("./middleware/auth");
const roleCheck = require("./middleware/roleCheck");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create temp directory for PDF storage if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`Created temporary directory at ${tempDir}`);
}

// Serve static files from temp directory
app.use('/temp', express.static(tempDir));

const mongo_url = config.get("mongo_url");
mongoose.set("strictQuery", true);

mongoose
  .connect(mongo_url)
  .then(() => console.log("✅ MongoDB connecté..."))
  .catch((err) => {
    console.error("❌ Erreur de connexion MongoDB :", err);
    process.exit(1);
  });

// Routes API
app.use('/auth', require('./routes/api/auth'));

app.get("/", (_, res) => {
  res.send("🚀 Serveur opérationnel !");
});

// 🔹 Vérifier si un candidat a un profil
app.get("/check-candidate-profile/:userId", auth, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ user: req.params.userId });
    res.json({ hasProfile: !!candidate, candidateId: candidate?._id });
  } catch (err) {
    console.error("Erreur lors de la vérification du profil :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔹 Récupérer le profil candidat par ID utilisateur
app.get("/candidates/user/:userId", auth, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ user: req.params.userId });
    if (!candidate) {
      return res.status(404).json({ message: "Profil candidat non trouvé" });
    }
    res.json({ candidateId: candidate._id });
  } catch (err) {
    console.error("Erreur lors de la récupération du profil :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔹 Génération du PDF + stockage + S3
app.post("/generate-pdf", auth, async (req, res) => {
  try {
    const {
      nom,
      email,
      telephone,
      dateNaissance,
      Region,
      linkedin,
      github,
      domaine,
      competences = [],
      autreCompetence = "",
      experience = "",
      userId
    } = req.body;

    const allCompetences = [...competences];
    if (autreCompetence.trim() !== "") {
      allCompetences.push(autreCompetence.trim());
    }

    const score = Math.min(100, allCompetences.length * 20 + experience.length * 0.5);

    // First check if the user already has a candidate profile
    let candidate = await Candidate.findOne({ user: userId || req.user.id });

    if (candidate) {
      // Update existing candidate
      candidate.nom = nom;
      candidate.email = email;
      candidate.telephone = telephone;
      candidate.dateNaissance = dateNaissance;
      candidate.Region = Region;
      candidate.linkedin = linkedin;
      candidate.github = github;
      candidate.domaine = domaine;
      candidate.competences = allCompetences;
      candidate.experience = experience;
      candidate.score = score;
    } else {
      // Check if email already exists in another candidate
      const existingEmailCandidate = await Candidate.findOne({ email });

      if (existingEmailCandidate) {
        // If this email belongs to another candidate, update that candidate
        // and associate it with the current user
        existingEmailCandidate.nom = nom;
        existingEmailCandidate.telephone = telephone;
        existingEmailCandidate.dateNaissance = dateNaissance;
        existingEmailCandidate.Region = Region;
        existingEmailCandidate.linkedin = linkedin;
        existingEmailCandidate.github = github;
        existingEmailCandidate.domaine = domaine;
        existingEmailCandidate.competences = allCompetences;
        existingEmailCandidate.experience = experience;
        existingEmailCandidate.score = score;
        existingEmailCandidate.user = userId || req.user.id; // Link to current user
        candidate = existingEmailCandidate;
      } else {
        // Create new candidate if email doesn't exist
        candidate = new Candidate({
          nom,
          email,
          telephone,
          dateNaissance,
          Region,
          linkedin,
          github,
          domaine,
          competences: allCompetences,
          experience,
          score,
          user: userId || req.user.id // Link to user
        });
      }
    }

    await candidate.save();

    // Update user with reference to candidate
    await User.findByIdAndUpdate(
      userId || req.user.id,
      { candidateProfile: candidate._id }
    );

    let fileUrl;
    try {
      // Generate a unique filename with timestamp to avoid conflicts
      const timestamp = new Date().getTime();
      const fileName = `cv_${nom.replace(/\s+/g, "_")}_${timestamp}.pdf`;
      const filePath = `./${fileName}`;

      // Generate PDF
      await generatePDF(candidate, filePath);

      try {
        // Try to upload to S3
        fileUrl = await uploadToS3(filePath, fileName);
        candidate.cvUrl = fileUrl;
        await candidate.save();
      } catch (s3Error) {
        console.error("Error uploading to S3, using local fallback:", s3Error);

        // Fallback to local storage if S3 upload fails
        const path = require('path');
        const tempDir = path.join(__dirname, 'temp');
        const tempFilePath = path.join(tempDir, fileName);
        const BASE_URL = process.env.BASE_URL;
        // Copy the file to the temp directory
        fs.copyFileSync(filePath, tempFilePath);

        // Set the URL to the local path
        fileUrl = `${BASE_URL}/temp/${fileName}`;

        candidate.cvUrl = fileUrl;
        await candidate.save();
      }

      // Clean up original local file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (pdfError) {
      console.error("Error in PDF generation:", pdfError);
      throw new Error(`Erreur lors de la génération du PDF: ${pdfError.message}`);
    }

    res.json({ message: "CV généré avec succès", cvUrl: fileUrl, candidateId: candidate._id });
  } catch (err) {
    console.error("❌ Erreur lors de la génération du CV :", err);
    res.status(500).json({ message: "Erreur lors de la génération", error: err.message });
  }
});

// 🔹 Liste des candidats (protégée pour les recruteurs)
app.get("/candidates", auth, roleCheck(["recruteur"]), async (_, res) => {
  try {
    const candidats = await Candidate.find();
    res.json(candidats);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération." });
  }
});

// 🔹 Détail candidat
app.get("/candidates/:id", auth, async (req, res) => {
  try {
    const candidat = await Candidate.findById(req.params.id);
    if (!candidat) return res.status(404).json({ message: "Candidat non trouvé." });

    // Check if user is authorized to view this candidate
    if (req.user.role === "candidat" && candidat.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    res.json(candidat);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération." });
  }
});

// 🔹 Suivi du téléchargement du CV (incrémentation cvViews) - Route publique
app.get("/download-cv/:id", async (req, res) => {
  try {
    const candidat = await Candidate.findById(req.params.id);

    if (!candidat || !candidat.cvUrl) {
      return res.status(404).send("CV introuvable pour ce candidat.");
    }

    // Increment view count for all downloads
    await Candidate.findByIdAndUpdate(
      req.params.id,
      { $inc: { cvViews: 1 } }
    );

    res.redirect(candidat.cvUrl);
  } catch (err) {
    console.error("❌ Erreur lors du téléchargement du CV :", err);
    res.status(500).send("Erreur lors de la redirection vers le CV.");
  }
});

// 🔹 Route pour suivre les téléchargements de CV (sans redirection)
app.get("/track-download/:id", async (req, res) => {
  try {
    await Candidate.findByIdAndUpdate(
      req.params.id,
      { $inc: { cvViews: 1 } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Erreur lors du suivi du téléchargement :", err);
    res.status(500).json({ success: false });
  }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`🌍 Serveur sur http://localhost:${PORT}`));
