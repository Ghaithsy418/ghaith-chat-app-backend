import mongoose from 'mongoose';

export const profileResource = (id: mongoose.Types.ObjectId) => {
  return [
    {
      $match: { _id: id },
    },
    {
      $addFields: {
        fullName: {
          $trim: {
            input: {
              $concat: [
                '$firstName',
                ' ',
                { $ifNull: ['$middleName', ''] },
                ' ',
                '$lastName',
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        firstName: 0,
        middleName: 0,
        lastName: 0,
      },
    },
  ];
};
