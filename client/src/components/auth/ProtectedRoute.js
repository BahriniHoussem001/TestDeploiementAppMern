import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  // Show loading state while checking authentication
  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If roles are specified and user's role is not allowed, redirect
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'candidat') {
      return <Navigate to="/mon-profil" />;
    } else if (user.role === 'recruteur') {
      return <Navigate to="/cv-list" />;
    } else {
      return <Navigate to="/" />;
    }
  }

  // If authenticated and authorized, render the protected component
  return children;
};

export default ProtectedRoute;
