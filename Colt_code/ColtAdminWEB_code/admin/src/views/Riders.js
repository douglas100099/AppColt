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


export default function Riders() {
  const [data, setData] = useState([]);
  const usersdata = useSelector(state => state.usersdata);
  const dispatch = useDispatch();

  useEffect(()=>{
    if(usersdata.users){
      const rider = usersdata.users.filter(({ usertype }) => usertype === 'rider' )
      for(let i=0;i<rider.length;i++){
        setData(rider);
      }
    }
  },[usersdata.users]);

  const columns = [
      { title: languageJson.createdAt, field: 'createdAt', editable:'never', defaultSort:'desc',render: rowData => rowData.createdAt?new Date(rowData.createdAt).toLocaleString(dateStyle):null},
      { title: languageJson.first_name, field: 'firstName', editable:'never'},
      { title: languageJson.last_name, field: 'lastName', editable:'never'},
      { title: languageJson.email, field: 'email'},
      { title: languageJson.mobile, field: 'mobile'},
      { title: languageJson.profile_image,  field: 'profile_image',render: rowData => rowData.profile_image?<img alt='Profile' src={rowData.profile_image} style={{width: 50,borderRadius:'50%'}}/>:null},
      { title: 'Saldo carteira',  field: 'walletBalance', type:'numeric', editable:'never'},
      { title: languageJson.signup_via_refferal, field: 'signupViaReferral', type:'boolean'},
      { title: languageJson.refferal_id,  field: 'refferalId', editable:'never'},
  ];

  return (
    usersdata.loading? <CircularLoading/>:
    <MaterialTable
      title='Todos passageiros'
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
