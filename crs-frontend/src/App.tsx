import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import CoursesPage from './pages/CoursesPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import RegisterCoursePage from './pages/RegisterCoursePage';
import Navbar from './components/Navbar';
import MyRegistrationsPage from './pages/MyRegistrationsPage';
function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Navigate to="/courses" replace

                    />} />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route
                        path="/admin/courses"
                        element={
                            <ProtectedRoute requiredRole="ADMIN">
                                <AdminCoursesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/register-course"
                        element={
                            <ProtectedRoute requiredRole="STUDENT">
                                <RegisterCoursePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/my-registrations"
                        element={
                            <ProtectedRoute requiredRole="STUDENT">
                                <MyRegistrationsPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
export default App;