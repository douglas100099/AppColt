import React, { useState, useEffect, useRef } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { isLive } from '../config/keys';
import {
  editUser, deleteUser, editDriver, blockUser, desblockUser
} from "../actions/usersactions";
import {
  sendNotificationForDriver
} from "../actions/notificationactions";

import NotificationAlert from "react-notification-alert";

import * as firebase from 'firebase'

import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  CardText,
  FormGroup,
  Label,
  Button,
  Row,
  Input,
  UncontrolledAlert,
  ListGroup,
  ListGroupItem,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Col
} from "reactstrap";
import Admin from 'layouts/Admin/Admin';

export default function Users() {

  const [indexModal, setModal] = useState(-1);
  const [indexModalBlock, setIdModalBlock] = useState(-1);
  const [edit, setEdit] = useState(-1);
  const [data, setData] = useState([]);
  const [cars, setCars] = useState({});
  const usersdata = useSelector(state => state.usersdata);
  const cartypes = useSelector(state => state.cartypes);
  const dispatch = useDispatch();

  const textInput = useRef(null);

  const setEditDrivers = (index) => {
    setEdit(index)
  }

  const toggle = (index) => {
    setModal(index)
  }

  const toggleModalBlock = (index) => {
    setIdModalBlock(index)
  }

  const closeModal = () => {
    setModal(-1)
  }

  const closeModalBlock = () => {
    setIdModalBlock(-1)
  }

  const blockDriver = (driverData, index) => {
    if (driverData.blocked_by_admin) {
      new Promise(resolve => {
        setTimeout(() => {
          resolve();
          dispatch(desblockUser(driverData.id));
        }, 600)
      }).then(() => {
        setIdModalBlock(-1)
        var options = {};
        options = {
          place: "tl",
          message: (
            <div>
              <div>
                Welcome to <b>Black Dashboard React</b> - a beautiful freebie for
                every web developer.
              </div>
            </div>
          ),
          type: "primary",
          icon: "tim-icons icon-bell-55",
          autoDismiss: 7
        };
        this.textInput.current.notificationAlert(options);
      })
    }
    else {
      let motivo = document.getElementById('InputModalBlock' + index).value
      if (motivo.length == 0) {
        alert("O motivo não pode estar em branco!")
      } else {
        new Promise(resolve => {
          setTimeout(() => {
            resolve()
            dispatch(blockUser(driverData.id, motivo));
          }, 600)
        }).then(() => {
          setIdModalBlock(-1)
          alert('Motorista bloqueado com sucesso!')
        })
      }
    }
  }

  const onSendNotify = (driverId, index) => {
    let notification = document.getElementById('ModalInputDesc' + index).value

    new Promise(resolve => {
      setTimeout(() => {
        resolve()
        dispatch(sendNotificationForDriver(notification, driverId));
      }, 600)
    }).then(() => {
      setModal(-1)
    })
  }

  const onHandlerCancell = (driverId) => {
    setEdit(-1)
  }

  useEffect(() => {
    if (usersdata.users) {
      const drivers = usersdata.users.filter(({ usertype }) => usertype === 'driver')
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
    { title: 'Perfil', field: 'driver_image', render: rowData => rowData.driver_image ? <img height={64} width={64} alt='Profile' src={rowData.driver_image} /> : null },
    { title: 'Nome', field: 'firstName', editComponent: props => (<Input type="email" name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Nome" />) },
    { title: 'Sobrenome', field: 'lastName', editComponent: props => (<Input type="email" name="name" value={props.value} id="exampleSobrenome" onChange={e => props.onChange(e.target.value)} placeholder="Sobrenome" />) },
    { title: 'Criado', field: 'createdAt', editable: 'never', defaultSort: 'desc', render: rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString('pt-BR') : null },
    { title: 'E-mail', field: 'email', editComponent: props => (<Input type="email" name="email" value={props.value} id="exampleEmail" onChange={e => props.onChange(e.target.value)} placeholder="E-mail" />) },
    { title: 'Celular', field: 'mobile', editComponent: props => (<Input type="email" name="number" value={props.value} id="exampleCelular" onChange={e => props.onChange(e.target.value)} placeholder="Celular" />) },
    { title: 'Modelo', field: 'vehicleModel', editComponent: props => (<Input type="email" name="name" value={props.value} id="exampleModelo" onChange={e => props.onChange(e.target.value)} placeholder="Modelo veículo" />) },
    { title: 'Placa', field: 'vehicleNumber', editComponent: props => (<Input type="email" name="name" value={props.value} id="examplePlaca" onChange={e => props.onChange(e.target.value)} placeholder="Placa" />) },
    { title: 'Categoria', field: 'carType', lookup: cars, editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>Colt econômico</option><option>Colt confort</option></Input>) },
    { title: 'Aprovado', field: 'approved', type: 'boolean' },
    { title: 'Apro CRLV', field: 'crlvAproved', lookup: { APROVADO: "APROVADO", REENVIE: "REENVIE", AGUARANDO: "AGUARANDO" }, editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>APROVADO</option><option>REENVIE</option><option>AGUARANDO</option></Input>) },
    { title: 'Apro CNH', field: 'cnhAproved', lookup: { APROVADO: "APROVADO", REENVIE: "REENVIE", AGUARANDO: "AGUARANDO" }, editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>APROVADO</option><option>REENVIE</option><option>AGUARANDO</option></Input>) },
    { title: 'Apro perfil', field: 'perfilAproved', lookup: { APROVADO: "APROVADO", REENVIE: "REENVIE", AGUARANDO: "AGUARANDO" }, editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>APROVADO</option><option>REENVIE</option><option>AGUARANDO</option></Input>) },
    { title: 'Online', field: 'driverActiveStatus', type: 'boolean' },
    { title: 'Ocupado', field: 'queue', type: 'boolean' },
    { title: 'Saldo', field: 'saldo', type: 'numeric', editable: 'never' },
    { title: 'Ref', field: 'signupViaReferral', type: 'boolean', editable: 'never' },
    { title: 'Ref ID', field: 'refferalId', editable: 'never' },
  ];

  const editUserDriver = (driverId, index) => {
    let objEditDriver = {}

    objEditDriver = {
      firstName: document.getElementById('nameDriver' + index).value,
      lastName: document.getElementById('sobNameDriver' + index).value,
      mobile: document.getElementById('celDriver' + index).value,
      cpfNum: document.getElementById('CpfDriver' + index).value,
      cnh: document.getElementById('CnhDriver' + index).value,
      dataNasc: document.getElementById('NascDriver' + index).value,
      renavam: document.getElementById('RenavamDriver' + index).value,
      vehicleModel: document.getElementById('VeiculoDriver' + index).value,
      vehicleNumber: document.getElementById('PlacaVeiculo' + index).value,
      corVeh: document.getElementById('CorVeiculo' + index).value,
      dataValidade: document.getElementById('VencimentoCnh' + index).value,
      //RatingDriver: document.getElementById('RatingDriver'+ index).value,
      obsDriver: document.getElementById('ObsDriver' + index).value,
    }

    new Promise(resolve => {
      setTimeout(() => {
        resolve();
        dispatch(editDriver(driverId, objEditDriver));
      }, 600);
    }).then(() => {
      setEdit(-1)
    })
  }

  

  return (
    usersdata.loading ? <CircularLoading /> :
      <>
        <div className="content">
          <div className="react-notification-alert-container">
            <NotificationAlert ref={textInput} />
          </div>
          <Row>
            <Col md="12">
              <Card>
                <CardHeader>
                  <CardTitle tag="h4">Todos os motoristas</CardTitle>
                </CardHeader>

                <CardBody>
                  <ListGroup horizontal style={{ flexDirection: 'row', overflowY: 'scroll' }}></ListGroup>
                  {data.map((driver, index) => (
                    <ListGroupItem key={index} style={{ marginRight: 15, marginBottom: 10 }}>
                      <Card>
                        <Row>
                          <Col sm='6' md='4' lg='2'>
                            <CardHeader className='text-center'>
                              <img alt='Profile' height={120} width={120} style={{ marginBottom: 10 }} src={driver.driver_image ? driver.driver_image : "https://i.imgur.com/8lteruf.png"} />
                              <CardTitle tag='h4' className='text-center' style={{ fontWeight: 500 }}>{driver.firstName + ' ' + driver.lastName}</CardTitle>
                              {driver.approved === true ?
                                <p className="h6 text-center text-success">APROVADO</p>
                                :
                                <p className="h6 text-center text-warning">AGUARANDO</p>
                              }
                              {driver.blocked_by_payment != null ?
                                <p className="h6 text-center text-danger">BLOQUEADO POR PGT</p> : null}
                              <p className="h6 text-center">{new Date(driver.createdAt).toLocaleDateString('pt-BR') + ' - '
                                + new Date(driver.createdAt).toLocaleTimeString('pt-BR').split(':')[0] + ':' + new Date(driver.createdAt).toLocaleTimeString('pt-BR').split(':')[1]}</p>
                              <div className='text-center' style={{ flexDirection: 'row' }}>
                                {
                                  driver.blocked_by_admin ?
                                    <CardText style={{ fontSize: 18 }} className="h6 text-center text-danger"> BLOQUEADO </CardText>
                                    : null
                                }

                                <Button className="btn-round btn-icon" color="primary" onClick={() => setEditDrivers(index)}>
                                  <i className="tim-icons icon-pencil" />
                                </Button>
                                <Button className="btn-round btn-icon" color="info" onClick={() => toggle(index)}>
                                  <i className="tim-icons icon-bell-55" />
                                </Button>
                                <Button className="btn-round btn-icon" color={driver.blocked_by_admin ? "success" : "danger"} onClick={() => toggleModalBlock(index)}>
                                  <i className={driver.blocked_by_admin ? "tim-icons icon-simple-add" : "tim-icons icon-simple-remove"} />
                                </Button>
                              </div>
                            </CardHeader>
                          </Col>
                          <Col sm='6' md='8' lg='10'>
                            <CardBody>
                              <form>
                                <Row>
                                  <Col lg='6'>
                                    <h4>Dados pessoais</h4>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"nameDriver" + index}>Nome</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.firstName}
                                          type="name"
                                          name="email"
                                          id={"nameDriver" + index}
                                          placeholder={driver.firstName}
                                        />
                                      </FormGroup>
                                    </Col>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"sobNameDriver" + index}>Sobrenome</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.lastName}
                                          type="name"
                                          name="email"
                                          id={"sobNameDriver" + index}
                                          placeholder={driver.lastName}
                                        />
                                      </FormGroup>
                                    </Col>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"celDriver" + index}>Celular</Label>
                                        <Input
                                          disabled
                                          defaultValue={driver.mobile}
                                          name="email"
                                          id={"celDriver" + index}
                                          placeholder={driver.mobile}
                                        />
                                      </FormGroup>
                                    </Col>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"CpfDriver" + index}>CPF</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.cpfNum}
                                          name="email"
                                          id={"CpfDriver" + index}
                                          placeholder={driver.cpfNum}
                                        />
                                      </FormGroup>
                                    </Col>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"CnhDriver" + index}>CNH</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.cnh}
                                          name="email"
                                          id={"CnhDriver" + index}
                                          placeholder={driver.cnh}
                                        />
                                      </FormGroup>
                                    </Col>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"NascDriver" + index}>Data de Nascimento</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.dataNasc}
                                          name="email"
                                          id={"NascDriver" + index}
                                          placeholder={new Date(driver.dataNasc)}
                                        />
                                      </FormGroup>
                                    </Col>
                                  </Col>
                                  <Col lg='6'>
                                    <h4>Dados do Veículo</h4>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"RenavamDriver" + index}>RENAVAM</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.renavam}
                                          name="email"
                                          id={"RenavamDriver" + index}
                                          placeholder={driver.renavam}
                                        />
                                      </FormGroup>
                                    </Col>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"VeiculoDriver" + index}>Modelo do Veículo</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.vehicleModel}
                                          name="email"
                                          id={"VeiculoDriver" + index}
                                          placeholder={driver.vehicleModel}
                                        />
                                      </FormGroup>
                                    </Col>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"PlacaVeiculo" + index}>Placa do Veículo</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.vehicleNumber}
                                          name="email"
                                          id={"PlacaVeiculo" + index}
                                          placeholder={driver.vehicleNumber}
                                        />
                                      </FormGroup>
                                    </Col>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"CorVeiculo" + index}>Cor do Veículo</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.corVeh}
                                          name="email"
                                          id={"CorVeiculo" + index}
                                          placeholder={driver.corVeh}
                                        />
                                      </FormGroup>
                                    </Col>
                                    <Col lg='12'>
                                      <FormGroup>
                                        <Label for={"}VencimentoCnh" + index}>Vencimento CNH</Label>
                                        <Input
                                          disabled={edit === index ? false : true}
                                          defaultValue={driver.dataValidade}
                                          name="email"
                                          id={"VencimentoCnh" + index}
                                          placeholder={driver.dataValidade}
                                        />
                                      </FormGroup>
                                    </Col>
                                  </Col>
                                </Row>
                                <h4>Outras informações</h4>
                                <Row>
                                  <Col lg='4'>
                                    <FormGroup>
                                      <Label for={"SaldoDriver" + index}>Saldo</Label>
                                      <Input
                                        disabled
                                        defaultValue={driver.saldo ? driver.saldo : '0'}
                                        name="email"
                                        id={"SaldoDriver" + index}
                                        placeholder={driver.saldo ? driver.saldo : '0'}
                                      />
                                    </FormGroup>
                                  </Col>
                                  <Col lg='4'>
                                    <FormGroup>
                                      <Label for={"RatingDriver" + index}>Avaliação</Label>
                                      <Input
                                        disabled={edit === index ? false : true}
                                        defaultValue={driver.ratings ? driver.ratings.userrating : "5.00"}
                                        name="email"
                                        id={"RatingDriver" + index}
                                        placeholder={driver.ratings ? driver.ratings.userrating : "5.00"}
                                      />
                                    </FormGroup>
                                  </Col>
                                  <Col lg='12'>
                                    <FormGroup>
                                      <Label for={"ObsDriver" + index}>Adicionar Observação</Label>
                                      <Input
                                        disabled={edit === index ? false : true}
                                        defaultValue={driver.obsDriver ? driver.obsDriver : ""}
                                        name="email"
                                        id={"ObsDriver" + index}
                                        placeholder='Adicionar uma observação'
                                      />
                                    </FormGroup>
                                  </Col>
                                </Row>
                              </form>
                              <div>
                                {/* MODAL PRA ENVIAR NOTIFICACAO */}
                                <Modal isOpen={index === indexModal} backdrop={true} toggle={closeModal} id={"Modal" + index}>
                                  <ModalHeader toggle={closeModal}><span style={{ fontSize: 18 }}>Enviar notificação pro motorista <a style={{ fontSize: 18, fontWeight: 600 }}>{driver.firstName}</a></span></ModalHeader>
                                  <ModalBody>
                                    <Label for={"Modal" + index} style={{ marginTop: 10 }}> Descrição </Label>
                                    <Input
                                      style={{ color: "#000", fontSize: 16, }}
                                      defaultValue={""}
                                      name="descNotificacao"
                                      id={"ModalInputDesc" + index}
                                      placeholder='Digite a descrição'
                                    />
                                  </ModalBody>
                                  <ModalFooter>
                                    <Button color="secondary" onClick={closeModal}>Cancelar</Button>
                                    {' '}
                                    <Button color="primary" onClick={() => onSendNotify(driver.id, index)}>Enviar</Button>
                                  </ModalFooter>
                                </Modal>
                              </div>

                              {/* MODAL PRA BLOQUEAR MOTORISTA */}
                              <div>
                                <Modal isOpen={index === indexModalBlock} backdrop={true} toggle={closeModalBlock} id={"ModalBlock" + index}>

                                  {driver.blocked_by_admin ?
                                    <ModalHeader ><span style={{ fontSize: 18, marginTop: 20 }}>Deseja desbloquear o motorista
                                  <a style={{ fontSize: 18, fontWeight: 600 }}> {driver.firstName + ' ' + driver.lastName} </a>?</span></ModalHeader>
                                    :
                                    <ModalHeader ><span style={{ fontSize: 18, marginTop: 20 }}>Tem certeza que deseja bloquear o motorista
                                  <a style={{ fontSize: 18, fontWeight: 600 }}> {driver.firstName + ' ' + driver.lastName} </a>?</span></ModalHeader>
                                  }

                                  {!driver.blocked_by_admin ?
                                    <ModalBody>
                                      <Label for={"ModalBlock" + index}> Motivo </Label>
                                      <Input
                                        style={{ color: "#000", fontSize: 16 }}
                                        defaultValue={""}
                                        name="InputModalBlock"
                                        id={"InputModalBlock" + index}
                                        placeholder='Digite o motivo'
                                      />
                                    </ModalBody>
                                    : null}
                                  <ModalFooter>
                                    <Button color="secondary" onClick={closeModalBlock}>Cancelar</Button>
                                    {' '}
                                    <Button color="danger" onClick={() => blockDriver(driver, index)}>{driver.blocked_by_admin ? "Desbloquear" : "Bloquear"}</Button>
                                  </ModalFooter>
                                </Modal>
                              </div>

                              {edit !== -1 && edit === index ?
                                <div className='text-right'>
                                  <Button color="danger" className="animation-on-hover" onClick={() => onHandlerCancell(driver.id)}>
                                    Cancelar
                                  </Button>
                                  <Button color="success" className="animation-on-hover" onClick={() => editUserDriver(driver.id, index)} >
                                    Salvar
                                </Button>
                                </div>
                                : null}
                            </CardBody>
                          </Col>
                        </Row>
                      </Card>
                    </ListGroupItem>
                  ))}
                  {/*<MaterialTable
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
                  />*/}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </>
  );
}
