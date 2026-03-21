import { Link } from 'react-router-dom'
import React, { useState } from 'react';
import { useRef } from "react";
import photo from "../assets/photo-registration.png"
import logo_img from '../assets/logo.png'


function Registration() {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current.click();
    };
    const [login, setLogin] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [password_confirm, setPasswordConfirm] = useState("");
    const [photoFile, setPhoto] = useState();


    function handleLogin(event) {
        setLogin(event.target.value);
    }

    function handleFullName(event) {
        setFullName(event.target.value);
    }

    function handlePassword(event) {
        setPassword(event.target.value);
    }

    function handlePasswordConfirm(event) {
        setPasswordConfirm(event.target.value);
    }

    function handlePhoto(event){
        setPhoto(event.target.files[0]);
        console.log(event.target.files[0])
    }

    function buttonSubmit() {
        fetch('http://127.0.0.1:8000/api/register/', {
            method: 'POST', headers: {
                'Content-Type': 'application/json'
            }, body: JSON.stringify({ // Тело запроса
                login: login,
                full_name: fullName,
                password: password,
                password_confirm: password_confirm
            })
        })
    }

    return (<>
        <div className='reg-auth'>
            <div className="container container-auth">
                <Link to="/"><img src={logo_img} alt="ТТК ВЕЩАЕТ" /></Link>

                <div className='reg-auth-block'>
                    <div id="top-block-reg-auth">
                        <h3 id='block-reg-auth-name'>Регистрация</h3>
                        <Link to="/login">Войти в аккаут</Link>
                    </div>
                    <p id='small-text-registr'>Эфир уже ждёт. Подключайся</p>
                    <form action={() => buttonSubmit()}>

                        <div id='input_file_name'>
                            <input type="file" ref={fileInputRef} style={{ display: "none" }} onClick={handlePhoto}/>
                            <div onClick={handleClick} id="input_file_name_img"><img src={photoFile ? photoFile : photo} /></div>

                            <span className='registration_input'>
                                <label>ФИО</label>
                                <input type="text" placeholder='Иванов Иван Иванович' onChange={handleFullName} />
                            </span>
                        </div>

                        <div className='registration_input'>
                            <label>ЛОГИН</label>
                            <input type="text" placeholder='user' onChange={handleLogin} />
                        </div>

                        <div className='registration_input'>
                            <label>ПАРОЛЬ</label>
                            <input type="password" placeholder='********' onChange={handlePassword} />
                            {/* <button>Показать</button> */}
                        </div>

                        <div className='registration_input'>
                            <label>ПАРОЛЬ ЕЩЁ РАЗ</label>
                            <input type="password" placeholder='********' onChange={handlePasswordConfirm} />
                            {/* <button>Показать</button> */}
                        </div>

                        <button type="submit" id='submit-reg'>Зарегистрироваться</button>
                    </form>
                    <p id='have-account'>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
                </div>
            </div>
        </div>

    </>)
}

export default Registration