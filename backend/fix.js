import mongoose from "mongoose";

const fixProperties = async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/RealEstate");
  const db = mongoose.connection.db;
  const requests = await db.collection("propertyrequests").find({ status: "confirmed" }).toArray();
  for (const req of requests) {
    if (req.status === "confirmed") {
      await db.collection("properties").updateOne({ _id: req.propertyId }, { $set: { status: "sold" } });
      console.log("Marked property as sold:", req.propertyId);
    }
  }
  console.log("Done mapping existing property requests!");
  process.exit(0);
};

fixProperties().catch(console.error);
