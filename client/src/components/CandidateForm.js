import { useState, useContext, useEffect } from "react";
import { Container, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const CandidateForm = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    Region: "",
    linkedin: "",
    github: "",
    domaine: "",
    competences: [],
    autreCompetence: "",
    experience: "",
    userId: "", // To link the CV to the user
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // Pre-fill form with user data if available
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        nom: user.username || "",
        email: user.email || "",
        userId: user.id || ""
      }));
    }
  }, [user]);

  const domainesOptions = {
    Informatique: ["JavaScript", "React", "Node.js", "Python", "SQL", "DevOps"],
    Santé: ["Soins infirmiers", "Médecine générale", "Pharmacie", "Radiologie"],
    Finance: ["Analyse financière", "Comptabilité", "Audit", "Gestion de portefeuille"],
    Ingénierie: ["Génie civil", "Électricité", "Mécanique", "Robotique"],
    Éducation: ["Pédagogie", "Psychologie de l'éducation", "Langues", "Mathématiques"],
    Autre: [],
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      const updatedCompetences = checked
        ? [...prevData.competences, value]
        : prevData.competences.filter((comp) => comp !== value);
      return { ...prevData, competences: updatedCompetences };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate form data
    if (!formData.domaine) {
      setError("Veuillez sélectionner un domaine professionnel");
      setLoading(false);
      return;
    }

    if (formData.competences.length === 0 && !formData.autreCompetence.trim()) {
      setError("Veuillez sélectionner au moins une compétence");
      setLoading(false);
      return;
    }

    const allCompetences = [...formData.competences];
    if (formData.autreCompetence.trim() !== "") {
      allCompetences.push(formData.autreCompetence.trim());
    }

    const submissionData = {
      ...formData,
      competences: allCompetences,
      userId: user?.id // Include the user ID to link the CV to the user
    };

    try {
      // Get the authentication token
      const token = localStorage.getItem('token');

      const response = await fetch("http://localhost:5000/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Include auth token
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`CV généré avec succès ! Redirection vers votre profil...`);
        // Store the candidate ID in localStorage for profile access
        if (data.candidateId) {
          localStorage.setItem('candidateId', data.candidateId);
        }
        // Delay navigation to show success message
        setTimeout(() => {
          navigate("/mon-profil");
        }, 2000);
      } else {
        // Check if it's a duplicate email error
        if (data.error && data.error.includes("duplicate key error") && data.error.includes("email")) {
          setError("Cette adresse email est déjà utilisée par un autre candidat. Veuillez utiliser une autre adresse email.");
        } else {
          setError("Erreur lors de la génération du CV : " + (data.message || data.error || "Erreur inconnue"));
        }
      }
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
      setError("Une erreur est survenue lors de la communication avec le serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <div className="form-container shadow p-4 bg-white rounded">
        <h2 className="text-center mb-4">Formulaire de Candidature</h2>

        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {success && <Alert variant="success" className="mb-3">{success}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control type="text" name="nom" value={formData.nom} onChange={handleChange} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control type="text" name="telephone" value={formData.telephone} onChange={handleChange} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date de naissance</Form.Label>
                <Form.Control type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} required />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Région</Form.Label>
            <Form.Control type="text" name="Region" value={formData.Region} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Domaine professionnel</Form.Label>
            <Form.Select name="domaine" onChange={handleChange} required>
              <option value="">Sélectionner un domaine</option>
              {Object.keys(domainesOptions).map((domaine) => (
                <option key={domaine} value={domaine}>{domaine}</option>
              ))}
            </Form.Select>
          </Form.Group>

          {formData.domaine && (
            <Form.Group className="mb-3">
              <Form.Label>Compétences</Form.Label>
              {domainesOptions[formData.domaine].map((comp) => (
                <Form.Check
                  key={comp}
                  type="checkbox"
                  label={comp}
                  value={comp}
                  checked={formData.competences.includes(comp)}
                  onChange={handleCheckboxChange}
                />
              ))}
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Autres compétences</Form.Label>
            <Form.Control
              type="text"
              name="autreCompetence"
              value={formData.autreCompetence}
              onChange={handleChange}
              placeholder="Ajoutez une compétence non listée"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Expérience</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Génération en cours...
              </>
            ) : (
              "Générer le CV"
            )}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default CandidateForm;
