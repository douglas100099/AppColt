import React, { useState, useEffect } from 'react';
import {
    Grid,
    GridItem,
    Typography
} from '@material-ui/core';
import DashboardCard from '../components/DashboardCard';
import { makeStyles } from '@material-ui/core/styles';
import { useSelector } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import languageJson from "../config/language";
import MaterialTable from 'material-table';
import dateStyle from '../config/dateStyle';


const Dashboard = () => {
    const [data, setData] = useState([]);
    const [data2, setData2] = useState([]);
    const [mylocation, setMylocation] = useState(null);
    const [driverOnline, setLocations] = useState(0);
    const [driverEmCorrida, setDriverEmCorrida] = useState(0);
    const [totalOnline, setTotalMotorista] = useState(0);
    const [totalClientes, setTotalClientes] = useState(0);
    const [dailygross, setDailygross] = useState(0);
    const [monthlygross, setMonthlygross] = useState(0);
    const [totalgross, setTotalgross] = useState(0);

    const [corridasHoje, setCorridasHoje] = useState(0);
    const [corridasMes, setCorridasMes] = useState(0);
    const [totalCorridas, setCorridasTotais] = useState(0);

    const [monthlytaxa, setMonthlytaxa] = useState(0);
    const [dailytaxa, setDailytaxa] = useState(0);
    const [totaltaxa, setTotaltaxa] = useState(0);

    const [settings, setSettings] = useState({});

    const usersdata = useSelector(state => state.usersdata);
    const bookinglistdata = useSelector(state => state.bookinglistdata);
    const settingsdata = useSelector(state => state.settingsdata);

    const columns =  [
        { title: languageJson.booking_date, field: 'tripdate', render: rowData => rowData.tripdate?new Date(rowData.tripdate).toLocaleString(dateStyle):null},
        { title: 'Foto',  field: 'imageRider',render: rowData => rowData.imageRider?<img alt='Profile' src={rowData.imageRider} style={{width: 50,borderRadius:'50%'}}/>:null},
        { title: languageJson.customer_name,field: 'customer_name'},
        { title: 'Foto',  field: 'driver_image',render: rowData => rowData.driver_image?<img alt='Profile' src={rowData.driver_image} style={{width: 50,borderRadius:'50%'}}/>:null},
        { title: languageJson.assign_driver, field: 'driver_name' },
        { title: languageJson.booking_status, field: 'status' },
        { title: languageJson.trip_cost, field: 'trip_cost' },
    ]

    const columns2 =  [
        { title: languageJson.booking_date, field: 'tripdate', render: rowData => rowData.tripdate?new Date(rowData.tripdate).toLocaleString(dateStyle):null},
        { title: 'Foto',  field: 'imageRider',render: rowData => rowData.imageRider?<img alt='Profile' src={rowData.imageRider} style={{width: 50,borderRadius:'50%'}}/>:null},
        { title: languageJson.customer_name,field: 'customer_name'},
        { title: 'Foto',  field: 'driver_image',render: rowData => rowData.driver_image?<img alt='Profile' src={rowData.driver_image} style={{width: 50,borderRadius:'50%'}}/>:null},
        { title: languageJson.assign_driver, field: 'driver_name' },
        { title: languageJson.booking_status, field: 'status' },
        { title: languageJson.trip_cost, field: 'estimate' },
    ]

    useEffect(() => {
        if (mylocation == null) {
            navigator.geolocation.getCurrentPosition(
                position => setMylocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }),
                err => console.log(err)
            );
        }
    }, [mylocation]);

    useEffect(() => {
        if (settingsdata.settings) {
            setSettings(settingsdata.settings);
        }
    }, [settingsdata.settings]);

    useEffect(() => {
        if (usersdata.users) {
            const drivers = usersdata.users.filter(({ usertype }) => usertype === 'driver');
            let driverOnline = 0;
            let totalOnline = drivers.length
            let driverEmCorrida = 0;
            for (let i = 0; i < drivers.length; i++) {
                if (drivers[i].approved && drivers[i].driverActiveStatus) {
                    driverOnline++
                }
                if (drivers[i].emCorrida) {
                    driverEmCorrida++
                }
            }
            setDriverEmCorrida(driverEmCorrida);
            setTotalMotorista(totalOnline)
            setLocations(driverOnline);

            const rider = usersdata.users.filter(({ usertype }) => usertype === 'rider');
            let totalClientes = rider.length
            setTotalClientes(totalClientes)
        }
    }, [usersdata.users]);

    useEffect(() => {
        if (bookinglistdata.bookings) {
            let today = new Date();
            let tdTrans = 0;
            let mnTrans = 0;
            let totTrans = 0;
            let convenniencefees = 0;
            let totconvenienceTrans = 0;
            let todayConvenience = 0;
            let corridasHoje = 0;
            let corridasMes = 0;
            let totalCorridas = 0;
            for (let i = 0; i < bookinglistdata.bookings.length; i++) {
                const { tripdate } = bookinglistdata.bookings[i]
                const { trip_cost, discount_amount, convenience_fees } = bookinglistdata.bookings[i].pagamento;
                let tDate = new Date(tripdate);
                if (trip_cost >= 0 && discount_amount >= 0) {
                    if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
                        tdTrans = tdTrans + trip_cost + discount_amount;
                        corridasHoje++
                    }
                    if (tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear()) {
                        mnTrans = mnTrans + trip_cost + discount_amount;
                        corridasMes++
                    }

                    totTrans = totTrans + trip_cost + discount_amount;
                    totalCorridas = bookinglistdata.bookings.length;
                } if (convenience_fees > 0) {

                    if (tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear()) {
                        convenniencefees = convenniencefees + convenience_fees
                    }
                    if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
                        todayConvenience = todayConvenience + convenience_fees;
                    }
                    totconvenienceTrans = totconvenienceTrans + convenience_fees;
                }
            }

            if(bookinglistdata.bookings){
                let solicitandoCarro = [];
                let emCorrida = [];
                for (let i = 0; i < bookinglistdata.bookings.length; i++){
                    const { status } = bookinglistdata.bookings[i]
                    if(status === "NEW"){
                        solicitandoCarro.push(bookinglistdata.bookings[i])
                    }
                    if(status === "START" || status === "EMBARQUE" || status === "ACCEPTED"){
                        emCorrida.push(bookinglistdata.bookings[i])
                    }
                }
                setData2(emCorrida);
                setData(solicitandoCarro);
            }

            setCorridasHoje(corridasHoje);
            setCorridasMes(corridasMes);
            setCorridasTotais(totalCorridas);

            setDailygross(parseFloat(tdTrans).toFixed(2));
            setMonthlygross(parseFloat(mnTrans).toFixed(2));
            setTotalgross(parseFloat(totTrans).toFixed(2));

            setDailytaxa(parseFloat(todayConvenience).toFixed(2));
            setMonthlytaxa(parseFloat(convenniencefees).toFixed(2));
            setTotaltaxa(parseFloat(totconvenienceTrans).toFixed(2));
        }
    }, [bookinglistdata.bookings]);
    return (
        bookinglistdata.loading || usersdata.loading ? <CircularLoading /> :
            <div>
                <Typography variant="h5" color='primary' style={{ margin: "20px 0 0 15px" }}>CORRIDAS</Typography>
                <Grid container direction="row" spacing={2}>
                    <Grid item xs>
                        <DashboardCard title={languageJson.today_text} image={require("../assets/money1.jpg")}>{corridasHoje}</DashboardCard>
                    </Grid>
                    <Grid item xs>
                        <DashboardCard title={languageJson.this_month_text} image={require("../assets/money2.jpg")}>{corridasMes}</DashboardCard>
                    </Grid>
                    <Grid item xs>
                        <DashboardCard title={languageJson.total} image={require("../assets/money3.jpg")}>{totalCorridas}</DashboardCard>
                    </Grid>
                </Grid>

                <Typography variant="h5" color='primary' style={{ margin: "20px 0 0 15px" }}>SALDO CORRIDAS</Typography>
                <Grid container direction="row" spacing={2}>
                    <Grid item xs>
                        <DashboardCard title={languageJson.today_text} image={require("../assets/money1.jpg")}>{settings.symbol + ' ' + dailygross}</DashboardCard>
                    </Grid>
                    <Grid item xs>
                        <DashboardCard title={languageJson.this_month_text} image={require("../assets/money2.jpg")}>{settings.symbol + ' ' + monthlygross}</DashboardCard>
                    </Grid>
                    <Grid item xs>
                        <DashboardCard title={languageJson.total} image={require("../assets/money3.jpg")}>{settings.symbol + ' ' + totalgross}</DashboardCard>
                    </Grid>
                </Grid>

                <Typography variant="h5" color='primary' style={{ margin: "20px 0 0 15px" }}>LUCROS GERAIS</Typography>
                <Grid container direction="row" spacing={2}>
                    <Grid item xs>
                        <DashboardCard title={languageJson.today_text} image={require("../assets/money1.jpg")}>{settings.symbol + ' ' + dailytaxa}</DashboardCard>
                    </Grid>
                    <Grid item xs>
                        <DashboardCard title={languageJson.this_month_text} image={require("../assets/money2.jpg")}>{settings.symbol + ' ' + monthlytaxa}</DashboardCard>
                    </Grid>
                    <Grid item xs>
                        <DashboardCard title={languageJson.total} image={require("../assets/money3.jpg")}>{settings.symbol + ' ' + totaltaxa}</DashboardCard>
                    </Grid>
                </Grid>

                <Typography variant="h5" color='primary' style={{ margin: "20px 0 0 15px" }}>MOTORISTAS</Typography>
                <Grid container direction="row" spacing={2}>
                    <Grid item xs>
                        <DashboardCard title='ONLINE' image={require("../assets/money1.jpg")}>{driverOnline}</DashboardCard>
                    </Grid>
                    <Grid item xs>
                        <DashboardCard title='EM CORRIDA' image={require("../assets/money2.jpg")}>{driverEmCorrida}</DashboardCard>
                    </Grid>
                    <Grid item xs>
                        <DashboardCard title='TOTAL' image={require("../assets/money2.jpg")}>{totalOnline}</DashboardCard>
                    </Grid>
                </Grid>

                <Typography variant="h5" color='primary' style={{ margin: "20px 0 0 15px" }}>CLIENTES</Typography>
                <Grid container direction="row" spacing={2}>
                    <Grid item xs>
                        <DashboardCard title='TOTAL' image={require("../assets/money1.jpg")}>{totalClientes}</DashboardCard>
                    </Grid>
                </Grid>

                <Typography variant="h5" color='primary' style={{ margin: "20px 0 0 20px" }}></Typography>
                <Grid container direction="row" spacing={2}>
                    <Grid item xs>
                        <MaterialTable
                            title='Solicitando carro'
                            columns={columns}
                            data={data.reverse()}
                            options={{
                                actionsColumnIndex: -1
                            }}
                        />
                    </Grid>
                </Grid> 
                <Typography variant="h5" color='primary' style={{ margin: "20px 0 0 20px" }}></Typography>
                <Grid container direction="row" spacing={2}>
                    <Grid item xs>
                        <MaterialTable
                            title='Corrida em andamento'
                            columns={columns2}
                            data={data2.reverse()}
                            options={{
                                actionsColumnIndex: -1
                            }}
                        />
                    </Grid>
                </Grid> 
                {/*
            { mylocation?
            <Paper style={{marginTop:'25px'}}>
                <Typography variant="h4" style={{margin:"20px 0 0 15px"}}>{languageJson.real_time_driver_section_text}</Typography>
                <Map mapcenter={mylocation} locations={locations}
                    googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + google_map_key + "&v=3.exp&libraries=geometry,drawing,places"}
                    loadingElement={<div style={{ height: `480px` }} />}
                    containerElement={<div style={{ height: `480px` }} />}
                    mapElement={<div style={{ height: `480px` }} />}
                />
            </Paper>
            :
            <Typography variant="h6" style={{margin:"20px 0 0 15px",color:'#FF0000'}}>{languageJson.allow_location}</Typography>
            }
            */}
            </div>

    )
}

export default Dashboard;