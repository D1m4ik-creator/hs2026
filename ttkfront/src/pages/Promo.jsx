import { Link } from 'react-router-dom'


import logo_img from '../assets/logo.png'

function Promo(){
    return(<>
        <div id="promo">
            <div className="container container-promo">
                <img src={logo_img} alt="ТТК ВЕЩАЕТ"/>
                <p>Платформа для живых эфиров, где можно слушать и участвовать в общении в реальном времени.</p>
                <Link to="/reg" ><div id='start-listening-promo'>Начать слушать</div></Link>
            </div>
        </div>
    </>)
}

export default Promo