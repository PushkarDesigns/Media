import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import sendEmail from "../configs/nodeMailer.js";
import Story from "../models/Story.js";

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

// Inngest Function to send Reminder when a new connection request is added
const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "app/connection-request" },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    await step.run('send-connection-request-mail', async () => {
      const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');

      
      const subject = `👋 New Connection Request`;
      const body = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hi ${connection.to_user_id.full_name},</h2>
          <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
          <br/>
          <p>Thanks,<br/>PingUp - Stay Connected</p>
        </div>`;

      // Add your email sending logic here (e.g., using the sendEmail function from before)
      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body
      });
    })
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);

    await step.run('send-connection-request-reminder', async () => {
      const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');

      if (connection.status === "accepted") {
        return { message: "Already accepted" };
      }

      const subject = `👋 New Connection Request`;
      const body = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hi ${connection.to_user_id.full_name},</h2>
          <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
          <br/>
          <p>Thanks,<br/>PingUp - Stay Connected</p>
        </div>`;

      // Complete the logic to send the reminder
      await sendEmail({
        to: connection.to_user_id.email,
        subject: "Pending Connection Request",
        body: `Hi ${connection.to_user_id.firstName}, you have a pending request from ${connection.from_user_id.firstName}.`
      });

      return { message: "Reminder sent" };
    });

  }
)

// inngest function to delete story after 24 hours
const deleteStory = inngest.createFunction(
    { id: 'story-delete' },
    { event: 'app/story.delete' },
    async ({ event, step }) => {
        const { storyId } = event.data;

        // 1. Calculate the time 24 hours from now
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // 2. Wait until that time
        await step.sleepUntil('wait-for-24-hours', in24Hours);

        // 3. Execute the deletion in the database
        await step.run("delete-story", async () => {
            return await Story.findByIdAndDelete(storyId);
            return { message: "Story deleted." }
        });
    }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory
];