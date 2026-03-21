import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config'


function Index() {
    const token = localStorage.getItem('access') || localStorage.getItem('token');
    const [, setUser] = useState();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!token) {
            navigate('/login')
            return;
        }
        fetch(`${API_BASE}/me/`, {
            method: 'GET',                         // или 'POST', 'PUT' и т.д.
            headers: {
                'Authorization': `Bearer ${token}`,  // ← именно так
                'Content-Type': 'application/json',  // если отправляешь JSON
            },
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка ' + response.status);
            return response.json();
        })
        .then(data => setUser(data))
        .catch(err => console.error('Ошибка:', err));
    }, [navigate, token])

    return(<>

    </>)
}

export default Index
