import { google } from 'googleapis';


const scopes = ['https://www.googleapis.com/auth/spreadsheets'];


function getJWT() {
    const email = process.env.GOOGLE_SA_EMAIL;
    const key = (process.env.GOOGLE_SA_KEY || '').replace(/\\n/g, '\n');
    return new google.auth.JWT(email, undefined, key, scopes);
}


export async function appendRows(range, values) {
    const auth = getJWT();
    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GSHEET_ID,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
    });
}