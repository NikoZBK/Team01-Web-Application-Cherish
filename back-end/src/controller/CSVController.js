import SQLiteDayModel from "../model/SQLiteDayModel.js";
import { convertToCSV } from "../../csv/csvUtils.js";

export const exportCSV = async (req, res) => {
    try {
        const days = await SQLiteDayModel.read();

        if(!days || days.length === 0) {
            throw new Error("No data found, cannot export")
        }

        const formatDay = days.map(day => day.get({ plains: true })); //Formats the data into plain objects
        const fields = ["date_id", "journal", "emotion", "rating"]; // CSV fields
        /* Heres the idea i have for how the csv should look
        date_id, journal, emotion, rating
        9/8, blah blah blah, happy, 9
        9/9, more blah and blahing, sad, 3
        */
       
        return convertToCSV(formatDays, fields); // Convert data to CSV format
    }
    catch (error) {
        console.error("Error exporting CSV: ", error);
        res.status(500).json({ error: "Error exporting CSV" });
    }
}
