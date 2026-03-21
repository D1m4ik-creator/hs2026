import { Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react';

import HostPanel from './pages/HostPanel'
import Registration from './pages/Registration.jsx'
import Auth from './pages/Auth'
import Index from "./pages/Index.jsx"
import Promo from "./pages/Promo.jsx"
import "./App.css"

export default function App() {
  const token = localStorage.getItem('token');
  const [startPage, setStartPage] = useState(<Promo />);
  useEffect(() => {
    if (token){
      setStartPage(<Index />)
    }
  }, [])
  

  return (
    <>
      <Routes>
        <Route path="/reg" element={<Registration />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/" element={startPage} />
        <Route path="/host" element={<HostPanel />} />
      </Routes>
    </>
  )
}