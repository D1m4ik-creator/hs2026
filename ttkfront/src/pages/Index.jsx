import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


function Index() {
    const token = localStorage.getItem('token');
    const [user, setUser] = useState();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!token) {
            console.log("Токена нет → не делаем запрос");
            navigate('/login')
            return;
        }
        fetch('http://127.0.0.1:8000/api/me/', {
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
    }, [])


    console.log(user)
    return(<>

    </>)
}

export default Index