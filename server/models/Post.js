import mongoose from 'mongoose';

const postsSchema = new mongoose.Schema({
  // Changed type to ObjectId for better performance and population
  user: { type: String, ref: 'User', required: true },
  content: { type: String },
  image_urls: [{ type: String }],
  post_type: { 
    type: String, 
    enum: ['text', 'image', 'text_with_image'], 
    required: true },
  // Changed to ObjectId to link directly to User documents
  likes_count: [{ type: String, ref: 'User' }],
}, { timestamps: true, minimize: false });

const Post = mongoose.model('Post', postsSchema);

export default Post;
