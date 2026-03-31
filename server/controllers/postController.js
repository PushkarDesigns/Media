// Importing the model we created earlier
import imagekit from '../configs/imageKit.js';
import Post from '../models/Post.js';
import fs from 'fs'
import User from '../models/User.js';

export const addPost = async (req, res) => {
    try {
        const { userId } = req.auth(); // Assuming Clerk or similar auth
        const { content, post_type } = req.body;
        const images = req.files;

        let image_urls = [];

        if (images && images.length > 0) { // images.length
            image_urls = await Promise.all(
                images.map(async (image) => {
                    // 1. Get the buffer from the uploaded file
                    const fileBuffer = fs.readFileSync(image.path);
                    const response = await imagekit.upload({
                        file: fileBuffer,
                        fileName: image.originalname,
                        folder: "posts",
                    });

                    const url = imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '1280' }
                        ]
                    });
                    return url
                })
            );
        }

        await Post.create({
            user: userId,
            content,
            image_urls,
            post_type
        })
        res.json({ success: true, message: "post created succesfully" });
    } catch (error) {
        // console.error("Add Post Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// get post
export const getFeedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    // Combine user's own ID with their connections and following list
    const userIds = [userId, ...user.connections, ...user.following];

    // Find all posts where the author is in the userIds array
    const posts = await Post.find({ user: { $in: userIds } })
      .populate('user') // Joins user details (name, avatar, etc.)
      .sort({ createdAt: -1 }); // Newest posts first

    res.json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// like post
export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);

    if (post.likes_count.includes(userId)) {
      // 1. Remove like using $pull (Atomic operation)
      post.likes_count = post.likes_count.filter(user => user !== userId)
      await post.save()
      return res.json({ success: true, message: 'Post unliked' });
    } else {
      // 2. Add like using $addToSet (Ensures no duplicates)
      post.likes_count.push(userId)
      await post.save()
      return res.json({ success: true, message: 'Post liked' }); // Fixed typo from 'unliked'
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
}
