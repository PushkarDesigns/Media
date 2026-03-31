import express from 'express';
import { upload } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';
import { addUserStory, getStories } from '../controllers/storyController.js';

const storyRouter = express.Router();

// 1. Create a story (POST)
// Uses Multer middleware to handle a single file upload with the field name 'media'
storyRouter.post('/create', upload.single('media'), protect, addUserStory);

// 2. Fetch stories feed (GET)
// Protected by auth middleware to ensure only logged-in users see the feed
storyRouter.get('/get', protect, getStories);

export default storyRouter;
