import "./Menu.css";
import { GrPersonalComputer } from "react-icons/gr";
import { BsListTask, BsArrowLeftRight } from "react-icons/bs";
import { IoChatboxOutline, IoShareSocialOutline } from "react-icons/io5";


import {useState} from "react";
import {Link} from "react-router-dom";

function Menu(){
    return(
        <main>
            <aside className="side-bar-rail">
                <div className="brand-block">
                    <div className="brand-block-frame"><span>IS</span></div>
                    <div className="brand-block-span">
                        <span >Indie Squad</span>
                    </div>
                </div>
                <div className="navigation">
                    <Link className="nav" to={{
                            pathname:"/restorePassword"}}> 
                            <i><GrPersonalComputer /></i> 
                            <span>Escritorio</span>
                            <hr />
                            </Link>
                </div>
                <div className="navigation">
                    <Link className="nav" to={{
                            pathname:"/restorePassword"}}> 
                            <i><BsListTask /></i> 
                            <span>Quests</span>
                            <hr />
                            </Link>
                </div>
                <div className="navigation">
                    <Link className="nav" to={{
                            pathname:"/restorePassword"}}> 
                            <i><IoChatboxOutline /></i> 
                            <span>NPCs</span>
                            <hr />
                            </Link>
                </div>
                <div className="navigation">
                    <Link className="nav" to={{
                            pathname:"/restorePassword"}}> 
                            <i><IoShareSocialOutline /></i> 
                            <span>Memória</span>
                            <hr />
                            </Link>
                </div>
                <div className="navigation">
                    <Link className="nav" to={{
                            pathname:"/restorePassword"}}> 
                            <i><BsArrowLeftRight /></i> 
                            <span>Uso</span>
                            <hr />
                            </Link>
                </div>
                <div className="account-footer">
                    <div className="account-footer-frame">
                        <span>GS</span>
                    </div>
                    <div className="account-footer-frame2">
                        <span className="account-footer-name">Gabriel<br/>Sacilloto</span>
                        <br/>
                        <span className="account-footer-owner">Owner Account</span>
                    </div>
                </div>
            </aside>
        </main>  
    )
}

export default Menu;