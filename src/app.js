import express from "express";
import healthRouter from "./routes/health.routes.js";
import materiasRouter from "./routes/materias.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { attachTemporaryUser } from "./middlewares/request-context.middleware.js";

const app = express();

app.use(express.json());
app.use(attachTemporaryUser);

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/materias", materiasRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;