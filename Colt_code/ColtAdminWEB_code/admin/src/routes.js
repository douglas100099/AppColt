/*!

=========================================================
* Black Dashboard React v1.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-react
* Copyright 2020 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/black-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import Dashboard from "views/Dashboard.js";
//import Icons from "views/Icons.js";
import PushNotifications from "views/PushNotifications.js";
import ListDrivers from "views/ListDrivers.js";
import Settings from "views/Settings.js";
import WaitingDocs from "views/WaitingDocs.js";
import Riders from "views/Riders.js";
import Bookings from "views/Bookings.js";
import LivePreview from "views/LivePreview.js";
import EarningDriver from "views/EarningDriver.js";
import DriverEarning from "views/DriverEarning.js";
import CarTypes from "views/CarTypes.js";
import Promos from "views/Promos.js";
import Refferal from "views/Refferal.js";

var routes = [
  {
    path: "/dashboard",
    name: "Painel",
    rtlName: "لوحة القيادة",
    icon: "tim-icons icon-chart-pie-36",
    component: Dashboard,
    layout: "/admin"
  },
  {
    path: "/ListDrivers",
    name: "Motoristas",
    rtlName: "لوحة القيادة",
    icon: "tim-icons icon-single-02",
    component: ListDrivers,
    layout: "/admin"
  },
  {
    path: "/Riders",
    name: "Passageiros",
    rtlName: "لوحة القيادة",
    icon: "tim-icons icon-single-02",
    component: Riders,
    layout: "/admin"
  },
  {
    path: "/WaitingDocs",
    name: "Aguardando aprovação",
    rtlName: "لوحة القيادة",
    icon: "tim-icons icon-badge",
    component: WaitingDocs,
    layout: "/admin"
  },
  {
    path: "/Bookings",
    name: "Corridas",
    rtlName: "لوحة القيادة",
    icon: "tim-icons icon-notes",
    component: Bookings,
    layout: "/admin"
  },
  /*{
    path: "/icons",
    name: "Icones",
    rtlName: "الرموز",
    icon: "tim-icons icon-atom",
    component: Icons,
    layout: "/admin"
  },*/
  {
    path: "/LivePreview",
    name: "Live Preview",
    rtlName: "خرائط",
    icon: "tim-icons icon-square-pin",
    component: LivePreview,
    layout: "/admin"
  },
  {
    path: "/EarningDriver",
    name: "Relatórios de ganhos",
    rtlName: "إخطارات",
    icon: "tim-icons icon-chart-bar-32",
    component: EarningDriver,
    layout: "/admin"
  },
  {
    path: "/DriverEarning",
    name: "Ganhos motorista",
    rtlName: "إخطارات",
    icon: "tim-icons icon-coins",
    component: DriverEarning,
    layout: "/admin"
  },
  {
    path: "/CarTypes",
    name: "Categoria",
    rtlName: "إخطارات",
    icon: "tim-icons icon-delivery-fast",
    component: CarTypes,
    layout: "/admin"
  },
  {
    path: "/Promos",
    name: "Cupons",
    rtlName: "إخطارات",
    icon: "tim-icons icon-gift-2",
    component: Promos,
    layout: "/admin"
  },
  {
    path: "/Refferal",
    name: "Bonus Refêrencia",
    rtlName: "إخطارات",
    icon: "tim-icons icon-gift-2",
    component: Refferal,
    layout: "/admin"
  },
  {
    path: "/PushNotifications",
    name: "Notificações",
    rtlName: "إخطارات",
    icon: "tim-icons icon-bell-55",
    component: PushNotifications,
    layout: "/admin"
  },
  {
    path: "/Settings",
    name: "Configurações",
    rtlName: "طباعة",
    icon: "tim-icons icon-settings-gear-63",
    component: Settings,
    layout: "/admin"
  },
];
export default routes;
