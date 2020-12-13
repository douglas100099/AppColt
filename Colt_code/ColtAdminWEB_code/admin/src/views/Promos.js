import React, { useState, useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector, useDispatch } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import {
    editPromo
} from "../actions/promoactions";
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

export default function Promos() {
    const columns = [
        { title: 'Nome', field: 'promo_name', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Nome" />) },
        { title: 'Descrição', field: 'promo_description', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Descrição" />) },
        {
            title: 'Titulo',
            field: 'promo_discount_type',
            lookup: { flat: 'Flat', percentage: 'Percentage' },
            editComponent: props => (<Input type="select" value={props.value} name="select" onChange={e => props.onChange(e.target.value)} id="exampleSelect1"><option>Flat</option><option>Percentage</option></Input>)
        },
        { title: 'Valor', field: 'promo_discount_value', type: 'numeric', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Valor" />) },
        { title: 'Desconto max.', field: 'max_promo_discount_value', type: 'numeric', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Desconto máximo" />) },
        { title: 'Min. pedido', field: 'min_order', type: 'numeric', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Min. pedido" />) },
        { title: 'Começa', field: 'promo_start', render: rowData => rowData.promo_start ? new Date(rowData.promo_start).toLocaleDateString('pt-BR') : null },
        { title: 'Terminaa', field: 'promo_validity', render: rowData => rowData.promo_validity ? new Date(rowData.promo_validity).toLocaleDateString('pt-BR') : null },
        { title: 'Disponivel', field: 'promo_usage_limit', type: 'numeric', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Dispónivel" />) },
        { title: 'Usados', field: 'promo_used_by', editComponent: props => (<Input name="name" value={props.value} id="exampleNome" onChange={e => props.onChange(e.target.value)} placeholder="Usados" />) }
    ];

    const [data, setData] = useState([]);
    const promodata = useSelector(state => state.promodata);
    const dispatch = useDispatch();

    useEffect(() => {
        if (promodata.promos) {
            setData(promodata.promos);
        }
    }, [promodata.promos]);

    const removeExtraKeys = (tblData) => {
        if (tblData.promo_discount_value) tblData.promo_discount_value = parseFloat(tblData.promo_discount_value);
        if (tblData.max_promo_discount_value) tblData.max_promo_discount_value = parseFloat(tblData.max_promo_discount_value);
        if (tblData.min_order) tblData.min_order = parseFloat(tblData.min_order);
        if (tblData.promo_usage_limit) tblData.promo_usage_limit = parseFloat(tblData.promo_usage_limit);
        return tblData;
    }

    return (
        promodata.loading ? <CircularLoading /> :
            <>
                <div className="content">
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h4">Cupons de desconto</CardTitle>
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
                                                        dispatch(editPromo(removeExtraKeys(newData), "Add"));
                                                    }, 600);
                                                }),
                                            onRowUpdate: (newData, oldData) =>
                                                new Promise(resolve => {
                                                    setTimeout(() => {
                                                        resolve();
                                                        const tblData = data;
                                                        tblData[tblData.indexOf(oldData)] = newData;
                                                        dispatch(editPromo(removeExtraKeys(newData), "Update"));
                                                    }, 600);
                                                }),
                                            onRowDelete: newData =>
                                                new Promise(resolve => {
                                                    setTimeout(() => {
                                                        resolve();
                                                        dispatch(editPromo(removeExtraKeys(newData), "Delete"));
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
