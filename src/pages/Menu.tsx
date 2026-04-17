import "./Menu.css";

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
                <div className="Navigation">
                    <Link className="nav" to={{
                            pathname:"/restorePassword"}}> ewa</Link>
                </div>
                <div className="account-footer">
                </div>
            </aside>
        </main>  
    )
}

export default Menu;