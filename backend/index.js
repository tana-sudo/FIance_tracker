import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
const app = express();

const port = process.env.PORT;
app.use(bodyParser.json());
app.use(express.json());

app.get('/data', (req, res) => {
    const data = "Sample data from server";
    console.log('Received data:', data);
    res.status(200).send('Data received');
});

app.post('/inserdata', (req, res) => {
    const data = "tanatswa";
    console.log('Received data:', data);
    res.status(200).send('Data received');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
