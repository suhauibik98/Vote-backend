const express = require("express")
const { addNewUser,getDataForDashBoardAdmin,getUpcommingVote,editUser,deleteUserAndHisVoted,changeUserActivation,getAllActiveVote,getWinnerName, getEndsVote,deleteUser ,getPendingRequests ,getAllRequests ,approveRequest , rejectRequest, getAllUserName, addNewVote} = require("../controllers/adminControllers")
const { verifyAdmin } = require("../middleware/verifyAdmin")
const router = express.Router()

// api for admin


router.post("/create-new-user" ,verifyAdmin  , addNewUser)

// router.delete("/delete-user/:emp_id" , deleteUser)

//must add middleware to check if user is admin
router.get('/requests/pending',verifyAdmin, getPendingRequests);
router.get('/requests',verifyAdmin, getAllRequests);
router.post('/requests/:requestId/approve',verifyAdmin, approveRequest);
router.post('/requests/:requestId/reject',verifyAdmin, rejectRequest);
router.post('/change-user-activation/:userId',verifyAdmin, changeUserActivation);
router.delete('/delete-user-and-his-voted/:userId',verifyAdmin, deleteUserAndHisVoted);
router.put('/edit-user/:userId',verifyAdmin, editUser);



// admin vote 
router.get('/users-name',verifyAdmin, getAllUserName);
router.post('/add-new-vote',verifyAdmin, addNewVote);
router.get("/get-ends-vote" ,verifyAdmin,getEndsVote )
router.post("/get-winner-name/:winnerId",verifyAdmin ,getWinnerName )
router.get("/get-all-active-vote",verifyAdmin ,getAllActiveVote )
router.get("/get-upcomming-vote",verifyAdmin ,getUpcommingVote )

//admin dashboard 
router.get("/get-data-dashboard",verifyAdmin ,getDataForDashBoardAdmin )


module.exports = router