import express, { type Request, type Response } from "express";

// import middlewares
import morgan from "morgan";
import invalidJsonMiddleware from "./middlewares/invalidJsonMiddleware.ts";
import notFoundMiddleware from "./middlewares/notFoundMiddleware.ts";

// import routes
import userRouter_v2 from "./routes/userRoutes.ts";
import enrollmentRouter_v2 from "./routes/enrollmentRouter_v2.ts";
import meRouter from "./routes/me.ts";

const app = express();
const port = 3000;

// body parser middleware
app.use(express.json());

// logger middleware
app.use(morgan("dev"));
// app.use(morgan("combined"));

// JSON parser middleware
app.use(invalidJsonMiddleware);

// Endpoints
app.get("/", (req: Request, res: Response) => {
  res.send("Lab 09 API services");
});

app.use("/api/v2/enrollments", enrollmentRouter_v2);
app.use("/api/v2/users", userRouter_v2);

app.use("/api/me", meRouter);

// endpoint check middleware
app.use(notFoundMiddleware);

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

// Export app for vercel deployment
export default app;
