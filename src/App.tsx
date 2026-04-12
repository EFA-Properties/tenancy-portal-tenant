import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import DocumentsList from './pages/documents/DocumentsList'
import MaintenanceList from './pages/maintenance/MaintenanceList'
import MaintenanceDetail from './pages/maintenance/MaintenanceDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Tenant Home - Dashboard */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Documents */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentsList />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Maintenance */}
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <Layout>
                <MaintenanceList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <MaintenanceDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Rent details page - TODO */}
        <Route
          path="/rent"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-abode-text">Rent details coming soon</div>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Profile / Settings */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Redirect home to default tenant view */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Catch-all for old routes - redirect to home */}
        <Route path="/*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
