import express, { Application } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import promptRoutes from "./routes/promptRoutes";

config();

const app: Application = express();
const port: string = process.env.PORT || "5000";

app.use(express.json());
app.use(cors());

app.use('/api/prompt', promptRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});