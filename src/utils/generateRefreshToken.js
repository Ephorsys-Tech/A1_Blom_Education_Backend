import jwt from "jsonwebtoken";

export const generateRefreshToken = (studentId) => {
  return jwt.sign(
    {
      id: studentId,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    },
  );
};
