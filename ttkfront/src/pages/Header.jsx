import logoImage from '../assets/logo.png'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


function Header(param) {
    const token = localStorage.getItem('token');
    const [user, userSet] = useState()

    useEffect(() => {
        fetch('http://localhost:7000/api/me/', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            userSet(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }, [token])

    const avatarUrl = user?.avatar ? `http://localhost:7000${user.avatar}` : null;
    const userFullName = user?.full_name ? user.full_name : null;

    const logout = () => {
        localStorage.clear()
        window.location.href = '/login'
    }

    const [tab, setTab] = useState('broadcast') // broadcast | playlists

    return (
        <div className="container container-header">
            <Link to="/host"><img src={logoImage} id='logo-header' /></Link>
            <nav>
                <a href="#" onClick={() => setTab('broadcast')}>Эфир</a>
                <a href="#" onClick={() => setTab('playlists')} style={{ marginLeft: "30px" }}>Плейлисты</a>

            </nav>
            <div id='user-header-container'>
                <img src={avatarUrl} id='user-avatar-header' />
                <p>{userFullName}</p>
                <button id='exit-b-header' onClick={logout}>(Выход)</button>
            </div>
            {/* {user.avatar} */}
            {/* <div style={{width: "100px", height: "100px", backgroundImage: `url(${user.avatar})`}}></div> */}
        </div>
    );
}

export default Header