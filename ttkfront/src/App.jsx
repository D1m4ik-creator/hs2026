import { Routes, Route, Link } from 'react-router-dom'
import Registration from './pages/Registration.jsx'
import Auth from './pages/Auth'
import "./App.css"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/reg" element={<Registration />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </>
  )
}