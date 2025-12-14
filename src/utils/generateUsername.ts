import slugify from 'slugify';
import User from '../models/userModel.js';

export const generateUsername = async (firstName: string, lastName: string) => {
  const baseUsername = slugify.default(`${firstName} ${lastName}`, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${baseUsername}-${counter}`;
    counter++;
  }

  return username;
};
