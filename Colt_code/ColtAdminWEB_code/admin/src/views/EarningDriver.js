import React, { useState, useEffect } from 'react';
import MaterialTable from 'material-table';
import { useSelector } from "react-redux";
import CircularLoading from "../components/CircularLoading";
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col
  } from "reactstrap";

export default function EarningDriver() {

    const columns = [
        { title: 'Ano', field: 'year' },
        { title: 'Mês', field: 'monthsName' },
        { title: 'Ganho', field: 'rideCost' },
        { title: 'Motorista', field: 'driverName' },
        { title: 'Taxas', field: 'convenienceFee' },
        { title: 'Valor Corrida', field: 'tripCost' },
        { title: 'Descontos', field: 'discountAmount' },
        { title: 'Cliente pagou', field: 'customerPaid' },
        { title: 'Lucro', field: 'myEarning' },

    ];

    const [data, setData] = useState([]);
    const Earningreportsdata = useSelector(state => state.Earningreportsdata);

    useEffect(() => {
        if (Earningreportsdata.Earningreportss) {
            setData(Earningreportsdata.Earningreportss);
        }
    }, [Earningreportsdata.Earningreportss]);

    return (
        Earningreportsdata.loading ? <CircularLoading /> :
            <>
                <div className="content">
                    <Row>
                        <Col md="12">
                            <Card>
                                <CardHeader>
                                    <CardTitle tag="h4">Relatórios de ganhos</CardTitle>
                                </CardHeader>
                                <CardBody>
                                    <MaterialTable
                                        columns={columns}
                                        data={data.reverse()}
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
