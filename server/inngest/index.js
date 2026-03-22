import { Inngest } from "inngest";
import User from "../models/User.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });

// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event }) => {
    console.log("EVENT DATA:", event.data);
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    // Generate initial username from email
    let username = email_addresses[0].email_address.split('@')[0];

    // Check availability of username
    const user = await User.findOne({ username });

    if (user) {
      // Append random numbers if username is taken
      username = username + Math.floor(Math.random() * 10000);
    }

    // Save the new user to MongoDB
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      full_name: first_name + " " + last_name,
      username: username,
      profile_picture: image_url,
    };

    await User.create(userData);

    // return { message: "User synced successfully", userId: id };
  }
);

// Inngest Function to update user data to a database
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const updatedUserData = {
      email: email_addresses[0].email_address,
      full_name: first_name + ' ' + last_name,
      profile_picture: image_url
    }

    // Update the user record where _id matches Clerk's id
    await User.findByIdAndUpdate(id, updatedUserData);

    // return { message: "User updated successfully", userId: id };
  }
);

// Inngest Function to delete user data from the database
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-with-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event }) => {
    const { id } = event.data;

    // Permanently remove the user from MongoDB
    await User.findByIdAndDelete(id);

    // return { message: "User deleted successfully", userId: id };
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion
];