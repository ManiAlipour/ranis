import cors from "cors";
import express from "express";
import helmet from "helmet";
import errorHandler from "./errorHandler";

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

import baseRouter from "@routes/routes";
app.use("/api", baseRouter);
app.use(errorHandler);

export default app;
export const listen = (fn: () => void) => app.listen(PORT, fn);
