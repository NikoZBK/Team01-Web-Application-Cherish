const { convertToCSV } = require('./csvUtils');
const { LocalDayModel } = require('./src/model/LocalDayModel');

const exportDayToCSV = async () => {
    try {
        const dayData = await LocalDayModel.read(); // Fetches all stored day data, Retrieves in-memory data
        const fields = ['date_id', 'journal', 'rating', 'emotions']; //fields for CSV
        return convertToCSV(dayData, fields); //Converts day data to a csv format
    }
    catch (error) {
        console.error('Error with Exporting day data to CSV: ', error);
        throw error;
    }
};

module.exports = { exportDayToCSV };
