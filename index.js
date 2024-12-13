require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint de prueba
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Servidor funcionando" });
});

// Endpoint para mantener la llamada activa sin mensajes
app.all("/twiml", (req, res) => {
    console.log('TwiML endpoint llamado:', req.method);
    const response = new VoiceResponse();
    response.pause({ length: 3600 }); // Mantener la llamada activa por 1 hora
    res.type('text/xml');
    res.send(response.toString());
});

// Endpoint para configurar el número
app.get("/setup-number", async (req, res) => {
    try {
        // Actualizar la configuración del número
        await client.incomingPhoneNumbers(process.env.TWILIO_PHONE_SID)
            .update({
                voiceUrl: `${process.env.SERVER_URL}/twiml`,
                voiceMethod: 'POST'
            });
        
        res.json({ success: true, message: "Número configurado correctamente" });
    } catch (error) {
        console.error('Error configurando número:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para iniciar llamada
app.post("/make-call", async (req, res) => {
    try {
        const { to } = req.body;
        if (!to) {
            return res.status(400).json({ error: "Se requiere el número de teléfono" });
        }

        console.log(`📞 Iniciando llamada a ${to}`);

        const call = await client.calls.create({
            url: `${process.env.SERVER_URL}/twiml`,
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            statusCallback: `${process.env.SERVER_URL}/call-status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST'
        });

        res.json({ success: true, callId: call.sid });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para estado de llamada
app.post("/call-status", (req, res) => {
    console.log('Estado de llamada:', req.body);
    res.sendStatus(200);
});

// Iniciar servidor HTTP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
    console.log(`📞 TwiML URL: ${process.env.SERVER_URL}/twiml`);
});
