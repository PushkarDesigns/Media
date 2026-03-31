import fs from "fs";
import imageKit from "../configs/imageKit.js";
import User from "../models/User.js";
import Story from "../models/Story.js";
import { inngest } from "../inngest/index.js";

// add user story
export const addUserStory = async (req, res) => {
    try {
        const { userId } = req.auth(); // Getting user from Clerk or similar auth
        const { content, media_type, background_color } = req.body;
        const media = req.file; // Assuming you're using Multer
        let media_url = '';

        // 1. Upload media to ImageKit if it's an image or video
        if (media && (media_type === 'image' || media_type === 'video')) {
            const fileBuffer = fs.readFileSync(media.path);

            const uploadResponse = await imageKit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            });

            media_url = response.url;
        }

        // 2. Create and save the story to MongoDB
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color
        });

        // Schedule story deletion after 24 hours
        await inngest.send({
            name: 'app/story.delete',
            data: { storyId: story._id }
        });

        return res.status(201).json({
            success: true,
            message: "Story added successfully!",
        });

    } catch (error) {
        console.error("Story Upload Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

// get user stroies
export const getStories = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId);

        // 1. Combine own ID, connections, and following into one array
        const userIds = [userId, ...user.connections, ...user.following];

        // 2. Find stories from anyone in that array
        const stories = await Story.find({
            user: { $in: userIds }
        }).populate('user') // Get user details (name, avatar, etc.).sort({ createdAt: -1 }); // Newest stories first

        // 3. Send response
        return res.json({ success: true, stories });

    } catch (error) {
        console.error("Story Upload Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}; 