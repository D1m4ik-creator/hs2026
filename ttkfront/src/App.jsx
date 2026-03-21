import { Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react';

import Registration from './pages/Registration.jsx'
import Auth from './pages/Auth'
import Index from "./pages/Index.jsx"
import Promo from "./pages/Promo.jsx"
import "./App.css"
import HostPanel from './pages/HostPanel'

export default function App() {
  const token = localStorage.getItem('access')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const roles = user.roles || []

  // Определяем куда редиректить авторизованного пользователя
  const getHomePage = () => {
    if (!token) return <Promo />
    if (roles.includes('host') || roles.includes('admin')) return <HostPanel />
    return <Index />
  }

  return (
    <Routes>
      <Route path="/" element={getHomePage()} />
      <Route path="/reg" element={<Registration />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/host" element={<HostPanel />} />
    </Routes>
  )
}