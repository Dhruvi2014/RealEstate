import fs from "fs";
import imagekit from "../config/imagekit.js";
import Property from "../models/propertymodel.js";
import Appointment from "../models/appointmentModel.js";
import PropertyRequest from "../models/propertyRequestModel.js";

const addproperty = async (req, res) => {
    try {
        const { title, location, price, beds, baths, sqft, type, availability, description, amenities, phone, googleMapLink } = req.body;

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        const imageUrls = await Promise.all(
            images.map(async (item) => {
                const result = await imagekit.upload({
                    file: fs.readFileSync(item.path),
                    fileName: item.originalname,
                    folder: "Property",
                });
                fs.unlink(item.path, (err) => {
                    if (err) console.log("Error deleting the file: ", err);
                });
                return result.url;
            })
        );

        const product = new Property({
            title,
            location,
            price,
            beds,
            baths,
            sqft,
            type,
            availability,
            description,
            amenities,
            image: imageUrls,
            phone,
            googleMapLink: googleMapLink || '',
            postedBy: req.user ? req.user._id : null,
            status: (req.user && req.user.role === 'admin') ? 'active' : 'pending'
        });

        await product.save();

        res.json({ message: "Property added successfully", success: true });
    } catch (error) {
        console.log("Error adding product: ", error);
        res.status(500).json({ message: "Server Error", success: false });
    }
};

const listproperty = async (req, res) => {
    try {
        // Public list - show active and sold properties
        const property = await Property.find({
            $or: [{ status: 'active' }, { status: 'sold' }, { status: { $exists: false } }],
        });
        res.json({ property, success: true });
    } catch (error) {
        console.log("Error listing products: ", error);
        res.status(500).json({ message: "Server Error", success: false });
    }
};

const adminlistproperty = async (req, res) => {
    try {
        // Admin sees all, agent sees only their own
        let filter = {};
        if (req.user && req.user.role !== 'admin') {
            filter.postedBy = req.user._id;
        }
        
        const property = await Property.find(filter).sort({ createdAt: -1 });
        res.json({ property, success: true });
    } catch (error) {
        console.log("Error fetching admin properties:", error);
        res.status(500).json({ message: "Server Error", success: false });
    }
};

const removeproperty = async (req, res) => {
    try {
        const property = await Property.findById(req.body.id);
        if (!property) {
            return res.status(404).json({ message: "Property not found", success: false });
        }

        // Check ownership if not admin
        if (req.user.role !== 'admin') {
            if (!property.postedBy || property.postedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized to delete this property", success: false });
            }
        }

        await Property.findByIdAndDelete(req.body.id);
        await Appointment.deleteMany({ propertyId: req.body.id });
        await PropertyRequest.deleteMany({ propertyId: req.body.id });

        return res.json({ message: "Property removed successfully", success: true });
    } catch (error) {
        console.log("Error removing product: ", error);
        return res.status(500).json({ message: "Server Error", success: false });
    }
};

const updateproperty = async (req, res) => {
    try {
        const { id, title, location, price, beds, baths, sqft, type, availability, description, amenities, phone, googleMapLink } = req.body;

        const property = await Property.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Property not found", success: false });
        }

        // Check ownership if not admin
        if (req.user.role !== 'admin') {
            if (!property.postedBy || property.postedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized to update this property", success: false });
            }
        }

        if (!req.files || Object.keys(req.files).length === 0) {
            property.title = title;
            property.location = location;
            property.price = price;
            property.beds = beds;
            property.baths = baths;
            property.sqft = sqft;
            property.type = type;
            property.availability = availability;
            property.description = description;
            property.amenities = amenities;
            property.phone = phone;
            property.googleMapLink = googleMapLink || '';
            if (req.user && req.user.role !== 'admin') {
                property.status = 'pending';
                property.rejectionReason = '';
            }
            await property.save();
            return res.json({ message: "Property updated successfully", success: true });
        }

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        const imageUrls = await Promise.all(
            images.map(async (item) => {
                const result = await imagekit.upload({
                    file: fs.readFileSync(item.path),
                    fileName: item.originalname,
                    folder: "Property",
                });
                fs.unlink(item.path, (err) => {
                    if (err) console.log("Error deleting the file: ", err);
                });
                return result.url;
            })
        );

        property.title = title;
        property.location = location;
        property.price = price;
        property.beds = beds;
        property.baths = baths;
        property.sqft = sqft;
        property.type = type;
        property.availability = availability;
        property.description = description;
        property.amenities = amenities;
        property.image = imageUrls;
        property.phone = phone;
        property.googleMapLink = googleMapLink || '';
        if (req.user && req.user.role !== 'admin') {
            property.status = 'pending';
            property.rejectionReason = '';
        }

        await property.save();
        res.json({ message: "Property updated successfully", success: true });
    } catch (error) {
        console.log("Error updating product: ", error);
        res.status(500).json({ message: "Server Error", success: false });
    }
};

const singleproperty = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id);
        if (!property) {
            return res.status(404).json({ message: "Property not found", success: false });
        }
        res.json({ property, success: true });
    } catch (error) {
        console.log("Error fetching property:", error);
        res.status(500).json({ message: "Server Error", success: false });
    }
};

export { addproperty, listproperty, adminlistproperty, removeproperty, updateproperty , singleproperty};