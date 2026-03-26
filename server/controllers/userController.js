import User from "../models/User.js"
import fs from 'fs'
import imageKit from '../configs/imageKit.js'

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
    const { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId)

    !username && (username = tempUser.username)

    if (tempUser.username !== username) {
      const user = User.findOne({ username })
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