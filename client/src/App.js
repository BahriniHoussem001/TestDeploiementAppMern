import './App.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import CVList from "./components/CVList";
import CandidateProfile from "./components/CandidateProfile";
import MonProfil from "./components/MonProfil";
import CandidateForm from "./components/CandidateForm";
import AppNavbar from "./components/Navbar";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const AppWrapper = () => {
  const location = useLocation();
  const isRecruiterPage = location.pathname === "/cv-list";

  return (
    <>
      {!isRecruiterPage && <AppNavbar />}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes for candidates */}
        <Route path="/mon-profil" element={
          <ProtectedRoute allowedRoles={["candidat"]}>
            <MonProfil />
          </ProtectedRoute>
        } />
        <Route path="/candidat-formulaire" element={
          <ProtectedRoute allowedRoles={["candidat"]}>
            <CandidateForm />
          </ProtectedRoute>
        } />

        {/* Protected routes for recruiters */}
        <Route path="/cv-list" element={
          <ProtectedRoute allowedRoles={["recruteur"]}>
            <CVList />
          </ProtectedRoute>
        } />

        {/* Shared routes */}
        <Route path="/candidate/:id" element={<CandidateProfile />} />

        {/* Default route - redirects to login */}
        <Route path="/" element={<Login />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppWrapper />
      </Router>
    </AuthProvider>
  );
}

export default App;
