const PdfPrinter = require("pdfmake");
const fs = require("fs");

// Define fonts with fallbacks to ensure PDF generation works
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

const generatePDF = (candidate, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure candidate data is valid
      if (!candidate || !candidate.nom) {
        return reject(new Error('Données de candidat invalides'));
      }

      // Safely access candidate properties with fallbacks
      const safeCandidate = {
        nom: candidate.nom || 'Non spécifié',
        email: candidate.email || 'Non spécifié',
        telephone: candidate.telephone || 'Non spécifié',
        Region: candidate.Region || 'Non spécifiée',
        domaine: candidate.domaine || 'Non spécifié',
        linkedin: candidate.linkedin || 'Non spécifié',
        github: candidate.github || 'Non spécifié',
        competences: Array.isArray(candidate.competences) ? candidate.competences : [],
        experience: candidate.experience || 'Non spécifiée'
      };

      const docDefinition = {
        content: [
          { text: `CV de ${safeCandidate.nom}`, style: "header" },
          { text: "Informations personnelles", style: "subheader" },
          {
            table: {
              widths: ["30%", "70%"],
              body: [
                ["Email", safeCandidate.email],
                ["Téléphone", safeCandidate.telephone],
                ["Région", safeCandidate.Region],
                ["Domaine", safeCandidate.domaine],
                ["LinkedIn", safeCandidate.linkedin],
                ["GitHub", safeCandidate.github],
              ],
            },
            layout: {
              fillColor: (rowIndex) => (rowIndex % 2 === 0 ? "#f3f3f3" : null),
              hLineWidth: () => 1,
              vLineWidth: () => 1,
            },
            margin: [0, 0, 0, 10],
          },
          { text: "Compétences", style: "subheader" },
          {
            ul: safeCandidate.competences.length > 0
              ? safeCandidate.competences.map(c =>
                  typeof c === "object" && c.text ? c.text : String(c)
                )
              : ["Aucune compétence spécifiée"],
          },
          { text: "Expérience", style: "subheader" },
          {
            text: safeCandidate.experience,
            margin: [0, 0, 0, 10],
          },
        ],
        styles: {
          header: { fontSize: 22, bold: true, alignment: "center", margin: [0, 10, 0, 10] },
          subheader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
        },
        defaultStyle: {
          font: "Roboto",
        },
      };

      // Create PDF document
      const pdfDoc = printer.createPdfKitDocument(docDefinition);

      // Create write stream
      const stream = fs.createWriteStream(filePath);

      // Handle errors on the stream
      stream.on("error", (err) => {
        console.error("Error in PDF stream:", err);
        reject(err);
      });

      // Handle completion
      stream.on("finish", () => {
        console.log(`PDF successfully generated at ${filePath}`);
        resolve(filePath);
      });

      // Pipe document to stream
      pdfDoc.pipe(stream);

      // End the document
      pdfDoc.end();
    } catch (err) {
      console.error("Error generating PDF:", err);
      reject(err);
    }
  });
};

module.exports = generatePDF;
