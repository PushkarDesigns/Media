import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { inngest, functions } from './inngest/index.js'
import { serve } from 'inngest/express'
import { clerkMiddleware, getAuth } from '@clerk/express'
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';

await connectDB();

app.use(async (req, res, next) => {
  await initDB();
  next();
});

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/test-auth', (req, res) => {
  const { userId } = getAuth(req);
  console.log('Full auth object:', getAuth(req));
  res.json({ userId, auth: getAuth(req) });
});
console.log('Key:', process.env.CLERK_SECRET_KEY)
app.get('/', (req, res) => res.send('Server is running'));

// The route from your image
app.use("/api/inngest", serve({ client: inngest, functions }));
// console.log("Functions loaded:", functions);
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/story', storyRouter)
app.use('/api/message', messageRouter)

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})

export default app; 