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

        // Crear la llamada silenciosa (solo escucha ambiente)
        const call = await client.calls.create({
            twiml: '<Response><Record timeout="0" maxLength="7200"/></Response>',
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            record: true
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

// Endpoint para SMS
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
