import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const AppNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Plateforme CV</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user ? (
              // Links for authenticated users
              user.role === "candidat" ? (
                // Links for candidates
                <>
                  <Nav.Link as={Link} to="/mon-profil">Mon Profil</Nav.Link>
                  <Nav.Link as={Link} to="/candidat-formulaire">Créer un CV</Nav.Link>
                </>
              ) : (
                // Links for recruiters
                <>
                  <Nav.Link as={Link} to="/cv-list">Liste des CVs</Nav.Link>
                </>
              )
            ) : (
              // Links for unauthenticated users
              <>
                <Nav.Link as={Link} to="/login">Connexion</Nav.Link>
                <Nav.Link as={Link} to="/register">Inscription</Nav.Link>
              </>
            )}
          </Nav>

          {user && (
            <Nav>
              <span className="navbar-text me-3 text-light">
                Bonjour, {user.username}
              </span>
              <Button variant="outline-light" onClick={handleLogout}>
                Déconnexion
              </Button>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
