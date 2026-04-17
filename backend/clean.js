import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from './models/appointmentModel.js';
import PropertyRequest from './models/propertyRequestModel.js';
import Property from './models/propertymodel.js';

dotenv.config({ path: './.env.local' });

const cleanOrphans = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, { dbName: "real-estate" });
        console.log('Connected to DB');

        const properties = await Property.find({}, '_id');
        const propertyIds = properties.map(p => p._id);

        const deletedAppointments = await Appointment.deleteMany({ propertyId: { $nin: propertyIds } });
        console.log(`Deleted ${deletedAppointments.deletedCount} orphaned appointments`);

        const deletedRequests = await PropertyRequest.deleteMany({ propertyId: { $nin: propertyIds } });
        console.log(`Deleted ${deletedRequests.deletedCount} orphaned property requests`);

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
};

cleanOrphans();
