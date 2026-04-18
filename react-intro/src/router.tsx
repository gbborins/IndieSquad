import {Route, Routes, BrowserRouter} from "react-router-dom";

import Home from "./pages/Home";
import RestorePassword from "./pages/RestorePasswords";
import Login from "./pages/Login";
import Menu from "./pages/Menu";

function Router(){
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/restorePassword" element={<RestorePassword/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/menu" element={<Menu/>}></Route>
            </Routes>
        </BrowserRouter>
    )
}

export default Router;