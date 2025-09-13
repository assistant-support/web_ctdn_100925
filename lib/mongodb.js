import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    if (mongoose.connections[0].readyState) { isConnected = true; return }

    try {
        const db = await mongoose.connect(process.env.MongoDB_URI || 'mongodb+srv://web_ctdn_100925:GD2zc4BuaC3IffxU@ctdn100925.llu9goc.mongodb.net/data?retryWrites=true&w=majority&appName=ctdn100925');
        isConnected = db.connections[0].readyState === 1;
    } catch (error) { throw new Error('Failed to connect to MongoDB' + error) }
};

export default connectDB;
