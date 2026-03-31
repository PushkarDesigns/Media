import express from 'express';
import { upload } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';
import { addPost, getFeedPosts, likePost } from '../controllers/postController.js';

const postRouter = express.Router();

// Route for creating a post with up to 4 images
postRouter.post('/add', upload.array('images', 4), protect, addPost);

// Route for fetching the personalized feed
postRouter.get('/feed', protect, getFeedPosts);

// Route for liking/unliking a post
postRouter.post('/like', protect, likePost);

export default postRouter;
