import React,{ useState,useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import  languageJson  from "../config/language";
import {
     editUser, deleteUser
  }  from "../actions/usersactions";
import {isLive} from '../config/keys';
import dateStyle from '../config/dateStyle';


export default function Users() {
  const [data, setData] = useState([]);
  const [cars, setCars] = useState({});
  const usersdata = useSelector(state => state.usersdata);
  const cartypes = useSelector(state => state.cartypes);
  const dispatch = useDispatch();

  useEffect(()=>{
    if(usersdata.users){
      const drivers = usersdata.users.filter(({ usertype }) => usertype === 'driver' )
      for(let i=0;i<drivers.length;i++){
        setData(drivers);
      }
    }
  },[usersdata.users]);

  useEffect(()=>{
    if(cartypes.cars){
        let obj =  {};
        cartypes.cars.map((car)=> obj[car.name]=car.name)
        setCars(obj);
    }
  },[cartypes.cars]);


  const columns = [
      { title: 'Criado', field: 'createdAt', editable:'never', defaultSort:'desc',render: rowData => rowData.createdAt?new Date(rowData.createdAt).toLocaleString(dateStyle):null},
      { title: 'Nome', field: 'firstName', editable:'never'},
      { title: 'Sobrenome', field: 'lastName', editable:'never'},
      { title: languageJson.email, field: 'email'},
      { title: languageJson.mobile, field: 'mobile'},
      { title: 'Perfil',  field: 'driver_image',render: rowData => rowData.driver_image?<img height={80} width={80} alt='Profile' src={rowData.driver_image} style={{borderRadius:'50%'}}/>:null},
      { title: 'Modelo', field: 'vehicleModel'},
      { title: 'Placa', field: 'vehicleNumber'},
      { title: 'Categoria', field: 'carType',lookup: cars},
      { title: 'Aprovado',  field: 'approved', type:'boolean'},
      { title: 'Aprovar CRLV',  field: 'crlvAproved', lookup: {APROVADO: "APROVADO", REENVIE: "REENVIE", AGUARANDO: "AGUARANDO" }},
      { title: 'Aprovar CNH',  field: 'cnhAproved', lookup: {APROVADO: "APROVADO", REENVIE: "REENVIE", AGUARANDO: "AGUARANDO" }},
      { title: 'Aprovar perfil',  field: 'perfilAproved', lookup: {APROVADO: "APROVADO", REENVIE: "REENVIE", AGUARANDO: "AGUARANDO" }},
      { title: 'Online',  field: 'driverActiveStatus', type:'boolean'},
      { title: 'CNH',  field: 'licenseImage',render: rowData => rowData.licenseImage?<img alt='License' src={rowData.licenseImage} style={{width: 100, borderRadius: 100, height: 100}}/>:null},
      { title: 'CRLV',  field: 'imagemCrlv',render: rowData => rowData.imagemCrlv?<img alt='License' src={rowData.imagemCrlv} style={{width: 100, borderRadius: 100, height: 100}}/>:null},
      { title: 'Saldo',  field: 'saldo', type:'numeric', editable:'never'},
      { title: 'Ref', field: 'signupViaReferral', type:'boolean', editable:'never'},
      { title: 'Ref ID',  field: 'refferalId', editable:'never'},
      { title: 'Ocupado',  field: 'queue', type:'boolean'},
  ];

  return (
    usersdata.loading? <CircularLoading/>:
    <MaterialTable
      title='Todos motoristas'
      columns={columns}
      data={data}
      options={{
        exportButton: true,
        sorting: true,
      }}
      editable={{
        onRowUpdate: (newData, oldData) =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve();
              dispatch(editUser(oldData.id,newData));
            }, 600);
          }),
        onRowDelete: oldData =>
          isLive?
          new Promise(resolve => {
            setTimeout(() => {
              resolve();
              dispatch(deleteUser(oldData.id));
            }, 600);
          })
          :
          new Promise(resolve => {
            setTimeout(() => {
              resolve();
              alert('Restricted in Demo App.');
            }, 600);
          })
          , 
      }}
    />
  );
}
