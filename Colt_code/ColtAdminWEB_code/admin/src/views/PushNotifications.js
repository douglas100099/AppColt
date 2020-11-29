import React, { useState, useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Input,
    Col
} from "reactstrap";

import {
    sendNotification,
    editNotifications
} from "../actions/notificationactions";

export default function PushNotifications() {
    const columns = [
        {
            title: 'Dispositivo',
            field: 'devicetype',
            lookup: { All: 'All', ANDROID: 'Android', IOS: 'iOS' },
            editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>Android</option><option>iOS</option></Input>)
        },
        {
            title: 'Tipo de usuário',
            field: 'usertype',
            lookup: { rider: 'Rider', driver: 'Driver' },
            editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>Rider</option><option>Driver</option></Input>)
        },
        { title: 'Titúlo', field: 'title', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Titúlo" />) },
        { title: 'Descrição', field: 'body', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Descrição" />) },
    ];

    const [data, setData] = useState([]);
    const notificationdata = useSelector(state => state.notificationdata);
    const dispatch = useDispatch();

    useEffect(() => {
        if (notificationdata.notifications) {
            setData(notificationdata.notifications);
        }
    }, [notificationdata.notifications]);

    return (
        notificationdata.loading ? <CircularLoading /> :
            <>
                <div className="content">
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h4">Enviar notificação</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <MaterialTable
                                        columns={columns}
                                        data={data}
                                        options={{
                                            actionsColumnIndex: -1,
                                            header: true,
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
                                            },
                                            //columnsButton: true,
                                            showTitle: false,
                                            search: false,
                                        }}
                                        style={{
                                            backgroundColor: '#27293d',
                                            fontFamily: "Poppins",
                                        }}
                                        editable={{
                                            onRowAdd: newData =>
                                                new Promise(resolve => {
                                                    setTimeout(() => {
                                                        resolve();
                                                        const tblData = data;
                                                        tblData.push(newData);
                                                        dispatch(sendNotification(newData));
                                                        dispatch(editNotifications(newData, "Add"));
                                                    }, 600);
                                                }),

                                            onRowUpdate: (newData, oldData) =>
                                                new Promise(resolve => {
                                                    setTimeout(() => {
                                                        resolve();
                                                        const tblData = data;
                                                        tblData[tblData.indexOf(oldData)] = newData;
                                                        dispatch(editNotifications(newData, "Update"));
                                                    }, 600);
                                                }),
                                            onRowDelete: newData =>
                                                new Promise(resolve => {
                                                    setTimeout(() => {
                                                        resolve();
                                                        dispatch(editNotifications(newData, "Delete"));
                                                    }, 600);
                                                }),
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