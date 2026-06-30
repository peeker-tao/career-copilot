import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Resumes from './pages/Resumes';
import Interviews from './pages/Interviews';
import CareerPlans from './pages/CareerPlans';
import QuestionBank from './pages/QuestionBank';
import LearningResources from './pages/LearningResources';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false);
        setValid(false);
        return;
      }
      const ok = await checkAuth();
      setValid(ok);
      setLoading(false);
    };
    verify();
  }, [token, checkAuth]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="验证身份中..." />
      </div>
    );
  }

  return valid ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#667eea',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="resumes" element={<Resumes />} />
              <Route path="interviews" element={<Interviews />} />
              <Route path="career-plans" element={<CareerPlans />} />
              <Route path="question-bank" element={<QuestionBank />} />
              <Route path="learning-resources" element={<LearningResources />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
