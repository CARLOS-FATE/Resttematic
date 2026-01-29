
import mongoose from 'mongoose';
import MenuItem from './api/models/MenuItem.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, './.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        // 1. Drop the old index on 'nombre'
        try {
            await MenuItem.collection.dropIndex("nombre_1");
            console.log("Success: Dropped index 'nombre_1'");
        } catch (error) {
            console.log("Info: Index 'nombre_1' probably doesn't exist or already dropped. Error:", error.codeName || error.message);
        }

        // 2. The new index is defined in the Schema, so ensureIndexes will create it
        // However, we want to be explicit.
        // Mongoose usually creates indexes on app startup, but we can force it here.
        await MenuItem.syncIndexes();
        console.log("Success: Synced indexes based on current Schema.");

        console.log("Done.");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

connectDB();
