import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

// Initialize Firebase on server
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Fonnte API Proxy
  app.post("/api/whatsapp/send", async (req, res) => {
    const { target, message } = req.body;
    const apiKey = process.env.FONNTE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "FONNTE_API_KEY is not configured" });
    }

    try {
      const response = await axios.post(
        "https://api.fonnte.com/send",
        {
          target,
          message,
        },
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      console.error("Fonnte API Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
