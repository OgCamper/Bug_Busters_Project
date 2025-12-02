import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import DeckPage from './pages/DeckPage';
import DeckQuizPage from './pages/DeckQuizPage';
import SpacedQuizPage from './pages/SpacedQuizPage';
import StatsPage from './pages/StatsPage'; // <-- Import added

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/decks/:deckId"
            element={
              <ProtectedRoute>
                <DeckPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/decks/:deckId/quiz"
            element={
              <ProtectedRoute>
                <DeckQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decks/:deckId/quiz/spaced"
            element={
              <ProtectedRoute>
                <SpacedQuizPage />
              </ProtectedRoute>
            }
          />
          {/* New Stats Page Route */}
          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <StatsPage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;