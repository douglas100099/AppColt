import React from "react";
import { createBrowserHistory } from "history";
import { Router, Route, Switch } from "react-router-dom";
import "assets/scss/material-kit-react.scss?v=1.9.0";
import LandingPage from "views/LandingPage.js";
import LoginPage from "views/LoginPage.js";
import PrivacyPolicy from "views/PrivacyPolicy.js";
import AboutUs from "views/AboutUs";
import AuthLoading from './components/AuthLoading';
import { Provider } from "react-redux";
import { store } from "./reducers/store";
import ProtectedRoute from './components/ProtectedRoute';
import MyProfile from './views/MyProfile';
import BookingHistory from './views/BookingHistory';
import { fetchUser}  from "./actions/authactions";
import { fetchCarTypes } from "./actions/cartypeactions";

var hist = createBrowserHistory();

function App() {
  store.dispatch(fetchUser());
  store.dispatch(fetchCarTypes());
  return (
  <Provider store={store}>
    <AuthLoading>
      <Router history={hist}>
        <Switch>
          <ProtectedRoute exact component={BookingHistory} path="/booking-history"/>
          <ProtectedRoute exact component={MyProfile} path="/my-profile"/>
          <Route path="/login" component={LoginPage} />
          <Route path="/about-us" component={AboutUs} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/" component={LandingPage} />
        </Switch>
      </Router>
      </AuthLoading>
    </Provider>
  );
}

export default App;