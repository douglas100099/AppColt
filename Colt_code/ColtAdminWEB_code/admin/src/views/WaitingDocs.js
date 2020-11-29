import React, { useState, useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { isLive } from '../config/keys';
import {
  editUser, deleteUser
} from "../actions/usersactions";

import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Input,
  Col
} from "reactstrap";

export default function WaitingDocs() {

  const [data, setData] = useState([]);
  const [cars, setCars] = useState({});
  const usersdata = useSelector(state => state.usersdata);
  const cartypes = useSelector(state => state.cartypes);
  const dispatch = useDispatch();

  useEffect(() => {
    if (usersdata.users) {
      const drivers = usersdata.users.filter(({ usertype, approved}) => usertype === 'driver' && approved === false)
      for (let i = 0; i < drivers.length; i++) {
        setData(drivers);
      }
    }
  }, [usersdata.users]);

  useEffect(() => {
    if (cartypes.cars) {
      let obj = {};
      cartypes.cars.map((car) => obj[car.name] = car.name)
      setCars(obj);
    }
  }, [cartypes.cars]);

  const columns = [
    { title: 'Criado', field: 'createdAt', editable: 'never', defaultSort: 'desc', render: rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString('pt-BR') : null },
    { title: 'Perfil',  field: 'driver_image', render: rowData => rowData.driver_image ? <img height={64} width={64} alt='Profile' src={rowData.driver_image} /> : null },
    { title: 'Nome', field: 'firstName', editComponent: props => (<Input type="email" name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Nome"/>)},
    { title: 'Sobrenome', field: 'lastName', editComponent: props => (<Input type="email" name="name" value={props.value} id="exampleSobrenome" onChange={e => props.onChange(e.target.value)} placeholder="Sobrenome"/>)},
    { title: 'CNH',  field: 'licenseImage',render: rowData => rowData.licenseImage?<img height={64} width={64} alt='License' src={rowData.licenseImage}/>:null},
    { title: 'CRLV',  field: 'imagemCrlv',render: rowData => rowData.imagemCrlv?<img height={64} width={64} alt='License' src={rowData.imagemCrlv}/>:null},
    { title: 'E-mail', field: 'email', editComponent: props => (<Input type="email" name="email" value={props.value} id="exampleEmail" onChange={e => props.onChange(e.target.value)} placeholder="E-mail"/>)},
    { title: 'Celular', field: 'mobile', editComponent: props => (<Input type="email" name="number" value={props.value} id="exampleCelular" onChange={e => props.onChange(e.target.value)} placeholder="Celular"/>)},
    { title: 'Modelo', field: 'vehicleModel', editComponent: props => (<Input type="email" name="name" value={props.value} id="exampleModelo" onChange={e => props.onChange(e.target.value)} placeholder="Modelo veículo"/>)},
    { title: 'Placa', field: 'vehicleNumber', editComponent: props => (<Input type="email" name="name" value={props.value} id="examplePlaca" onChange={e => props.onChange(e.target.value)} placeholder="Placa"/>)},
    { title: 'Categoria', field: 'carType',lookup: cars, editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>Colt econômico</option><option>Colt confort</option></Input>)},
    { title: 'Nº CPF', field: 'cpfNum', editComponent: props => (<Input type="number" name="name" value={props.value} id="examplePlaca" onChange={e => props.onChange(e.target.value)} placeholder="CPF"/>)},
    { title: 'Nº CNH', field: 'cnh', editComponent: props => (<Input type="number" name="name" value={props.value} id="examplePlaca" onChange={e => props.onChange(e.target.value)} placeholder="CNH"/>)},
    { title: 'Renavam', field: 'renavam', editComponent: props => (<Input type="number" name="name" value={props.value} id="examplePlaca" onChange={e => props.onChange(e.target.value)} placeholder="RENAVAM"/>)},
    { title: 'Venc. CNH', field: 'dataValidade', editComponent: props => (<Input type="number" name="name" value={props.value} id="examplePlaca" onChange={e => props.onChange(e.target.value)} placeholder="Validade CNH"/>)},
    { title: 'Data Nascimento', field: 'dataNasc', editComponent: props => (<Input type="number" name="name" value={props.value} id="examplePlaca" onChange={e => props.onChange(e.target.value)} placeholder="Data Nascimento"/>)},
    { title: 'Aprovado',  field: 'approved', type:'boolean'},
    { title: 'Apro CRLV',  field: 'crlvAproved', lookup: {APROVADO: "APROVADO", REENVIE: "REENVIE", AGUARANDO: "AGUARANDO" }, editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>APROVADO</option><option>REENVIE</option><option>AGUARANDO</option></Input>) },
    { title: 'Apro CNH',  field: 'cnhAproved', lookup: {APROVADO: "APROVADO", REENVIE: "REENVIE", AGUARANDO: "AGUARANDO" }, editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>APROVADO</option><option>REENVIE</option><option>AGUARANDO</option></Input>)},
    { title: 'Apro perfil',  field: 'perfilAproved', lookup: {APROVADO: "APROVADO", REENVIE: "REENVIE", AGUARANDO: "AGUARANDO" }, editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>APROVADO</option><option>REENVIE</option><option>AGUARANDO</option></Input>)},
  ];

  return (
    usersdata.loading ? <CircularLoading /> :
      <>
        <div className="content">
          <Row>
            <Col md="12">
              <Card>
                <CardHeader>
                  <CardTitle tag="h4">Aguardando aprovação</CardTitle>
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
