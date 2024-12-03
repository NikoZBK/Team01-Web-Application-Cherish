const { Parser } = require('json2csv');

const convertToCSV = ( data, fields ) => {
    try {
        const parser = new Parser({ fields });
        return parser.parse(data);
    } 
    catch (error) {
        console.error('Error to converting to CSV: ', error);
        throw error;
    }
};

module.exports = { convertToCSV };
