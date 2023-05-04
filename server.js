const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const logger = require('morgan');
const Twilio = require('twilio');

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN } = process.env;

const app = express();
const client = Twilio(ACCOUNT_SID, AUTH_TOKEN);
const VoiceResponse = Twilio.twiml.VoiceResponse
const ClientCapability = Twilio.jwt.ClientCapability;

const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*', methods: ['POST', 'GET'] }});

io.on('connection', (client) => {
    console.log('Client connected');
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*', credentials: true }));

/* TODO: Add this URL to the TWILIO ON Webhook & on Call Status Changes */
app.post('/getCalls', (req, res) => {
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'man', loop: 100 }, 'Hi, thank you for calling Happierleads customercare');
    io.emit('callComing', { data: req.body });

    res.type('text/xml').send(twiml.toString());
});

app.get('/token', (req, res) => {
    const { clientName } = req.query;
    const capability = new ClientCapability({
        accountSid: ACCOUNT_SID,
        authToken: AUTH_TOKEN,
    });

    capability.addScope(new ClientCapability.IncomingClientScope(clientName));
    const token = capability.toJwt();

    res.contentType('application/jwt').send(token);
});

app.post('/answerCall', (req, res) => {
    const URL = req.baseUrl + 'routeCall';
    
    client.calls(req.body.id).update({ url: URL, method: 'POST' })
    .then(call => console.log(call))
    .catch(error => console.log(error));
});

app.post('/routeCall', (req, res) => {
    console.log('on route call: ', req.body);

    const twiml = new VoiceResponse();
    twiml.dial().client();

    res.type('text/xml').send(twiml.toString());
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`SERVER running on PORT ${PORT}`);
})