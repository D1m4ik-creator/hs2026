import { Link } from 'react-router-dom'
import React, { useRef } from "react";
import photo from "../assets/photo-registration.png"

function Registration(){
    const fileInputRef = useRef(null);

    const handleClick = () => {
    fileInputRef.current.click();
    };

    return(<>
        <div className='reg-auth-block'>
            <div id="top-block-reg-auth">
                <h3 id='block-reg-auth-name'>Регистрация</h3>
                <Link to="/auth">Войти в аккаут</Link>
            </div>
            <p id='small-text-registr'>Эфир уже ждёт. Подключайся</p>
            <form action="" method="post">

                <div id='input_file_name'>
                    <input type="file" ref={fileInputRef} style={{ display: "none" }}/>
                    <div onClick={handleClick} id="input_file_name_img"><img src={photo} /></div>

                    <span className='registration_input'>
                        <label>ФИО</label>
                        <input type="text" placeholder='Иванов Иван Иванович'/>
                    </span>
                </div>

                <div className='registration_input'>
                    <label>ЛОГИН</label>
                    <input type="text" placeholder='user'/>
                </div>

                <div className='registration_input'>
                    <label>ПАРОЛЬ</label>
                    <input type="password" placeholder='********'/>
                    {/* <button>Показать</button> */}
                </div>

                <div className='registration_input'>
                    <label>ПАРОЛЬ ЕЩЁ РАЗ</label>
                    <input type="password" placeholder='********'/>
                    {/* <button>Показать</button> */}
                </div>

                <button type="submit" id='submit-reg'>Зарегистрироваться</button>
            </form>
            <p id='have-account'>Уже есть аккаунт? <Link to="/auth">Войти</Link></p>
        </div>
    </>)
}

export default Registration