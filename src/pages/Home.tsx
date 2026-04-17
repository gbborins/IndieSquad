import "./Home.css";
import logoBrand from "../assets/IndieSquad-icon.svg";
import starRate from "../assets/starRate.svg";
import smiling from "../assets/smiling man in suit@2x.png";

import {useState} from "react";
import {Link} from "react-router-dom";
import { TbLockFilled } from "react-icons/tb";
import { FcGoogle } from "react-icons/fc";

import RestorePassword from "./RestorePasswords";
import Login from "./Login";

function Home(){
    function displayAlert(){
        alert("Hello World")
    }

    return(
        <main>
            <section className="hero">
                <div className="brand">
                    <div className="brand-mark">
                        <img src={logoBrand} alt="logo indie-squad"></img>
                    </div>
                    
                    <h2>Indie Squad</h2>
                    
                </div>
                <div className="hero-headline">
                    <h1 className="hero-headline-gray">Agents de IA</h1>
                    <h1 className="hero-headline-purple">Para seu jogo</h1>
                    <h1 className="hero-headline-gray">Indie</h1>
                </div>
                <div className="hero-desc">
                    <span>A primeira legião de agents de marketing autônomos para desenvolvedores indie. Analise, escale e domine o mercado com inteligência artificial editorial.</span>
                </div>
                <div className="hero-user-rate">
                    <div className="hero-user-rate-stars" aria-label="star-rate">
                        <img src={starRate} alt="" />
                        <img src={starRate} alt="" />
                        <img src={starRate} alt="" />
                        <img src={starRate} alt="" />
                        <img src={starRate} alt="" />
                    </div>
                    <div className="hero-user-rate-desc">
                        <span>“Os agents da Indie Squad automatizaram todo o meu funil de marketing. É como ter uma equipe inteira rodando 24/7.”

                        </span>
                    </div>
                    <div className="hero-user-rate-profile">
                        <img src={smiling} alt="user-profile" />
                        <span>Marcus V.</span>
                    </div>
                </div>
            </section>

            <section className="auth-shell">
                <div className="auth-content">
                    <div className="auth-header">
                        <h1>Bem-vindo <br/> de volta</h1>
                        <p>Acesse seu painel de comando do esquadrão.</p>
                    </div>
                    <div className="email-senha-row">
                        <h4>E-mail de acesso</h4>
                    </div>
                    <div className="email-field">
                        <span className="email-senha-field-span">@</span>
                        <input className="email-senha-field-input" type="email" placeholder="dev@indiesquad.com"/>
                    </div>
                    <div className="email-senha-row">
                        <h4>Sua senha</h4>
                    </div>
                    <div className="senha-field">
                        <span className="email-senha-field-span"><TbLockFilled /></span>
                        <input className="email-senha-field-input" type="password" placeholder="••••••••••••"/>
                    </div>
                    <div className="esqueci-senha-div">
                        <Link className="esqueci-senha-row" to={{
                            pathname:"/restorePassword"}}>Esqueceu sua senha?</Link>
                    </div>
                    <div className="remember-row">
                        <input type="checkbox" />
                        <span>Manter conectado neste dispositivo</span>
                    </div>
                    <button className="login-button" onClick={displayAlert}>
                        <span>Entrar na conta</span>
                    </button>
                    <div className="divider">
                        <hr />
                        <span>ou entre com</span>
                        <hr />
                        </div>
                    <div className="google-button">
                        <button onClick={displayAlert} aria-label="Entrar com Google">
                        <i><FcGoogle className="google-icon"/></i>
                        </button>
                    </div>
                    <div className="signup">
                        <span>Não tem uma conta?</span>
                        <Link className="signup-link" to={{
                            pathname:"/login"}}>Criar agora</Link>
                    </div>
                    <div className="auth-footer">
                        <span>
                            © 2026 Indie Squad System
                        </span>
                        <span>Todos os direitos reservados.</span>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Home;