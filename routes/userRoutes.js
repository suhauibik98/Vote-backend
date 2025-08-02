const express = require("express")
const router = express.Router()
const { verifyUser } = require("../middleware/verifyUser")
const { getDataForDashBoard,getCommingVote,getVotedListUser , getVoteMainActive  , userVote, editProfile } = require("../controllers/userControllers")
const { signout } = require("../controllers/authControllers")


// api for auth users

router.get("/logout" ,verifyUser,  signout )

router.get("/get-voted-list-user" , verifyUser , getVotedListUser)

router.get("/get-vote-main-active" ,verifyUser,  getVoteMainActive )

router.get("/get-comming-vote" ,verifyUser,  getCommingVote )

router.get("/get-data-for-dashboard" ,verifyUser,  getDataForDashBoard )

router.post("/user-vote/:voteMainId/:candidateId" ,verifyUser , userVote )

router.patch("/edit-profile" , verifyUser , editProfile)

module.exports = router