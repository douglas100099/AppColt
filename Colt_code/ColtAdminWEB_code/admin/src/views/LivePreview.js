import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import { google_map_key } from "../config/keys";
import Map from '../components/Map';
import CircularLoading from "../components/CircularLoading";
import { Card, CardHeader, CardBody, Row, Col, CardTitle, CardText, ListGroup, ListGroupItem, ListGroupItemText, CardImg } from "reactstrap";


const Dashboard = () => {
  const [mylocation, setMylocation] = useState(null);
  const [bookingList, setData] = useState([]);
  const [locations, setLocations] = useState([]);
  const usersdata = useSelector(state => state.usersdata);
  const bookinglistdata = useSelector(state => state.bookinglistdata);

  const [dataOnline, setDataOnline] = useState([]);
  const [dataEst, setDataEst] = useState([]);
  const [driverOnline, setLocationsDriver] = useState(0);
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
  const [corridasNatendidasHj, setCorridasNatendidas] = useState(0);
  const [corridasAndamentoHj, setCorridasAndamento] = useState(0);

  const [monthlytaxa, setMonthlytaxa] = useState(0);
  const [dailytaxa, setDailytaxa] = useState(0);
  const [totaltaxa, setTotaltaxa] = useState(0);

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
      let tdCorridasNatendidas = 0;
      let totalCorridas = 0;
      //
      let tdCorridasAceitas = 0;
      let tdCorridasCanceladas = 0;
      let tdCorridasAndamento = 0;
      //
      for (let i = 0; i < bookinglistdata.bookings.length; i++) {
        const { tripdate, status, requestedDriver, rejectedDrivers } = bookinglistdata.bookings[i]
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
        } if (status === "END") {
          if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
            tdCorridasAceitas++
          }
        } if (status === "CANCELLED") {
          if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
            tdCorridasCanceladas++
            if (!requestedDriver && !rejectedDrivers) {
              tdCorridasNatendidas++
            }
          }
        } if (status === "ACCEPTED" || status === "START" || status === "EMBARQUE") {
          if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
            tdCorridasAndamento++
          }
        } if (status === "ACCEPTED" || status === "START" || status === "EMBARQUE" || status === "NEW" || status === "END" || status === "CANCELLED") {
          if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
            corridasHoje++
          }
        }
      }
      setCorridasHoje(corridasHoje);
      setCorridasMes(corridasMes);
      setCorridasTotais(totalCorridas);

      setCorridasAceitas(tdCorridasAceitas);
      setCorridasNatendidas(tdCorridasNatendidas);
      setCorridasCanceladas(tdCorridasCanceladas);
      setCorridasAndamento(tdCorridasAndamento);

      setDailygross(parseFloat(tdTrans).toFixed(2));
      setMonthlygross(parseFloat(mnTrans).toFixed(2));
      setTotalgross(parseFloat(totTrans).toFixed(2));

      setDailytaxa(parseFloat(todayConvenience).toFixed(2));
      setMonthlytaxa(parseFloat(convenniencefees).toFixed(2));
      setTotaltaxa(parseFloat(totconvenienceTrans).toFixed(2));
      setData(bookinglistdata.bookings);
    }
  }, [bookinglistdata.bookings]);

  useEffect(() => {
    if (usersdata.users) {
      const drivers = usersdata.users.filter(({ usertype }) => usertype === 'driver');
      let locs = [];
      for (let i = 0; i < drivers.length; i++) {
        if (drivers[i].approved && drivers[i].driverActiveStatus && drivers[i].location) {
          locs.push({
            id: i,
            lat: drivers[i].location.lat,
            lng: drivers[i].location.lng,
            angle: drivers[i].location.angle,
            drivername: drivers[i].firstName + ' ' + drivers[i].lastName
          });
        }
      }
      setLocations(locs);
    }
  }, [usersdata.users]);

  return (
    bookinglistdata.loading ? <CircularLoading /> :
      <>
        <div className="content">
          <Row>
            <Col md="3" xs="6">
              <Card className="card-chart" style={{ height: 120 }}>
                <CardHeader>
                  <h5 className="card-category">Corridas</h5>
                  <CardTitle tag="h3" className="text-center">
                    <i className="text-primary" /> {corridasHoje}
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <h5 className="title">{corridasAceitasHj} Aceitas</h5>
                </CardBody>
              </Card>
            </Col>
            <Col md="3" xs="6">
              <Card className="card-chart" style={{ height: 120 }}>
                <CardHeader>
                  <h5 className="card-category">Valor</h5>
                  <CardTitle tag="h3" className="text-center">
                    <i className="text-primary" />R$ {dailygross}
                </CardTitle>
                </CardHeader>
              </Card>
            </Col>
            <Col md="3" xs="6">
              <Card className="card-chart" style={{ height: 120 }}>
                <CardHeader>
                  <h5 className="card-category">Forma de PGT</h5>
                </CardHeader>
                <CardBody tag="h6" className="text-center" style={{ justifyContent: 'center' }}>
                  <CardText>130 Dinheiro</CardText>
                  <CardText>22 Cartão</CardText>
                  <CardText>2 Carteira/Din</CardText>
                </CardBody>
              </Card>
            </Col>
            <Col md="3" xs="6">
              <Card className="card-chart" style={{ height: 120 }}>
                <CardHeader>
                  <h5 className="card-category">Canceladas</h5>
                  <CardTitle tag="h3" className="text-center">
                    <i className="text-primary" /> {corridasCanceladasHj}
                </CardTitle>
                </CardHeader>
              </Card>
            </Col>
            <Col md="12">
              <Card className="card-plain">
                <CardBody>
                  <div
                    id="map"
                    className="map"
                    style={{ position: "relative", overflow: "hidden" }}
                  >
                    <Map mapcenter={mylocation} locations={locations}
                      googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + google_map_key + "&v=3.exp&libraries=geometry,drawing,places"}
                      loadingElement={<div style={{ height: `100%` }} />}
                      containerElement={<div style={{ height: `100%` }} />}
                      mapElement={<div style={{ height: `100%` }} />}
                    />
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col lg='12'>
              <ListGroup horizontal style={{ flexDirection: 'row', overflowX: 'scroll', height: 280 }}>
                {bookingList.map((booking, index) => (
                  booking.status === 'EMBARQUE' || booking.status === 'START' || booking.status === 'ACCEPTED' || booking.status === 'NEW' ?
                    <ListGroupItem key={index} style={{ marginRight: 15, marginBottom: 10 }}>
                      <Card style={{ width: 220, height: 220 }}>
                        {booking.status === 'NEW' ?
                          <Row>
                            <Col lg='6' className='text-center'>
                              <img alt='Profile' height={32} width={32} src={booking.imageRider ? booking.imageRider : "https://i.imgur.com/8lteruf.png"} />
                              <CardTitle tag='h6'>{booking.firstNameRider}</CardTitle>
                            </Col>
                            <Col lg='6' className='text-center'>
                              <img alt='Profile' height={32} width={32} style={{ borderRadius: 50 }} src={booking.driver_image ? booking.driver_image : "https://i.imgur.com/8lteruf.png"} />
                              <CardTitle tag='h6'>{booking.driver_firstName}</CardTitle>
                            </Col>
                          </Row>
                          :
                          <Row>
                            <Col lg='6' className='text-center'>
                              <img alt='Profile' height={32} width={32} src={booking.imageRider ? booking.imageRider : "https://i.imgur.com/8lteruf.png"} />
                              <CardTitle tag='h6'>{booking.firstNameRider}</CardTitle>
                            </Col>
                            <Col lg='6' className='text-center'>
                              <img alt='Profile' height={32} width={32} style={{ borderRadius: 50 }} src={booking.driver_image ? booking.driver_image : "https://i.imgur.com/8lteruf.png"} />
                              <CardTitle tag='h6'>{booking.driver_firstName}</CardTitle>
                            </Col>
                          </Row>
                        }
                        <Row style={{ marginBottom: 12 }}>
                          <Col>
                            <CardText className="blockquote-footer text-center">{booking.pickup.add}</CardText>
                          </Col>
                          <Col>
                            <CardText className="blockquote-footer text-center">{booking.drop.add}</CardText>
                          </Col>
                        </Row>
                        <Row style={{ marginBottom: 8 }}>
                          <Col>
                            <CardText tag='h6' className='text-center'>{booking.pagamento.payment_mode}</CardText>
                          </Col>
                          <Col>
                            <CardText tag='h6' className='text-center'>R$ {parseFloat(booking.pagamento.trip_cost).toFixed(2)}</CardText>
                          </Col>
                        </Row>
                        <Row>
                          <Col>
                            {booking.status === "EMBARQUE" ?
                              <CardText tag='h6' className='text-center text-primary'>{booking.status ? "EMBARQUE" : "NULL"}</CardText>
                              : null}
                            {booking.status === "NEW" ?
                              <CardText tag='h6' className='text-center text-warning'>{booking.status ? "SOLICITANDO CARRO" : "NULL"}</CardText>
                              : null}
                            {booking.status === "START" ?
                              <CardText tag='h6' className='text-center text-success'>{booking.status ? "INICIOU A CORRIDA" : "NULL"}</CardText>
                              : null}
                            {booking.status === "ACCEPTED" ?
                              <CardText tag='h6' className='text-center text-info'>{booking.status ? "CORRIDA ACEITA" : "NULL"}</CardText>
                              : null}
                          </Col>
                        </Row>
                      </Card>
                    </ListGroupItem>
                    : null
                ))}
              </ListGroup>
            </Col>
          </Row>
        </div>
      </>

  )
}

export default Dashboard;