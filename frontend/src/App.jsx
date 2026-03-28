import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Quartos from "./pages/Quartos";
import Reservas from "./pages/Reservas";
import Usuarios from "./pages/Usuarios";
import CheckIn from "./pages/CheckIn";
import CheckOut from "./pages/CheckOut";
import Produtos from "./pages/Produtos";
import Limpeza from "./pages/Limpeza";
import Notificacoes from "./pages/Notificacoes";
import Logs from "./pages/Logs";
import Manutencao from "./pages/Manutencao";
import Relatorios from "./pages/Relatorios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingScreen from "./components/LoadingScreen";

import Home from "./pages/Home";
import LoginCliente from "./pages/LoginCliente";
import CadastroCliente from "./pages/CadastroCliente";
import MeusAgendamentos from "./pages/MeusAgendamentos";
import Clientes from "./pages/Clientes";
import ForgotPassword from "./pages/ForgotPassword";

function ProtectedRoute({ children, allowClient = false }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen title="Carregando sua sessão..." subtitle="Aguarde um instante" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={allowClient ? "/login-cliente" : "/login"} replace />;
  }

  // Se a rota NÃO permite clientes e o usuário logado É um cliente, redireciona para Home pública
  const cargos = Array.isArray(user?.cargos) ? user.cargos : [];
  const eCliente = cargos.includes("CLIENTE");

  if (!allowClient && eCliente) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login-cliente" element={<LoginCliente />} />
      <Route path="/cadastro" element={<CadastroCliente />} />
      <Route 
        path="/meus-agendamentos" 
        element={
          <ProtectedRoute allowClient>
            <MeusAgendamentos />
          </ProtectedRoute>
        } 
      />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="quartos" element={<Quartos />} />
        <Route path="quartos/novo" element={<Quartos />} />
        <Route path="quartos/:id" element={<Quartos />} />
        <Route path="reservas" element={<Reservas />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="hospedagem" element={<CheckOut />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="limpeza" element={<Limpeza />} />
        <Route path="manutencao" element={<Manutencao />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="notificacoes" element={<Notificacoes />} />
        <Route path="logs" element={<Logs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ToastContainer 
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
    />
    </>
  );
}
