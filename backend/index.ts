import express from "express";
import connectDB from "./src/lib/db/config";
import apiApp from "./src/lib/express/app";

const app = express();
app.use(apiApp);

connectDB().catch((err) => console.log("DB Connection lost :", err));

if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log("App run!"));
}

export default app;
