import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(helmet());
app.use(bodyParser());
app.use(express.json());

import baseRouter from "@routes/routes";
app.use("/api", baseRouter);

export default app;
export const listen = (fn: () => void) => app.listen(PORT, fn);
