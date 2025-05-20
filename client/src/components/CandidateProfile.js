import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Button, Alert } from "react-bootstrap";
import CVStatut from "./CVStatut";

const CandidateProfile = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/candidates/${id}`)
      .then((res) => res.json())
      .then((data) => setCandidate(data))
      .catch((err) => console.error("Erreur de récupération du candidat :", err));
  }, [id]);

  return (
    <Container className="mt-5">
      {candidate ? (
        <>
          <h2 className="text-center mb-4">Profil du candidat</h2>
          <p><strong>Nom :</strong> {candidate.nom}</p>
          <p><strong>Email :</strong> {candidate.email}</p>
          {/*<p><strong>Score :</strong> {candidate.score !== undefined ? `${candidate.score.toFixed(1)}/100` : "Non calculé"}</p>*/}


          {candidate.cvUrl ? (
            <Button variant="success" href={candidate.cvUrl} target="_blank" className="me-3">
              Télécharger mon CV
            </Button>
          ) : (
            <Alert variant="danger">CV non disponible</Alert>
          )}

          {/* 👁️ Affichage du nombre de consultations */}
          <CVStatut candidateId={candidate._id} />
        </>
      ) : (
        <p>Chargement...</p>
      )}
    </Container>
  );
};

export default CandidateProfile;
