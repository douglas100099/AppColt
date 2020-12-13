import React from 'react';
import {Route,Redirect} from 'react-router-dom';
import { useSelector } from "react-redux";
import AdminLayout from "../layouts/Admin/Admin";


function ProtectedRoute({ component: Component, ...rest }) {
    const auth = useSelector(state => state.auth);
    return(
        <Route {...rest} render={props => (
            auth.info ?
            <Route path="/admin" render={props => <AdminLayout {...props} />} />
            : <Redirect to="/login" />
        )} />
    )
}

export default ProtectedRoute;