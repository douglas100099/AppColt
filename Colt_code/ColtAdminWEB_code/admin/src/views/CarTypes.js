import React, { useState, useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import { editCarType } from "../actions/cartypeactions";
import { isLive } from '../config/keys';
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Input,
    Col
} from "reactstrap";

export default function CarTypes() {
    const columns = [
        { title: 'Imagem', field: 'image', render: rowData => <img alt='Car' src={rowData.image} style={{ width: 50 }} /> },
        { title: 'Nome', field: 'name', editComponent: props => (<Input type="email" name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Nome" />) },
        { title: 'Taxa por KM', field: 'rate_per_kilometer', type: 'numeric', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Taxa por KM" />) },
        { title: 'Taxa por Hora', field: 'rate_per_hour', type: 'numeric', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Taxa por Hora" />) },
        { title: 'Valor min.', field: 'min_fare', type: 'numeric', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Valor Min" />) },
        { title: 'Taxa', field: 'convenience_fees', type: 'numeric', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Taxa" />) }
    ];
    const [data, setData] = useState([]);
    const cartypes = useSelector(state => state.cartypes);
    const dispatch = useDispatch();

    useEffect(() => {
        if (cartypes.cars) {
            setData(cartypes.cars);
        }
    }, [cartypes.cars]);

    const removeExtraKeys = (tblData) => {
        for (let i = 0; i < tblData.length; i++) {
            if (tblData[i].rate_per_kilometer) tblData[i].rate_per_kilometer = parseFloat(tblData[i].rate_per_kilometer);
            if (tblData[i].rate_per_hour) tblData[i].rate_per_hour = parseFloat(tblData[i].rate_per_hour);
            if (tblData[i].convenience_fees) tblData[i].convenience_fees = parseFloat(tblData[i].convenience_fees);
        }
        return tblData;
    }

    return (
        cartypes.loading ? <CircularLoading /> :
            <>
                <div className="content">
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h4">Categorias</CardTitle>
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
                                        editable={isLive ? {
                                            onRowAdd: newData =>
                                                new Promise(resolve => {
                                                    setTimeout(() => {
                                                        resolve();
                                                        const tblData = data;
                                                        tblData.push(newData);
                                                        dispatch(editCarType(removeExtraKeys(tblData), "Add"));
                                                    }, 600);
                                                }),
                                            onRowUpdate: (newData, oldData) =>
                                                new Promise(resolve => {
                                                    setTimeout(() => {
                                                        resolve();
                                                        const tblData = data;
                                                        tblData[tblData.indexOf(oldData)] = newData;
                                                        dispatch(editCarType(removeExtraKeys(tblData), "Update"));
                                                    }, 600);
                                                }),
                                            onRowDelete: oldData =>
                                                new Promise(resolve => {
                                                    setTimeout(() => {
                                                        resolve();
                                                        const tblData = data;
                                                        tblData.splice(tblData.indexOf(oldData), 1);
                                                        dispatch(editCarType(removeExtraKeys(tblData), "Delete"));
                                                    }, 600);
                                                }),
                                        } : null}
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </>

    );
}