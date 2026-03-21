import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo_img from '../assets/logo.png'
import { API_BASE } from '../config'

function Auth(){
    const navigate = useNavigate();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");


    function handleLogin(event){
        setLogin(event.target.value);
    }

    function handlePassword(event){
        setPassword(event.target.value);
    }

    const login_user = async () => {
        try {
            const res = await fetch(`${API_BASE}/login/`, {
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
            localStorage.setItem('access', data.access);
            localStorage.setItem('user', JSON.stringify(data.user || {}));
            const roles = data.user.roles
            if (roles.includes('host') || roles.includes('admin')) {
                navigate('/host')
            } else {
                navigate('/')
            }
        } catch (err) {
            console.error(err);
            alert(err);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault()
        void login_user()
    }

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
                    <form onSubmit={handleSubmit}>
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
