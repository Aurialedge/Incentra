import express from 'express'
import User from '../Models/user.model.js'
import verifytoken from '../Middleware/auth.js'

const router = express.Router()

function getCurrentTimeString() {
  const now = new Date()
  return now.toTimeString().split(' ')[0]  // ⬅️ "HH:MM:SS"
}

router.post("/", verifytoken, async (req, res) => {
  const id = req.user.id
  const user = await User.findById(id)
  
  if (!user) return res.status(404).json({ success:false, msg: "Invalid token, user not found" })

  // Use only time (HH:MM:SS)
  const currentTime = getCurrentTimeString()

  if (!user.loginstreak || user.loginstreak.length === 0) {
    user.loginstreak = [currentTime]
    await user.save()
    return res.status(200).json({ success:true, msg: `First login recorded at ${currentTime}` })
  }

  const dailylogin = user.loginstreak
  dailylogin.push(currentTime)

  let counter = 0
  // Compare consecutive logins
  for (let i = dailylogin.length - 2; i >= 0; i--) {
    if (dailylogin[i] === currentTime) {
      counter++
    } else {
      break
    }

    if (counter >= 7) {
      // Apply spam penalty
      user.mlScores = {
        ...user.mlScores,
        spamScore: user.mlScores?.spamScore ? user.mlScores.spamScore * 1.02 : 60
      }
      await user.save()
      return res.status(402).json({ success:false, msg: `Bot-like login detected at ${currentTime}` })
    }
  }

  user.loginstreak = dailylogin
  await user.save()
  return res.status(200).json({ success:true, msg: `Login recorded at ${currentTime}, not spam` })
})

export default router
