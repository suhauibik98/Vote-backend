const VoteMain = require('../models/VoteMain'); // Adjust path to your model

// const checkAndUpdateVoteStatus = async () => {
//   try {
//     console.log('Starting vote status update check...');
    
//     const now = new Date();
    
//     // Find votes that need status updates
//     const votesToUpdate = await VoteMain.find({
//       $or: [
//         // Votes that should be active but aren't
//         {
//           isActive: false,
//           startDateTime: { $lte: now },
//           endDateTime: { $gt: now }
//         },
//         // Votes that should be inactive but are still active
//         {
//           isActive: true,
//           $or: [
//             { startDateTime: { $gt: now } }, // Not started yet
//             { endDateTime: { $lte: now } }   // Already ended
//           ]
//         }
//       ]
//     });

//     if (votesToUpdate.length === 0) {
//       console.log('No votes need status updates');
//       return;
//     }

//     console.log(`Found ${votesToUpdate.length} votes that need status updates`);

//     // Update each vote's status
//     const updatePromises = votesToUpdate.map(async (vote) => {
//       const shouldBeActive = vote.startDateTime <= now && vote.endDateTime > now;
      
//       if (vote.isActive !== shouldBeActive) {
//         vote.isActive = shouldBeActive;
//         await vote.save();
        
//         console.log(`Updated vote "${vote.voteSubject}" - Status: ${shouldBeActive ? 'Active' : 'Inactive'}`);
        
//         return {
//           voteId: vote._id,
//           voteSubject: vote.voteSubject,
//           oldStatus: !shouldBeActive,
//           newStatus: shouldBeActive,
//           startDateTime: vote.startDateTime,
//           endDateTime: vote.endDateTime
//         };
//       }
//     });

//     const results = await Promise.all(updatePromises);
//     const updatedVotes = results.filter(result => result !== undefined);

//     console.log(`Successfully updated ${updatedVotes.length} vote statuses`);
    
//     return {
//       success: true,
//       updatedCount: updatedVotes.length,
//       updatedVotes: updatedVotes,
//       timestamp: now
//     };

//   } catch (error) {
//     console.error('Error updating vote statuses:', error.message);
    
//     return {
//       success: false,
//       error: error.message,
//       timestamp: new Date()
//     };
//   }
// };

// Alternative bulk update version (more efficient for large datasets)
const checkAndUpdateVoteStatusBulk = async () => {
  try {
    console.log('Starting bulk vote status update...');
    
    const now = new Date();

    // Bulk update - set votes to active
    const activateResult = await VoteMain.updateMany(
      {
        isActive: false,
        startDateTime: { $lte: now },
        endDateTime: { $gt: now }
      },
      {
        $set: { isActive: true, updatedAt: now }
      }
    );

    // Bulk update - set votes to inactive
    const deactivateResult = await VoteMain.updateMany(
      {
        isActive: true,
        $or: [
          { startDateTime: { $gt: now } },
          { endDateTime: { $lte: now } }
        ]
      },
      {
        $set: { isActive: false, updatedAt: now }
      }
    );

    const totalUpdated = activateResult.modifiedCount + deactivateResult.modifiedCount;

    console.log(`Bulk update completed:`);
    console.log(`- Activated: ${activateResult.modifiedCount} votes`);
    console.log(`- Deactivated: ${deactivateResult.modifiedCount} votes`);
    console.log(`- Total updated: ${totalUpdated} votes`);

    return {
      success: true,
      activated: activateResult.modifiedCount,
      deactivated: deactivateResult.modifiedCount,
      totalUpdated: totalUpdated,
      timestamp: now
    };

  } catch (error) {
    console.error('Error in bulk vote status update:', error.message);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

module.exports = {
  checkAndUpdateVoteStatusBulk
};