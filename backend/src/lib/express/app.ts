import cors from "cors";
import express from "express";
import helmet from "helmet";
import errorHandler from "./errorHandler";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

import baseRouter from "@routes/routes";
app.use("/api", baseRouter);
app.use(errorHandler);

export default app;
