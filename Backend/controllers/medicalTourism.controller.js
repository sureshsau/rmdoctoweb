import MedicalTourism from '../models/medicalTourism.model.js';

// Create a new Medical Tourism package
export const createPackage = async (req, res) => {
    try {
        const { title, hospital, location, description, facilities, price, isActive, imageUrl } = req.body;

        const newPackage = new MedicalTourism({
            title,
            hospital,
            location,
            description,
            facilities,
            price,
            isActive,
            imageUrl
        });

        await newPackage.save();
        res.status(201).json({ success: true, message: 'Medical tourism package created successfully', data: newPackage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create package', error: error.message });
    }
};

// Get all packages
export const getAllPackages = async (req, res) => {
    try {
        const query = req.user?.role === 'user' ? { isActive: true } : {}; // Users only see active ones, admin sees all
        const packages = await MedicalTourism.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: packages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch packages', error: error.message });
    }
};

// Get package by ID
export const getPackageById = async (req, res) => {
    try {
        const packageData = await MedicalTourism.findById(req.params.id);
        if (!packageData) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }
        res.status(200).json({ success: true, data: packageData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch package', error: error.message });
    }
};

// Update package
export const updatePackage = async (req, res) => {
    try {
        const updatedPackage = await MedicalTourism.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedPackage) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        res.status(200).json({ success: true, message: 'Package updated successfully', data: updatedPackage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update package', error: error.message });
    }
};

// Delete package
export const deletePackage = async (req, res) => {
    try {
        const deletedPackage = await MedicalTourism.findByIdAndDelete(req.params.id);
        if (!deletedPackage) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }
        res.status(200).json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete package', error: error.message });
    }
};
