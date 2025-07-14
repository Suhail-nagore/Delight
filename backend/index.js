const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const nodeSchedule = require("node-schedule");
const path = require("path");
require("dotenv").config();
// require("dotenv").config({ path: ".env.production" });
const { generateExcelReport } = require("./controller/generateExcel");

// Importing Routes
const patientRouter = require("./routes/patient-router");
const doctorRouter = require("./routes/doctor-router");
const categoryRouter = require("./routes/category-router");
const subCategoryRouter = require("./routes/subCategory-router");
const orderRouter = require("./routes/order-router");
const adminRouter = require("./routes/admin-router");
const checkAuthRouter = require("./routes/checkAuth-router");
const reportRouter = require("./routes/report-router");
const authRouter = require("./routes/auth-router");
const unbilledRouter = require("./routes/unbilled-router");
const operatorRouter = require("./routes/operator-router");

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Serve static files from the "public" folder
// app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "dist")));

// API Routes
app.use("/api/", patientRouter);
app.use("/api/", doctorRouter);
app.use("/api/", categoryRouter);
app.use("/api/", subCategoryRouter);
app.use("/api/", orderRouter);
app.use("/api/", checkAuthRouter);
app.use("/api/", authRouter);
app.use("/api/", unbilledRouter);
app.use("/admin/api/", adminRouter);
app.use("/api/reports", reportRouter); // Route for generating reports
app.use("/api/", operatorRouter);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Handle non-API routes by serving the frontend
// app.use("/*", (req, res) => {
//   if (!req.originalUrl.startsWith("/api")) {
//     res.sendFile(path.join(__dirname, "public", "index.html"));
//   } else {
//     res.status(404).json({ error: "API route not found" });
//   }
// });

// Scheduled Job to Generate Excel Report on the Last Day of Each Month at 11:55 PM
nodeSchedule.scheduleJob("55 23 28-31 * *", async () => {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  if (now.getDate() === lastDayOfMonth) {
    try {
      console.log("Generating Excel Report...");
      const filePath = await generateExcelReport();
      console.log("Excel Report Generated:", filePath);
    } catch (error) {
      console.error("Error during Excel Report Generation:", error);
    }
  }
});

// nodeSchedule.scheduleJob(new Date(Date.now() + 1 * 60 * 1000), async () => {
//   try {
//     console.log("Generating Excel Report...");
//     const filePath = await generateExcelReport();
//     console.log("Excel Report Generated and Email Sent:", filePath);
//   } catch (error) {
//     console.error("Error during Excel Report Generation:", error);
//   }
// });

// Start the Server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
