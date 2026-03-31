import User from "../models/User.js"
import fs from 'fs'
import imageKit from '../configs/imageKit.js'
import Connection from "../models/Connection.js"
import Post from "../models/Post.js"
import { inngest } from "../inngest/index.js"


// Get User Data using userId
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth()
    const user = await User.findById(userId)
    if (!user) {
      return res.json({ success: false, message: "User not found" })
    }
    res.json({ success: true, user })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// update user data
export const updateUserData = async (req, res) => {
  try {
    const { userId } = req.auth()
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId)

    !username && (username = tempUser.username)

    if (tempUser.username !== username) {
      const user = await User.findOne({ username })
      if (user) {
        // we will not change the username if it already taken
        username = tempUser.username
      }
    }

    const updatedData = {
      username,
      bio,
      location,
      full_name
    }

    const profile = req.files.profile && req.files.profile[0]
    const cover = req.files.cover && req.files.cover[0]

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imageKit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: 'auto' },
          { format: 'webp' },
          { width: '512' }
        ]
      });
      updateUserData.profile_picture = url;
    }

    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imageKit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: 'auto' },
          { format: 'webp' },
          { width: '1280' }
        ]
      });
      updateUserData.cover_photo = url;
    }
    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true })

    res.json({ success: true, user, message: 'Profile updated successfully' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// find users using username,email, location, name
export const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { input } = req.body;

    const allUsers = await User.find(
      {
        $or: [
          { username: new RegExp(input, 'i') },
          { email: new RegExp(input, 'i') },
          { full_name: new RegExp(input, 'i') },
          { location: new RegExp(input, 'i') },
        ]
      }
    )

    const filteredUsers = allUsers.filter(user => user._id !== userId);

    res.json({ success: true, users: filteredUsers })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

// follow user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { id } = req.body;

    const user = await User.findById(userId)

    if (user.following.includes(id)) {
      return res.json({ success: false, message: 'You are already following this user' })
    }

    user.following.push(id);
    await user.save()

    const toUser = await User.findById(id)
    toUser.followers.push(userId)
    await toUser.save()

    res.json({ success: true, message: 'Now you are following this user' })


  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

//  unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { id } = req.body;

    const user = await User.findById(userId)
    user.following = user.following.filter(user => user !== id);
    await user.save()

    const toUser = await User.findById(userId)
    toUser.followers = toUser.followers.filter(user => user !== userId);
    await toUser.save()

    res.json({ success: true, message: 'Your are no longer following this user' })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

// send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    // 1. Rate Limit Check: Max 20 requests per 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionRequests = await Connection.find({
      from_user_id: userId,
      createdAt: { $gt: last24Hours } // Use 'createdAt' based on timestamps: true
    });

    if (connectionRequests >= 20) {
      return res.status(429).json({ success: false, message: "You have sent mmore than 20 connection requests in the last 24 hours" });
    }

    // check if the users are already connected
    const connection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId }
      ]
    });

    // 3. Create the Connection Request
    if (!connection) {
      const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      })

      await inngest.send({
        name: 'app/connection-request',
        data: {connectionId: newConnection._id}
      })
      
      return res.status(429).json({ success: true, message: "Connection request sent successfully" });
    } else if (connection && connection.status === 'accepted') {
      return res.status(429).json({ success: false, message: "You are already connected with this user" });
    }
    return res.status(429).json({ success: false, message: "connection request pending" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// get user connection
export const getUserConnection = async (req, res) => {
  try {
    const { userId } = req.auth();
    // 1. Fetch user and populate their network arrays
    const user = await User.findById(userId).populate('connections followers following');

    const connections = user.connections;
    const followers = user.followers;
    const following = user.following;

    // 2. Fetch all pending connection requests sent TO this user
    // We populate 'from_user_id' to get the actual user details for the requester
    const pendingConnections = (await Connection.find({
      to_user_id: userId, status: 'pending'
    }).populate('from_user_id')).map(connection => connection.from_user_id);

    // 3. Return the consolidated network data
    res.json({ success: true, connections, followers, following, pendingConnections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// accept connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body; // The ID of the user who sent the request

    // 1. Verify the connection request exists and was sent TO the current user
    const connection = await Connection.findOne({ from_user_id: id, to_user_id: userId, status: 'pending' });

    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection request not found' });
    }

    // 2. Add each user to the other's connection list
    const user = await User.findById(userId);
    user.connections.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.connections.push(userId);
    await toUser.save();

    // 3. Finalize the request: Either update the status or delete the record
    // Option A: Keep history
    connection.status = 'accepted';
    await connection.save();

    // Option B: Delete the request record (uncomment if you prefer a clean DB)
    // await Connection.findByIdAndDelete(connection._id);

    res.status(200).json({ success: true, message: "Connection accepted successfully!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// get user profiles
export const getUserProfiles = async (req, res) => {
  try {
    const { profileId } = req.body;

    // 1. Find the user profile by ID
    const profile = await User.findById(profileId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // 2. Find all posts belonging to this user and populate user details
    const posts = await Post.find({ user: profileId }).populate('user');

    // 3. Return success response with data
    return res.status(200).json({
      success: true,
      profile,
      posts
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};