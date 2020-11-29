import React from "react";
import ReactDOM from "react-dom";
import { createBrowserHistory } from "history";
import { Router, Route, Switch, Redirect } from "react-router-dom";
import { store } from "./reducers/store";
import { Provider } from "react-redux";
import Login from './views/Login';

import AdminLayout from "layouts/Admin/Admin.js";
import RTLLayout from "layouts/RTL/RTL.js";
import { fetchUser}  from "./actions/authactions";
import AuthLoading from './components/AuthLoading';

import "assets/scss/black-dashboard-react.scss";
import "assets/demo/demo.css";
import "assets/css/nucleo-icons.css";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./views/Dashboard";
import CarTypes from "./views/CarTypes";
import DriverEarning from "./views/DriverEarning";
import Bookings from "./views/Bookings";
import EarningDriver from "./views/EarningDriver";
import LivePreview from "./views/LivePreview";
import ListDrivers from "./views/ListDrivers";
import Riders from "./views/Riders";
import PushNotifications from "./views/PushNotifications";
import Refferal from "./views/Refferal";
import Settings from "./views/Settings";
import WaitingDocs from "./views/WaitingDocs";
import Promos from "./views/Promos";

const hist = createBrowserHistory();

store.dispatch(fetchUser());
ReactDOM.render(
  <Provider store={store}>
    <AuthLoading>
      <Router history={hist}>
        <Switch>
          <ProtectedRoute exact component={Dashboard} path="/admin/dashboard"/>
          <ProtectedRoute exact component={CarTypes} path="/admin/CarTypes"/>
          <ProtectedRoute exact component={Bookings} path="/admin/Bookings"/>
          <ProtectedRoute exact component={DriverEarning} path="/admin/DriverEarning"/>
          <ProtectedRoute exact component={EarningDriver} path="/admin/EarningDriver"/>
          <ProtectedRoute exact component={ListDrivers} path="/admin/ListDrivers"/>
          <ProtectedRoute exact component={LivePreview} path="/admin/LivePreview"/>
          <ProtectedRoute exact component={Riders} path="/admin/Riders"/>
          <ProtectedRoute exact component={PushNotifications} path="/admin/PushNotifications"/>
          <ProtectedRoute exact component={Refferal} path="/admin/Refferal"/>
          <ProtectedRoute exact component={Settings} path="/admin/Settings"/>
          <ProtectedRoute exact component={WaitingDocs} path="/admin/WaitingDocs"/>
          <ProtectedRoute exact component={Promos} path="/admin/Promos"/>
          <Route component={Login} path="/login"/>
        </Switch>
      </Router>
    </AuthLoading>
  </Provider>,
  document.getElementById("root")
);
