require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint para iniciar una llamada
app.post("/make-call", async (req, res) => {
    try {
        const { to, message } = req.body;
        if (!to) {
            return res.status(400).json({
                success: false,
                error: "Se requiere el número de teléfono"
            });
        }

        // Crear la llamada
        const call = await client.calls.create({
            twiml: `<Response><Say language="es-ES">Llamada de emergencia. ${message || 'Se requiere asistencia inmediata.'}</Say><Pause length="2"/><Say language="es-ES">Por favor, manténgase en la línea.</Say></Response>`,
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER
        });

        console.log("Llamada iniciada! SID:", call.sid);
        res.json({
            success: true,
            callId: call.sid
        });
    } catch (error) {
        console.error("Error al realizar llamada:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint existente para SMS
app.post("/send-sms", async (req, res) => {
    try {
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: "Se requieren los campos to y message"
            });
        }

        const twilioMessage = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });

        console.log("Mensaje enviado! ID:", twilioMessage.sid);
        res.json({
            success: true,
            messageId: twilioMessage.sid
        });
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook para eventos de la llamada
app.post('/voice-status', (req, res) => {
    console.log('Estado de la llamada actualizado:', req.body.CallStatus);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
