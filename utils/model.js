const Coltan = require('../models/coltanEntryModel');
const Cassiterite = require('../models/cassiteriteEntryModel');
const Wolframite = require('../models/wolframiteEntryModel');
const Beryllium = require('../models/berylliumEntryModel');
const Lithium = require('../models/lithiumEntryModel');


exports.extractModel = (model) => {
    switch (model) {
        case "coltan":
            return Coltan;
        case "cassiterite":
            return Cassiterite;
        case "wolframite":
            return Wolframite;
        case "beryllium":
            return Beryllium;
        case "lithium":
            return Lithium
    }
}