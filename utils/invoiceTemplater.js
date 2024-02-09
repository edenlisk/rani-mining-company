const PdfPrinter = require('pdfmake');
const fs = require('fs');
const path = require('path');
const { fonts, getMonthWords } = require('../utils/helperFunctions');
const imagekit = require('../utils/imagekit');

class Invoice {
    constructor(processor, supplier, invoiceInfo) {
        this.processor = processor;
        this.supplier = supplier;
        this.invoiceInfo = invoiceInfo;
        this.dd = null;
        this.filename = `${this.supplier.companyName}_${this.invoiceInfo.invoiceNo}_${this.invoiceInfo.dateOfIssue}_${this.invoiceInfo.mineralsSupplied}.pdf`;
    }

    populateDoc() {
        this.dd = {
            pageOrientation: "landscape",
            content: [
                {
                    columns: [
                        [
                            {
                                text: 'Receipt',
                                color: '#333333',
                                width: '*',
                                fontSize: 28,
                                bold: true,
                                alignment: 'right',
                                margin: [0, 0, 0, 15],
                            },
                            {
                                stack: [
                                    {
                                        columns: [
                                            {
                                                text: 'Receipt No.',
                                                color: '#aaaaab',
                                                bold: true,
                                                width: '*',
                                                fontSize: 12,
                                                alignment: 'right',
                                            },
                                            {
                                                text: `${this.invoiceInfo?.invoiceNo}`,
                                                bold: true,
                                                color: '#333333',
                                                fontSize: 12,
                                                alignment: 'right',
                                                width: 100,
                                            },
                                        ],
                                    },
                                    {
                                        columns: [
                                            {
                                                text: 'Date Issued',
                                                color: '#aaaaab',
                                                bold: true,
                                                width: '*',
                                                fontSize: 12,
                                                alignment: 'right',
                                            },
                                            {
                                                text: `${this.invoiceInfo.dateOfIssue}`,
                                                bold: true,
                                                color: '#333333',
                                                fontSize: 12,
                                                alignment: 'right',
                                                width: 100,
                                            },
                                        ],
                                    },
                                    {
                                        columns: [
                                            {
                                                text: 'Status',
                                                color: '#aaaaab',
                                                bold: true,
                                                fontSize: 12,
                                                alignment: 'right',
                                                width: '*',
                                            },
                                            {
                                                text: `${this.invoiceInfo.paymentStatus}`,
                                                bold: true,
                                                fontSize: 14,
                                                alignment: 'right',
                                                color: 'green',
                                                width: 100,
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    ],
                },
                {
                    columns: [
                        {
                            text: 'Processor',
                            color: '#aaaaab',
                            bold: true,
                            fontSize: 14,
                            alignment: 'left',
                            margin: [0, 20, 0, 5],
                        },
                        {
                            text: 'Supplier',
                            color: '#aaaaab',
                            bold: true,
                            fontSize: 14,
                            alignment: 'left',
                            margin: [0, 20, 0, 5],
                        },
                    ],
                },
                {
                    columns: [
                        {
                            text: `${this.processor.representative} \n ${this.processor.companyName}`,
                            bold: true,
                            color: '#333333',
                            alignment: 'left',
                        },
                        {
                            text: `${this.supplier.beneficiary} \n ${this.supplier.companyName}`,
                            bold: true,
                            color: '#333333',
                            alignment: 'left',
                        },
                    ],
                },
                {
                    columns: [
                        {
                            text: 'Address',
                            color: '#aaaaab',
                            bold: true,
                            margin: [0, 7, 0, 3],
                        },
                        {
                            text: 'Address',
                            color: '#aaaaab',
                            bold: true,
                            margin: [0, 7, 0, 3],
                        },
                    ],
                },
                {
                    columns: [
                        {
                            text: `${this.processor.province} \n ${this.processor.district} \n   ${this.processor.sector}`,
                            style: 'invoiceBillingAddress',
                        },
                        {
                            text: `${this.supplier.address.province} \n ${this.supplier.address.district} \n   ${this.supplier.address.sector}`,
                            style: 'invoiceBillingAddress',
                        },
                    ],
                },
                '\n\n',
                {
                    width: '100%',
                    alignment: 'center',
                    text: `Invoice No. ${this.invoiceInfo.invoiceNo}`,
                    bold: true,
                    margin: [0, 10, 0, 10],
                    fontSize: 15,
                },
                {
                    layout: {
                        defaultBorder: false,
                        hLineWidth: function(i, node) {
                            return 1;
                        },
                        vLineWidth: function(i, node) {
                            return 1;
                        },
                        hLineColor: function(i, node) {
                            if (i === 1 || i === 0) {
                                return '#bfdde8';
                            }
                            return '#eaeaea';
                        },
                        vLineColor: function(i, node) {
                            return '#eaeaea';
                        },
                        hLineStyle: function(i, node) {
                            // if (i === 0 || i === node.table.body.length) {
                            return null;
                            //}
                        },
                        // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                        paddingLeft: function(i, node) {
                            return 10;
                        },
                        paddingRight: function(i, node) {
                            return 10;
                        },
                        paddingTop: function(i, node) {
                            return 2;
                        },
                        paddingBottom: function(i, node) {
                            return 2;
                        },
                        fillColor: function(rowIndex, node, columnIndex) {
                            return '#fff';
                        },
                    },
                    table: {
                        headerRows: 1,
                        widths: [20, '*', '*', '*', '*', '*', '*', 80],
                        body: this.invoiceInfo.invoiceDescription
                    },
                },
                '\n',
                '\n\n',
                {
                    layout: {
                        defaultBorder: false,
                        hLineWidth: function(i, node) {
                            return 1;
                        },
                        vLineWidth: function(i, node) {
                            return 1;
                        },
                        hLineColor: function(i, node) {
                            return '#eaeaea';
                        },
                        vLineColor: function(i, node) {
                            return '#eaeaea';
                        },
                        hLineStyle: function(i, node) {
                            // if (i === 0 || i === node.table.body.length) {
                            return null;
                            //}
                        },
                        // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                        paddingLeft: function(i, node) {
                            return 10;
                        },
                        paddingRight: function(i, node) {
                            return 10;
                        },
                        paddingTop: function(i, node) {
                            return 3;
                        },
                        paddingBottom: function(i, node) {
                            return 3;
                        },
                        fillColor: function(rowIndex, node, columnIndex) {
                            return '#fff';
                        },
                    },
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto'],
                        body: [
                            [
                                {
                                    text: 'Payment Subtotal ($)',
                                    border: [false, true, false, true],
                                    alignment: 'right',
                                    margin: [0, 5, 0, 5],
                                },
                                {
                                    border: [false, true, false, true],
                                    text: `${this.invoiceInfo.paymentTotal}`,
                                    alignment: 'right',
                                    fillColor: '#f5f5f5',
                                    margin: [0, 5, 0, 5],
                                },
                            ],
                            [
                                {
                                    text: 'RMA fees ($)',
                                    border: [false, false, false, true],
                                    alignment: 'right',
                                    margin: [0, 5, 0, 5],
                                },
                                {
                                    text: `${this.invoiceInfo.totalRMAFee}`,
                                    border: [false, false, false, true],
                                    fillColor: '#f5f5f5',
                                    alignment: 'right',
                                    margin: [0, 5, 0, 5],
                                },
                            ],
                            [
                                {
                                    text: 'Total Amount Paid ($)',
                                    bold: true,
                                    fontSize: 20,
                                    alignment: 'right',
                                    border: [false, false, false, true],
                                    margin: [0, 5, 0, 5],
                                },
                                {
                                    text: `${this.invoiceInfo.paymentTotal - this.invoiceInfo.totalRMAFee}`,
                                    bold: true,
                                    fontSize: 20,
                                    alignment: 'right',
                                    border: [false, false, false, true],
                                    fillColor: '#f5f5f5',
                                    margin: [0, 5, 0, 5],
                                },
                            ],
                        ],
                    },
                },
                '\n\n',
                {
                    text: 'EXTRA NOTES',
                    style: 'notesTitle',
                },
                {
                    text: `${this.invoiceInfo.extraNotes}`,
                    style: 'notesText',
                },
            ],
            styles: {
                notesTitle: {
                    fontSize: 10,
                    bold: true,
                    margin: [0, 50, 0, 3],
                },
                notesText: {
                    fontSize: 10,
                },
            },
            defaultStyle: {
                columnGap: 20,
                font: "Helvetica"
                //font: 'Quicksand',
            },
        };

        const formatPaymentHistory = this.invoiceInfo.paymentHistory.map(table => {
            return {
                layout: {
                    defaultBorder: false,
                    hLineWidth: function(i, node) {
                        return 1;
                    },
                    vLineWidth: function(i, node) {
                        return 1;
                    },
                    hLineColor: function(i, node) {
                        if (i === 1 || i === 0) {
                            return '#bfdde8';
                        }
                        return '#eaeaea';
                    },
                    vLineColor: function(i, node) {
                        return '#eaeaea';
                    },
                    hLineStyle: function(i, node) {
                        // if (i === 0 || i === node.table.body.length) {
                        return null;
                        //}
                    },
                    // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                    paddingLeft: function(i, node) {
                        return 10;
                    },
                    paddingRight: function(i, node) {
                        return 10;
                    },
                    paddingTop: function(i, node) {
                        return 2;
                    },
                    paddingBottom: function(i, node) {
                        return 2;
                    },
                    fillColor: function(rowIndex, node, columnIndex) {
                        return '#fff';
                    },
                },
                table: {
                    headerRows: 1,
                    widths: [ '*', '*', '*', '*', '*', '*' ],
                    body: table,
                },
            }
        })

        this.dd.content = this.dd.content.concat(formatPaymentHistory);
    }

    async saveDownload(res) {
        const InvoiceModel = require('../models/invoiceModel');
        const printer = new PdfPrinter(fonts);
        const pdfDoc = printer.createPdfKitDocument(this.dd);
        // const year = (new Date()).getFullYear();
        // const month = getMonthWords((new Date()).getMonth());
        const invoiceDoc = await InvoiceModel.findById(this.invoiceInfo.invoiceId);
        if (invoiceDoc) {
            if (invoiceDoc.invoiceFile?.fileId) {
                await imagekit.deleteFile(invoiceDoc.invoiceFile.fileId, err => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        }
        const pdfBuffer = await new Promise((resolve) => {
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.end();
        });



        // pdfDoc.pipe(fs.createWriteStream(`${this.supplier.companyName} - ${this.invoiceInfo.invoiceNumber}.pdf`));
        // pdfDoc.end();

        const response = await imagekit.upload({
            file: pdfBuffer,
            fileName: `${this.supplier.companyName} - ${this.invoiceInfo.invoiceNumber}.pdf`,
            folder: `invoices`,
        })
        if (response) {
            invoiceDoc.invoiceFile.fileId = response.fileId;
            invoiceDoc.invoiceFile.url = response.url;
            await invoiceDoc.save();
            // fs.unlink(`${this.supplier.companyName} - ${this.invoiceInfo.invoiceNumber}.pdf`, err => {
            //   if (err) {
            //       console.log(err);
            //   } else {
            //       console.log('File deleted successfully');
            //   }
            // })
        }



        // const filePath = `${__dirname}/../public/data/Invoices/${this.supplier.companyName}/${year}/${month}`;
        // if (!fs.existsSync(filePath)) {
        //     fs.mkdir(filePath, {recursive: true}, err => {
        //         if (err) {
        //             console.log(err);
        //         }
        //     });
        // }
        // pdfDoc.pipe(fs.createWriteStream(path.resolve(filePath, this.filename)));
        // pdfDoc.end();
        res
            .status(201)
            .json(
                {
                    status: "Success",
                    data: {
                        invoiceFile: invoiceDoc.invoiceFile.url,
                        invoiceFileId: invoiceDoc.invoiceFile.fileId,
                    }
                }
            )
        ;
    }
}


module.exports = Invoice;