import React,{ useState,useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import {
     editUser, deleteUser
  }  from "../actions/usersactions";
import {isLive} from '../config/keys';
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Table,
    Row,
    Input,
    Col
  } from "reactstrap";

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
      { title: 'Perfil',  field: 'profile_image',render: rowData => rowData.profile_image?<img alt='Profile' height={64} width={64} src={rowData.profile_image}/>:null},
      { title: 'Nome', field: 'firstName', editable:'never',},
      { title: 'Sobrenome', field: 'lastName', editable:'never'},
      { title: 'Criado em', field: 'createdAt', editable:'never', defaultSort:'desc',render: rowData => rowData.createdAt?new Date(rowData.createdAt).toLocaleString('pt-BR'):null},
      { title: 'Email', field: 'email', editComponent: props => (<Input type="email" name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Email"/>)},
      { title: 'Celular', field: 'mobile', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Celular"/>)},
      { title: 'Saldo carteira',  field: 'walletBalance', type:'numeric', editComponent: props => (<Input type="number" name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Saldo carteira"/>)},
      { title: 'Ref', field: 'signupViaReferral', type:'boolean'},
      { title: 'Ref ID',  field: 'refferalId', editComponent: props => (<Input type="email" name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Ref"/>)},
  ];

  return (
    usersdata.loading? <CircularLoading/>:
    <>
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Passageiros</CardTitle>
            </CardHeader>
            <CardBody>
              <MaterialTable
                columns={columns}
                data={data.reverse()}
                options={{
                  actionsColumnIndex: -1,
                  header: true,
                  exportButton: true,
                  sorting: true,
                  columnsButton: true,
                  headerStyle: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    backgroundColor: '#27293d',
                    fontFamily: "Poppins",
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: 1.5,
                    borderWidth: 0.2,
                    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  actionsCellStyle:{
                    color: 'rgba(255, 255, 255, 0.9)',
                  },
                  editCellStyle:{
                    color: 'rgba(255, 255, 255, 0.9)',
                  },
                  filterCellStyle:{
                    color: 'rgba(255, 255, 255, 0.9)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  searchFieldStyle:{
                    color: 'rgba(255, 255, 255, 0.9)',
                  },
                  showTitle: false,
                  search: true,
                  rowStyle: {
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: "Poppins",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }
                }}
                style={{
                  backgroundColor: '#27293d',
                  fontFamily: "Poppins",
                }}
                editable={{
                  onRowUpdate: (newData, oldData) =>
                    new Promise(resolve => {
                      setTimeout(() => {
                        resolve();
                        dispatch(editUser(oldData.id, newData));
                      }, 600);
                    }),
                  onRowDelete: oldData =>
                    isLive ?
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
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  </>
  );
}
