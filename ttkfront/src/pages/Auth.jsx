import { Link } from 'react-router-dom'
import React from 'react';
import { useRef } from "react";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo_img from '../assets/logo.png'

function Auth(){
    const navigate = useNavigate();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const[IsAuthenticated, setIsAuthenticated] = useState(false)


    function handleLogin(event){
        setLogin(event.target.value);
    }

    function handlePassword(event){
        setPassword(event.target.value);
    }

    const login_user = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ // Тело запроса
                    login: login,
                    password: password
                }),
            });

            if (!res.ok) throw new Error('Ошибка входа');

            const data = await res.json();
            localStorage.setItem('token', data.access);
            setIsAuthenticated(true);
            navigate('/')
        } catch (err) {
            console.error(err);
            alert(err);
        }
    };

    return(<>
        <div className='reg-auth'>
            <div className="container container-auth">
                <Link to="/"><img src={logo_img} alt="ТТК ВЕЩАЕТ"/></Link>
                <div className='reg-auth-block'>
                    <div id="top-block-reg-auth">
                        <h3 id='block-reg-auth-name'>Авторизация</h3>
                        <Link to="/reg">Создать аккаут</Link>
                    </div>
                    <p id='small-text-registr'>Эфир уже ждёт. Подключайся</p>
                    <form action={() => login_user()}>
                        <div className='registration_input'>
                            <label>ЛОГИН</label>
                            <input type="text" placeholder='user' onChange={handleLogin}/>
                        </div>

                        <div className='registration_input'>
                            <label>ПАРОЛЬ</label>
                            <input type="password" placeholder='********' onChange={handlePassword}/>
                            {/* <button>Показать</button> */}
                        </div>

                        <button type="submit" id='submit-reg'>Войти</button>
                    </form>
                    <p id='have-account'>Нет аккаунта? <Link to="/reg">Ргистрация</Link></p>
                </div>
            </div>
        </div>
    </>)
}

export default Auth

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// export function useAuth() {
//   const navigate = useNavigate();
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     setIsAuthenticated(!!token);
//     setLoading(false);
//   }, []);



//   const logout = () => {
//     localStorage.removeItem('token');                      // ← удаляем
//     setIsAuthenticated(false);
//     navigate('/login');
//   };

//   // Добавляем токен ко всем запросам (если используете fetch)
//   const fetchWithToken = async (url: string, options: RequestInit = {}) => {
//     const token = localStorage.getItem('token');
//     const headers = {
//       ...options.headers,
//       Authorization: token ? `Bearer ${token}` : '',
//       'Content-Type': 'application/json',
//     };

//     return fetch(url, { ...options, headers });
//   };

//   return {
//     isAuthenticated,
//     loading,
//     login,
//     logout,
//     fetchWithToken,
//   };
// }