import connectDB from "@lib/db/config";
import { listen } from "@lib/express/app";

connectDB().catch((err) => console.log("DB Connection lost :", err));

listen(() => {
  console.log("App run!");
});
