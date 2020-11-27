import React, { useState, useEffect } from 'react';
import {
    Typography,
    Paper,
} from '@material-ui/core';
import { useSelector } from "react-redux";
import { google_map_key } from "../config/keys";
import Map from '../components/Map';


const Dashboard = () => {
    const [mylocation, setMylocation] = useState(null);
    const [locations, setLocations] = useState([]);
    const usersdata = useSelector(state => state.usersdata);

    useEffect(()=>{
        if(mylocation == null){
            navigator.geolocation.getCurrentPosition(
                position => setMylocation({ 
                    lat: position.coords.latitude, 
                    lng: position.coords.longitude
                }), 
                err => console.log(err)
            );
        }
    },[mylocation]);
    
    useEffect(()=>{
        if(usersdata.users){
            const drivers = usersdata.users.filter(({ usertype }) => usertype === 'driver' );  
            let locs = [];
            for(let i=0;i<drivers.length;i++){
                if(drivers[i].approved && drivers[i].driverActiveStatus && drivers[i].location){
                    locs.push({
                        id:i,
                        lat:drivers[i].location.lat,
                        lng:drivers[i].location.lng,
                        angle:drivers[i].location.angle,
                        drivername:drivers[i].firstName + ' ' + drivers[i].lastName
                    });
                }
            }
            setLocations(locs);
        }
    },[usersdata.users]);

    return (
            <div>
            { mylocation?
            <Paper style={{marginTop:'25px'}}>
                <Typography variant="h6" style={{margin:"20px 0 0 15px"}}>Motoristas online</Typography>
                <Map mapcenter={mylocation} locations={locations}
                    googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + google_map_key + "&v=3.exp&libraries=geometry,drawing,places"}
                    loadingElement={<div style={{ height: `500` }} />}
                    containerElement={<div style={{ height: `500px` }} />}
                    mapElement={<div style={{ height: `500px` }} />}
                />
            </Paper>
            :
            <Typography variant="h6" style={{margin:"20px 0 0 15px",color:'#FF0000'}}>Habilitar localização</Typography>
            }
            </div>

    )
}

export default Dashboard;