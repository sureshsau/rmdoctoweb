import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

process.env.PUPPETEER_EXECUTABLE_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

import { downloadLabInvoiceController } from "./controllers/labOrder.controller.js";
import connectdb from "./config/mongoDB.config.js";

async function run() {
  await connectdb();
  const req = {
    params: { orderId: "6aa663015877eb213931d323" }, // dummy order ID
    user: { id: "6aa663015877eb213931d323", roles: ["admin"] }
  };
  // find an actual order ID to test
  const LabOrder = (await import("./models/lab/labOrder.model.js")).default;
  const order = await LabOrder.findOne().lean();
  if (order) {
    req.params.orderId = order._id.toString();
  } else {
    console.log("No orders found");
    process.exit(0);
  }

  const res = {
    setHeader: (k,v) => console.log("Header:", k,v),
    end: (buf) => console.log("PDF generated, size:", buf.length),
    status: (c) => ({ json: (d) => console.log("Status", c, d) })
  };
  const next = (err) => console.error("NEXT ERR:", err);
  await downloadLabInvoiceController(req, res, next);
  process.exit(0);
}
run();
