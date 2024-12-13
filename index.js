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
        const { to } = req.body;
        if (!to) {
            return res.status(400).json({
                success: false,
                error: "Se requiere el número de teléfono"
            });
        }

        // Crear la llamada con audio en tiempo real
        const call = await client.calls.create({
            twiml: '<Response><Say language="es-ES">Conectando llamada de emergencia</Say><Dial record="record-from-answer" timeout="0" answerOnBridge="true">' + to + '</Dial></Response>',
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER
        });

        // Responder inmediatamente
        res.json({
            success: true,
            callId: call.sid
        });

        // Registrar después de responder
        console.log("Llamada iniciada! SID:", call.sid);
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

        // Enviar SMS
        const twilioMessage = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });

        // Responder inmediatamente
        res.json({
            success: true,
            messageId: twilioMessage.sid
        });

        // Registrar después de responder
        console.log("Mensaje enviado! ID:", twilioMessage.sid);
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Optimizar el servidor
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
