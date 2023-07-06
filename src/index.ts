import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.APP_PORT;

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to folder tree view");
});
app.get("/test", (req: Request, res: Response) => {
  res.send({
    data: "hello! from backend",
  });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
