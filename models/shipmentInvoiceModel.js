const mongoose = require('mongoose');

const shipmentInvoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
        }
    }
)