import React, { useState, useEffect } from 'react';
import MaterialTable from 'material-table';
import CircularLoading from "../components/CircularLoading";
import { useSelector, useDispatch } from "react-redux";
import languageJson from "../config/language";
import { cancelBooking } from '../actions/bookinglistactions';
import ConfirmationDialogRaw from '../components/ConfirmationDialogRaw';
import { isLive } from '../config/keys';

import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col
  } from "reactstrap";

const Bookings = () => {
    const dispatch = useDispatch();

    const columns = [
        { title: 'ID', field: 'id' },
        { title: 'Data', field: 'tripdate', render: rowData => rowData.tripdate ? new Date(rowData.tripdate).toLocaleString('pt-BR') : null },
        { title: 'Categoria', field: 'carType' },
        { title: 'Passageiro', field: 'customer_name' },
        { title: 'Partida', field: 'pickupAddress' },
        { title: 'Destino', field: 'dropAddress' },
        { title: 'Motorista', field: 'driver_name' },
        { title: 'Status', field: 'status' },
        /*{ title: languageJson.otp, field: 'otp', render: rowData => rowData.status ==='NEW' || rowData.status === 'ACCEPTED' ?<span>{rowData.otp}</span>:null },*/
        { title: 'Inicio Hr.', field: 'trip_start_time' },
        { title: 'Fim Hr.', field: 'trip_end_time' },
        { title: 'Valor', field: 'trip_cost' },
        { title: 'Status pgt', field: 'payment_status' },

        /* More Fields if you need
  
        { title: languageJson.vehicle_no, field: 'vehicle_number' },  
        { title: languageJson.trip_cost_driver_share, field: 'driver_share'},
        { title: languageJson.convenience_fee, field: 'convenience_fees'},
        { title: languageJson.discount_ammount, field: 'discount'},      
        { title: languageJson.Customer_paid, field: 'customer_paid'},
        { title: languageJson.payment_mode, field: 'payment_mode'},
        { title: languageJson.payment_getway, field: 'getway'},
        { title: languageJson.cash_payment_amount, field: 'cashPaymentAmount'},
        { title: languageJson.card_payment_amount, field: 'cardPaymentAmount'},
        { title: languageJson.wallet_payment_amount, field: 'usedWalletMoney'},
  
        */

    ];
    const [data, setData] = useState([]);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState('');
    const bookinglistdata = useSelector(state => state.bookinglistdata);

    useEffect(() => {
        if (bookinglistdata.bookings) {
            setData(bookinglistdata.bookings);
        }
    }, [bookinglistdata.bookings]);

    const onConfirmClose = (value) => {
        if (value) {
            dispatch(cancelBooking({
                reason: value,
                booking: selectedBooking
            }));
        }
        setOpenConfirm(false);
    }

    return (
        bookinglistdata.loading ? <CircularLoading /> :
            <>
                <div className="content">
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h4">Corridas</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <MaterialTable
                                        title={languageJson.booking_title}
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
                                            actionsCellStyle: {
                                                color: 'rgba(255, 255, 255, 0.9)',
                                            },
                                            editCellStyle: {
                                                color: 'rgba(255, 255, 255, 0.9)',
                                            },
                                            filterCellStyle: {
                                                color: 'rgba(255, 255, 255, 0.9)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            searchFieldStyle: {
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
                                        actions={[
                                            rowData => ({
                                                icon: 'cancel',
                                                tooltip: 'Cancelar corrida',
                                                disabled: rowData.status === 'NEW' || rowData.status === 'ACCEPTED' ? false : true,
                                                onClick: (event, rowData) => {
                                                    if (isLive) {
                                                        setSelectedBooking(rowData);
                                                        setOpenConfirm(true);
                                                    } else {
                                                        alert('Restricted in Demo App.');
                                                    }
                                                }
                                            }),
                                        ]}
                                    />
                                    <ConfirmationDialogRaw
                                        open={openConfirm}
                                        onClose={onConfirmClose}
                                        value={''}
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </>

    );
}

export default Bookings;
