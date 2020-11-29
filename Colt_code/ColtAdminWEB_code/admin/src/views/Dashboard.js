
import React, { useState, useEffect } from 'react';
// nodejs library that concatenates classes
import classNames from "classnames";
import { useSelector } from "react-redux";
// react plugin used to create charts
import { Line, Bar } from "react-chartjs-2";

// reactstrap components
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  Label,
  FormGroup,
  Input,
  Table,
  Row,
  Col,
  UncontrolledTooltip
} from "reactstrap";
import MaterialTable from 'material-table';

// core components
import {
  chartExample1,
  chartExample2,
  chartExample3,
  chartExample4
} from "variables/charts.js";

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
  const [corridasAceitasHj, setCorridasAceitas] = useState(0);
  const [corridasCanceladasHj, setCorridasCanceladas] = useState(0);
  const [corridasAndamentoHj, setCorridasAndamento] = useState(0);

  const [monthlytaxa, setMonthlytaxa] = useState(0);
  const [dailytaxa, setDailytaxa] = useState(0);
  const [totaltaxa, setTotaltaxa] = useState(0);

  const [settings, setSettings] = useState({});

  const usersdata = useSelector(state => state.usersdata);
  const bookinglistdata = useSelector(state => state.bookinglistdata);
  const settingsdata = useSelector(state => state.settingsdata);

  const columns = [
    { title: 'Foto', field: 'imageRider', render: rowData => rowData.imageRider ? <img alt='Profile' src={rowData.imageRider} style={{ width: 50, borderRadius: '50%' }} /> : null },
    { title: 'Foto', field: 'driver_image', render: rowData => rowData.driver_image ? <img alt='Profile' src={rowData.driver_image} style={{ width: 50, borderRadius: '50%' }} /> : null },
  ]

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
      setTotalMotorista(totalOnline);
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
      //
      let tdCorridasAceitas = 0;
      let tdCorridasCanceladas = 0;
      let tdCorridasAndamento = 0;
      //
      for (let i = 0; i < bookinglistdata.bookings.length; i++) {
        const { tripdate, status } = bookinglistdata.bookings[i]
        const { trip_cost, discount_amount, convenience_fees } = bookinglistdata.bookings[i].pagamento;
        let tDate = new Date(tripdate);
        if (trip_cost >= 0 && discount_amount >= 0) {
          if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
            tdTrans = tdTrans + trip_cost + discount_amount;
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
        } if(status === "END"){
          if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
            tdCorridasAceitas++
          }
        } if(status === "CANCELLED"){
          if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
            tdCorridasCanceladas++
          }
        } if(status === "ACCEPTED" || status === "START" || status === "EMBARQUE"){
          if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
            tdCorridasAndamento++
          }
        } if(status === "ACCEPTED" || status === "START" || status === "EMBARQUE" || status === "NEW"){
          if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
            corridasHoje++
          }
        }
      }

      if (bookinglistdata.bookings) {
        let solicitandoCarro = [];
        let emCorrida = [];
        for (let i = 0; i < bookinglistdata.bookings.length; i++) {
          const { status } = bookinglistdata.bookings[i]
          if (status === "NEW") {
            solicitandoCarro.push(bookinglistdata.bookings[i])
          }
          if (status === "START" || status === "EMBARQUE" || status === "ACCEPTED") {
            emCorrida.push(bookinglistdata.bookings[i])
          }
        }
        setData2(emCorrida);
        setData(solicitandoCarro);
      }

      setCorridasHoje(corridasHoje);
      setCorridasMes(corridasMes);
      setCorridasTotais(totalCorridas);

      setCorridasAceitas(tdCorridasAceitas);
      setCorridasCanceladas(tdCorridasCanceladas);
      setCorridasAndamento(tdCorridasAndamento);

      setDailygross(parseFloat(tdTrans).toFixed(2));
      setMonthlygross(parseFloat(mnTrans).toFixed(2));
      setTotalgross(parseFloat(totTrans).toFixed(2));

      setDailytaxa(parseFloat(todayConvenience).toFixed(2));
      setMonthlytaxa(parseFloat(convenniencefees).toFixed(2));
      setTotaltaxa(parseFloat(totconvenienceTrans).toFixed(2));
    }
  }, [bookinglistdata.bookings]);

  return (
    <>
      <div className="content">
        {/*<Row>
          <Col xs="12">
            <Card className="card-chart">
              <CardHeader>
                <Row>
                  <Col className="text-left" sm="6">
                    <h5 className="card-category">Resumo</h5>
                    <CardTitle tag="h2">{driverOnline}</CardTitle>
                  </Col>
                  <Col sm="6">
                    <ButtonGroup
                      className="btn-group-toggle float-right"
                      data-toggle="buttons"
                    >
                      <Button
                        tag="label"
                        className={classNames("btn-simple")}
                        color="info"
                        id="0"
                        size="sm"
                        onClick={() => this.setBgChartData("data1")}
                      >
                        <input
                          defaultChecked
                          className="d-none"
                          name="options"
                          type="radio"
                        />
                        <span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
                          Ganhos
                          </span>
                        <span className="d-block d-sm-none">
                          <i className="tim-icons icon-single-02" />
                        </span>
                      </Button>
                      <Button
                        color="info"
                        id="1"
                        size="sm"
                        tag="label"
                        className={classNames("btn-simple")}
                        onClick={() => this.setBgChartData("data2")}
                      >
                        <input
                          className="d-none"
                          name="options"
                          type="radio"
                        />
                        <span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
                          Corridas
                          </span>
                        <span className="d-block d-sm-none">
                          <i className="tim-icons icon-gift-2" />
                        </span>
                      </Button>
                      <Button
                        color="info"
                        id="2"
                        size="sm"
                        tag="label"
                        className={classNames("btn-simple")}
                        onClick={() => this.setBgChartData("data3")}
                      >
                        <input
                          className="d-none"
                          name="options"
                          type="radio"
                        />
                        <span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
                          Lucros
                          </span>
                        <span className="d-block d-sm-none">
                          <i className="tim-icons icon-tap-02" />
                        </span>
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>*/}
        <Row>
          <Col lg="4">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Corridas</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-paper text-info" />{" "}
                  {corridasHoje}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Line
                    data={chartExample4.data}
                    options={chartExample4.options}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Movimentação</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-coins text-primary" /> R$ {dailygross}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Line
                    data={chartExample4.data}
                    options={chartExample4.options}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Ganhos</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-money-coins text-success" /> R$ {dailytaxa}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Line
                    data={chartExample4.data}
                    options={chartExample4.options}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg="2">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Motoristas online</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-single-02 text-success" /> {driverOnline + ' / ' + totalOnline}
                </CardTitle>
              </CardHeader>
            </Card>
          </Col>
          <Col lg="2">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Clientes</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-single-02 text-warning" /> {totalClientes}
                </CardTitle>
              </CardHeader>
            </Card>
          </Col>
          <Col lg="2" md="12">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Corridas ao vivo</h5>
                <CardTitle tag="h3" className="text-right">
                  <i className="text-primary" /> {corridasAndamentoHj}
                </CardTitle>
              </CardHeader>
            </Card>
          </Col>
          <Col lg="2" md="12">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Corridas aceitas</h5>
                <CardTitle tag="h3" className="text-right">
                  <i className="text-primary" /> {corridasAceitasHj}
                </CardTitle>
              </CardHeader>
            </Card>
          </Col>
          <Col lg="2" md="12">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Corridas negadas</h5>
                <CardTitle tag="h3" className="text-right">
                  <i className="text-primary" /> {corridasCanceladasHj}
                </CardTitle>
              </CardHeader>
            </Card>
          </Col>
          <Col lg="2" md="12">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Corridas não atendidas</h5>
                <CardTitle tag="h3" className="text-right">
                  <i className="text-primary" /> {corridasCanceladasHj}
                </CardTitle>
              </CardHeader>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col lg="6" md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Solicitando carro</CardTitle>
              </CardHeader>
              <CardBody>
                <MaterialTable
                  columns={columns}
                  data={data.reverse()}
                  options={{
                    actionsColumnIndex: -1,
                    header: false,
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
                    rowStyle: {
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontFamily: "Poppins",
                      fontSize: 14,
                      lineHeight: 1.5,
                    },
                    showTitle: false,
                    search: false,
                  }}
                  style={{
                    backgroundColor: '#27293d',
                    fontFamily: "Poppins",
                  }}
                />
              </CardBody>
            </Card>
          </Col>
          <Col lg="6" md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Corridas em andamento</CardTitle>
              </CardHeader>
              <CardBody>
                <MaterialTable
                  columns={columns}
                  data={data.reverse()}
                  options={{
                    actionsColumnIndex: -1,
                    header: false,
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
                    rowStyle: {
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontFamily: "Poppins",
                      fontSize: 14,
                      lineHeight: 1.5,
                    },
                    //columnsButton: true,
                    showTitle: false,
                    search: false,
                  }}
                  style={{
                    backgroundColor: '#27293d',
                    fontFamily: "Poppins",
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

export default Dashboard;
