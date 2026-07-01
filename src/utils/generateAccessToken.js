import jwt from "jsonwebtoken";

export const generateAccessToken = (student) => {
  return jwt.sign(
    {
      id: student._id,
      tv: student.tokenVersion,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
    },
  );
};
