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
export const protect = async (req, res, next) => {
  try {
    const { userId } = req.auth;  // ✅ function call nahi, object hai
    if (!userId) {
      return res.json({ success: false, message: "not authenticated" });
    }
    req.userId = userId;  // ✅ aage controllers mein use kar sako
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}