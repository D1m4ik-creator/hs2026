import { Link } from 'react-router-dom'
import React, { useState } from 'react';
import { useRef } from "react";
import photo from "../assets/photo-registration.png"
import logo_img from '../assets/logo.png'
import { useNavigate } from 'react-router-dom';


function Registration() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);


    const handleClick = () => {
        if (fileInputRef) {
            fileInputRef.current.click();
        }
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

    function handlePhoto(event) {
        setPhoto(event.target.files[0]);
        setPreview(URL.createObjectURL(event.target.files[0]));
    }

    function buttonSubmit() {
        const formData = new FormData();
        formData.append('login', login);
        formData.append('full_name', fullName);
        formData.append('password', password);
        formData.append('password_confirm', password_confirm);

        // Добавляем файл, если он выбран
        if (photoFile) {
            formData.append('avatar', photoFile);
        }

        fetch('http://127.0.0.1:7000/api/register/', {
            method: 'POST',

            // Не указываем Content-Type - браузер сам установит его с boundary
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                navigate('/'); // Переход после успешной регистрации
            })
            .catch(error => {
                console.error('Error:', error);
            });
        // navigate('/')
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
                            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handlePhoto} />
                            <div onClick={handleClick} id="input_file_name_img" style={
                                {
                                    backgroundImage: `url(${preview ? preview : photo})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}>
                                {/* <img src={photo} style={{display: "none"}}/> */}
                            </div>

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