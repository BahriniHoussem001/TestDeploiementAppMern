import { useEffect, useState, useContext } from "react";
import { Container, Alert, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const MonProfil = () => {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not authenticated, this should not happen due to ProtectedRoute
    // but as an extra safety measure
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchCandidateProfile = async () => {
      try {
        // First try to get candidateId from localStorage
        let candidateId = localStorage.getItem("candidateId");

        // If not found, try to fetch by user ID
        if (!candidateId && user.id) {
          const response = await fetch(`http://localhost:5000/candidates/user/${user.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.candidateId) {
              candidateId = data.candidateId;
              localStorage.setItem("candidateId", candidateId);
            }
          }
        }

        if (!candidateId) {
          setCandidate(null);
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/candidates/${candidateId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCandidate(data);
        } else {
          setCandidate(null);
        }
      } catch (error) {
        console.error("Error fetching candidate profile:", error);
        setCandidate(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateProfile();
  }, [user, navigate]);

  const handleCreateCV = () => {
    navigate('/candidat-formulaire');
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Mon Profil</h2>
      {loading ? (
        <div className="text-center">
          <p>Chargement...</p>
        </div>
      ) : candidate ? (
        <Card className="shadow-sm">
          <Card.Body>
            <Card.Title className="mb-4">Informations personnelles</Card.Title>
            <p><strong>Nom :</strong> {candidate.nom}</p>
            <p><strong>Email :</strong> {candidate.email}</p>
            <p><strong>Téléphone :</strong> {candidate.telephone}</p>
            <p><strong>Domaine :</strong> {candidate.domaine}</p>
            <p><strong>Région :</strong> {candidate.Region}</p>
            <p><strong>Compétences :</strong> {candidate.competences?.join(', ')}</p>
            <p><strong>Consultations CV :</strong> {candidate.cvViews || 0}</p>

            <div className="mt-4">
              {candidate.cvUrl ? (
                <div className="d-flex gap-2">
                  <Button variant="success" href={candidate.cvUrl} target="_blank">
                    Télécharger mon CV
                  </Button>
                  <Button variant="outline-primary" onClick={handleCreateCV}>
                    Mettre à jour mon CV
                  </Button>
                </div>
              ) : (
                <Alert variant="danger">CV non disponible</Alert>
              )}
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="text-center">
          <Alert variant="warning" className="mb-4">Aucun profil trouvé. Vous n'avez pas encore créé votre CV.</Alert>
          <Button variant="primary" onClick={handleCreateCV}>
            Créer mon CV maintenant
          </Button>
        </div>
      )}
    </Container>
  );
};

export default MonProfil;
