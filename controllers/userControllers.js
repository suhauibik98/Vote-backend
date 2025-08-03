const Users = require("../models/Users");
const VoteMain = require("../models/VoteMain");

const editProfile = async (req, res) => {
  const { name, email } = req.body;

  try {
    const user = await Users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    user.name = name;
    user.email = email;
    await user.save();
    res
      .status(200)
      .json({ user, message: "Profile updated successfully", success: true });
  } catch (error) {
    console.log(error);
  }
};

const getVoteMainActive = async (req, res) => {
  try {
    // اجلب فقط الحقول الرئيسية المطلوبة
    const allVoteMain = await VoteMain.find({ isActive: true })
      .select("voteSubject startDateTime endDateTime candidates")
      .sort({ createdAt: -1 });

    // فلترة المرشحين داخل كل عنصر
    const filtered = allVoteMain.map((vote) => ({
      _id: vote._id,
      voteSubject: vote.voteSubject,
      startDateTime: vote.startDateTime,
      endDateTime: vote.endDateTime,
      candidates: vote.candidates.map((c) => ({
        _id: c._id,
        description: c.description,
      })),
    }));

    res.status(200).json({ voteMain: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const userVote = async (req, res) => {
  const { voteMainId, candidateId } = req.params;

  try {
    const user = await Users.findById(req.user._id);
    const vote = await VoteMain.findById(voteMainId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!vote) return res.status(404).json({ message: "Vote not found" });

    // Prevent duplicate voting in same vote
    const alreadyVoted = user.votedList.some(
      (entry) => entry.voteMainId?.toString() === voteMainId
    );

    if (alreadyVoted) {
      return res
        .status(400)
        .json({ message: "You have already voted in this vote." });
    }

    if (!vote.isActive) {
      return res
        .status(403)
        .json({ message: "Voting has ended or not started yet." });
    }
    if (!user.isVote) {
      console.log("User is blocked to Vote");
      return res.status(403).json({
        message: "User is blocked to Vote",
        success: false,
      });
    }
    // Find the candidate
    const candidate = vote.candidates.find(
      (c) => c._id.toString() === candidateId
    );
    if (!candidate) {
      return res
        .status(404)
        .json({ message: "Candidate not found in this vote." });
    }

    // Update vote: push user to candidate.votes
    candidate.votes.push({
      userId: user._id,
      // name: user.name,
    });
    candidate.voteCount += 1;
    vote.totalVotes += 1;

    // Update user.votedList: include candidate description

    user.votedList.push({
      voteMainId: vote._id,
      voteTo: candidate.userId,
      voteDate: new Date(),
      candidateDescription: candidate.description,
    });

    await user.save();
    await vote.save();

    return res.status(200).json({ message: "Vote submitted successfully." });
  } catch (err) {
    console.error("Voting error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// const votedList = async (req, res) => {
//   const { voted = [] } = req.body;

//   if (!Array.isArray(voted) || voted.length === 0) {
//     return res
//       .status(400)
//       .json({ message: "Please provide a list of voted VoteMain IDs" });
//   }

//   try {
//     const response = [];

//     for (const voteId of voted) {
//       const vote = await VoteMain.findById(voteId).select(
//         "voteSubject startDateTime endDateTime candidates isActive"
//       );

//       if (!vote) continue;

//       const candidates = vote.candidates.map((candidate) => {
//         const isVoted = candidate.votes.some(
//           (v) => v.toString() === req.user._id.toString()
//         );
//         return {
//           _id: candidate._id,
//           description: candidate.description,
//           isVoted,
//         };
//       });

//       response.push({
//         voteMainId: vote._id,
//         voteSubject: vote.voteSubject,
//         startDateTime: vote.startDateTime,
//         endDateTime: vote.endDateTime,
//         isActive: vote.isActive,
//         candidates,
//       });
//     }

//     return res.status(200).json({ votedList: response });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

const getVotedListUser = async (req, res) => {
  const { page = 1, limit = 6 } = req.query;

  try {
    // 1. جلب المستخدم مع التصويتات المرتبطة
    const user = await Users.findById(req.user._id)
      .populate({
        path: "votedList.voteMainId",
        select: "voteSubject startDateTime endDateTime candidates isActive",
      })
      .lean();

    // 2. تحقق من وجود المستخدم
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 3. حساب العدد الكلي للتصويتات
    const total = user.votedList.length;

    // 4. ترتيب التصويتات حسب تاريخ التصويت (الأحدث أولًا) + pagination
    const paginatedList = user.votedList
      .sort((a, b) => new Date(b.voteDate) - new Date(a.voteDate))
      .slice((page - 1) * limit, page * limit);

    // 5. تجهيز الرد النهائي
    const response = [];

    for (const voteItem of paginatedList) {
      const vote = voteItem.voteMainId;
      if (!vote) continue; // تخطي العناصر التي لم تُملأ عبر populate

      const candidates = vote.candidates.map((candidate) => {
        const isVoted = candidate.votes?.some(
          (v) => v.userId?.toString() === req.user._id.toString()
        );

        return {
          _id: candidate._id,
          description: candidate.description,
          isVoted: !!isVoted,
          voteDate: isVoted ? voteItem.voteDate : null,
        };
      });

      response.push({
        voteMainId: vote._id,
        voteSubject: vote.voteSubject,
        startDateTime: vote.startDateTime,
        endDateTime: vote.endDateTime,
        isActive: vote.isActive,
        candidates,
      });
    }

    // 6. إرسال الرد النهائي مع معلومات pagination
    res.status(200).json({
      votedList: response,
      pagination: {
        current_page: Number(page),
        total_pages: Math.ceil(total / limit),
        total_requests: total,
        has_next: Number(page) < Math.ceil(total / limit),
        has_prev: Number(page) > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
const getVotedListUserForActive = async (req, res) => {
  try {
    const user = await Users.findById(req.user._id)
      .populate({
        path: "votedList.voteMainId",
        select: "voteSubject startDateTime endDateTime candidates isActive",
      })
      .lean();

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }



    const paginatedList = user.votedList
      .sort((a, b) => new Date(b.voteDate) - new Date(a.voteDate))
     

    const response = [];

    for (const voteItem of paginatedList) {
      const vote = voteItem.voteMainId;
      if (!vote) continue; // تخطي العناصر التي لم تُملأ عبر populate

      const candidates = vote.candidates.map((candidate) => {
        const isVoted = candidate.votes?.some(
          (v) => v.userId?.toString() === req.user._id.toString()
        );

        return {
          _id: candidate._id,
          description: candidate.description,
          isVoted: !!isVoted,
          voteDate: isVoted ? voteItem.voteDate : null,
        };
      });

      response.push({
        voteMainId: vote._id,
        voteSubject: vote.voteSubject,
        startDateTime: vote.startDateTime,
        endDateTime: vote.endDateTime,
        isActive: vote.isActive,
        candidates,
      });
    }

    res.status(200).json({
      votedList: response,
      
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


const getCommingVote = async (req, res) => {
  try {
    const now = new Date();
    const allVoteMain = await VoteMain.find({
      isActive: false,
      startDateTime: { $gt: now },
    })
      .select("voteSubject startDateTime endDateTime candidates")
      .sort({ createdAt: -1 });
    const filtered = allVoteMain.map((vote) => ({
      _id: vote._id,
      voteSubject: vote.voteSubject,
      startDateTime: vote.startDateTime,
      endDateTime: vote.endDateTime,
      candidates: vote.candidates.map((c) => ({
        _id: c._id,
        description: c.description,
      })),
    }));
    res.status(200).json({ comingVoteList: filtered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getDataForDashBoard = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user._id; // ✅ افترضنا عندك auth middleware

    const AvailableVote = await VoteMain.countDocuments({ isActive: true });
    const PendingVotes = await VoteMain.countDocuments({
      isActive: false,
      startDateTime: { $gt: now },
    });
    const EndsVotes = await VoteMain.countDocuments({
      isActive: false,
      endDateTime: { $lt: now },
    });
    const TotalUser = await Users.countDocuments();

    // ✅ جمع totalVotes
    const totalVotesAgg = await VoteMain.aggregate([
      { $group: { _id: null, total: { $sum: "$totalVotes" } } },
    ]);
    const TotalVotes = totalVotesAgg[0]?.total || 0;

    // ✅ آخر تصويت قام به المستخدم
    const lastVoteAgg = await VoteMain.aggregate([
      { $unwind: "$candidates" },
      { $unwind: "$candidates.votes" },
      // { $match: { "candidates.votes.userId": userId } },
      {
        $lookup: {
          from: "users", // ✅ تأكد من اسم مجموعة الـ Users في قاعدة البيانات
          localField: "candidates.votes.userId",
          foreignField: "_id",
          as: "voterUser",
        },
      },
      { $unwind: "$voterUser" }, // عشان ناخذ أول نتيجة فقط (المفروض واحدة)
      { $sort: { "candidates.votes.createdAt": -1 } },
      { $limit: 10 },
      {
        $project: {
          voteSubject: 1,
          votedAt: "$candidates.votes.createdAt",
          name: "$voterUser.name", // ✅ الاسم من جدول Users
          // candidateDescription: "$candidates.description"
        },
      },
    ]);
    const lastVote = lastVoteAgg || null;

    res.status(200).json({
      AvailableVote,
      PendingVotes,
      EndsVotes,
      TotalUser,
      TotalVotes,
      lastVote,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  editProfile,
  getVoteMainActive,
  userVote,
  getDataForDashBoard,
  getVotedListUser,
  getCommingVote,
  getVotedListUserForActive
};
