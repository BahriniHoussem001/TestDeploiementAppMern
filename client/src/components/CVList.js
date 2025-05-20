import { useEffect, useState, useContext } from "react";
import { Container, Table, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const CVList = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedDomaine, setSelectedDomaine] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState("");
  const [customSkillsList, setCustomSkillsList] = useState([]);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify the user is a recruiter
    if (user && user.role !== "recruteur") {
      navigate("/mon-profil");
      return;
    }

    const fetchCandidates = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch("http://localhost:5000/candidates", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des candidats");
        }

        const data = await response.json();
        setCandidates(data);
      } catch (err) {
        console.error("Erreur de récupération des candidats :", err);
        setError("Impossible de charger la liste des candidats. Veuillez réessayer plus tard.");
      }
    };

    fetchCandidates();
  }, [user, navigate]);

  const handleSkillChange = (e) => {
    const { value, checked } = e.target;
    setSelectedSkills((prev) =>
      checked ? [...prev, value] : prev.filter((skill) => skill !== value)
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setCustomSkillsList((prev) => [...prev, trimmed]);
      setSelectedSkills((prev) => [...prev, trimmed]);
      setCustomSkill("");
    }
  };

  const calculateMatchingScore = (candidate) => {
    if (selectedSkills.length === 0) return null;
    const matchCount = selectedSkills.filter((skill) =>
      candidate.competences.includes(skill)
    ).length;
    return Math.round((matchCount / selectedSkills.length) * 100);
  };

  // Function to track CV downloads
  const trackDownload = async (candidateId) => {
    try {
      // Make a silent request to the backend to track the download
      fetch(`http://localhost:5000/track-download/${candidateId}`, {
        method: 'GET',
      }).catch(err => console.error("Error tracking download:", err));
      // We don't need to wait for the response or handle errors
      // as this is just for tracking purposes
    } catch (error) {
      console.error("Error tracking download:", error);
    }
  };

  const filteredCandidates = candidates
    .filter((c) =>
      (!selectedDomaine || c.domaine === selectedDomaine) &&
      (c.nom.toLowerCase().includes(searchTerm) || c.email.toLowerCase().includes(searchTerm)) &&
      (selectedSkills.length === 0 || selectedSkills.some((skill) => c.competences.includes(skill)))
    )
    .sort((a, b) => {
      if (selectedSkills.length > 0) {
        return (calculateMatchingScore(b) || 0) - (calculateMatchingScore(a) || 0);
      }
      return b.score - a.score;
    });

  const fixedSkills = {
    Informatique: ["JavaScript", "React", "Node.js", "Python", "SQL", "DevOps"],
    Santé: ["Soins infirmiers", "Médecine générale", "Pharmacie", "Radiologie"],
    Finance: ["Analyse financière", "Comptabilité", "Audit", "Gestion de portefeuille"],
    Ingénierie: ["Génie civil", "Électricité", "Mécanique", "Robotique"],
    Éducation: ["Pédagogie", "Psychologie de l'éducation", "Langues", "Mathématiques"],
  };

  const skillsForDomain = fixedSkills[selectedDomaine] || [];

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Liste des CVs des Candidats</h2>
        <Button variant="outline-danger" onClick={handleLogout}>
          Déconnexion
        </Button>
      </div>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <Form.Control
        type="text"
        placeholder="Rechercher par Région..."
        className="mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
      />

      <Form.Select
        value={selectedDomaine}
        onChange={(e) => {
          setSelectedDomaine(e.target.value);
          setSelectedSkills([]);
          setCustomSkillsList([]);
        }}
        className="mb-3"
      >
        <option value="">-- Tous les domaines --</option>
        {[...new Set(candidates.map((c) => c.domaine))].map((domaine, index) => (
          <option key={index} value={domaine}>
            {domaine}
          </option>
        ))}
      </Form.Select>

      {selectedDomaine && (
        <>
          <h5>Compétences recherchées :</h5>
          <div className="mb-3">
            {[...skillsForDomain, ...customSkillsList].map((skill, idx) => (
              <Form.Check
                inline
                key={idx}
                label={skill}
                type="checkbox"
                value={skill}
                onChange={handleSkillChange}
                checked={selectedSkills.includes(skill)}
              />
            ))}
          </div>

          <Row className="mb-4">
            <Col md={8}>
              <Form.Control
                type="text"
                placeholder="Ajouter une compétence personnalisée..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Button variant="success" onClick={handleAddCustomSkill}>
                Ajouter
              </Button>
            </Col>
          </Row>
        </>
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Domaine</th>
            <th>Région</th>
            {selectedSkills.length > 0 && <th>Matching</th>}
            <th>CV</th>
          </tr>
        </thead>
        <tbody>
          {filteredCandidates.map((candidate) => {
            const matchScore = calculateMatchingScore(candidate);
            return (
              <tr key={candidate._id}>
                <td>{candidate.nom}</td>
                <td>{candidate.email}</td>
                <td>{candidate.domaine}</td>
                <td>{candidate.Region}</td>
                {selectedSkills.length > 0 && <td>{matchScore}%</td>}
                <td>
                  {candidate.cvUrl ? (
                    <>
                      <Button
                        variant="primary"
                        href={candidate.cvUrl}
                        target="_blank"
                        onClick={() => trackDownload(candidate._id)}
                      >
                        Télécharger
                      </Button>{" "}
                      <a href={`mailto:${candidate.email}`}>
                        <Button variant="outline-success" className="mt-2">
                          Contacter
                        </Button>
                      </a>

                    </>
                  ) : (
                    "CV non disponible"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Container>
  );
};

export default CVList;
