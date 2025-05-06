import { createApp } from "./app";
import { config } from "./config";
import express from "express";
import cors from "cors";
import { setupUploadsDirectory } from "./utils/setup-uploads";

const app = createApp();
const PORT = config.port || 4002;

// Create uploads directory
setupUploadsDirectory();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
