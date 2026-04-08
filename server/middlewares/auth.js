// export const protect = async (req, res, next) => {
//   try {
//     const {userId} = req.auth();
//     if(!userId){
//         return res.json({success: false, message: "not authenticated" })
//     }
//     next()
//   } catch (error) {
//     res.json({success: false, message: error.message })
//   }
// }
import { getAuth } from '@clerk/express'

export const protect = async (req, res, next) => {
  try {
    const { userId } = getAuth(req)  // ✅ getAuth use karo
    console.log('userId =>', userId)
    if (!userId) {
      return res.json({ success: false, message: "not authenticated" })
    }
    req.userId = userId
    next()
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}