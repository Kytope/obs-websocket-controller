import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Editor } from './components/Editor';
import { ObsOutput } from './components/ObsOutput';

const AppContent = () => {
  const { user, isLoading } = useAuth();

  // 1. LÓGICA DE RUTAS MANUAL
  // Si la URL es "/obs", mostramos directamente la salida.
  // Bypass del Login para simplificar la integración con OBS Browser Source.
  if (window.location.pathname === '/obs') {
    return <ObsOutput />;
  }

  // 2. Lógica normal de la aplicación (Editor / Login)
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Cargando...</div>;
  }

  return user ? <Editor /> : <Login />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;