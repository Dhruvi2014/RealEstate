import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Property from './models/propertymodel.js';
import PropertyRequest from './models/propertyRequestModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const fixSoldProperties = async () => {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find all confirmed property requests
        const requests = await PropertyRequest.find({ status: 'confirmed' });
        console.log(`Found ${requests.length} confirmed requests`);

        for (const req of requests) {
            await Property.findByIdAndUpdate(req.propertyId, { isSold: true, status: 'sold' });
            console.log(`Updated property ${req.propertyId} to isSold: true`);
        }

        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

fixSoldProperties();
