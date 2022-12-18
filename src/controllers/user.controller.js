const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    //TODO: Implement this API
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    const pipleline = [
      {
        $facet: {
          userCount: [
            {
              $count: "count",
            },
          ],
          users: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
            {
              $lookup: {
                from: "posts",
                let: {
                  uid: "$_id",
                },
                as: "posts",
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$$uid", "$userId"],
                      },
                    },
                  },
                  {
                    $count: "count",
                  },
                ],
              },
            },
            {
              $addFields: {
                posts: {
                  $first: "$posts.count",
                },
              },
            },
            {
              $unset: "__v",
            },
          ],
        },
      },
      {
        $addFields: {
          totalDocs: {
            $first: "$userCount.count",
          },
          totalPages: {
            $ceil: {
              $divide: [
                {
                  $first: "$userCount.count",
                },
                limit,
              ],
            },
          },
          pageCounter: page,
          limit: limit,
        },
      },
      {
        $project: {
          users: 1,
          pagination: {
            totalDocs: "$totalDocs",
            totalPages: "$totalPages",
            pageCounter: "$pageCounter",
            page: "$pageCounter",
            limit: "$limit",
            hasNextPage: {
              $ne: ["$pageCounter", "$totalPages"],
            },
            hasPrevPage: {
              $ne: ["$pageCounter", 1],
            },
            prevPage: {
              $cond: [
                {
                  $ne: ["$pageCounter", 1],
                },
                {
                  $subtract: ["$pageCounter", 1],
                },
                null,
              ],
            },
            nextPage: {
              $cond: [
                {
                  $ne: ["$pageCounter", "$totalPages"],
                },
                {
                  $add: ["$pageCounter", 1],
                },
                null,
              ],
            },
          },
        },
      },
    ];

    const users = await User.aggregate(pipleline);

    res.status(200).json({
      message: "Implement this API",
      data: users[0],
    });
  } catch (error) {
    res.send({ error: error.message });
  }
};
