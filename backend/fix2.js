import mongoose from "mongoose";

const fixProperties = async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/RealEstate");
  const db = mongoose.connection.db;
  
  // Revert their status to 'active' so the backend returns them, but set a new 'isSold' flag!
  const result = await db.collection("properties").updateMany({ status: "sold" }, { $set: { status: "active", isSold: true } });
  
  console.log(`Reverted and flagged ${result.modifiedCount} properties!`);
  process.exit(0);
};

fixProperties().catch(console.error);
