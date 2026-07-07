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

export const generateAdminRefreshToken = (adminId) => {
  return jwt.sign(
    {
      id: adminId,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE_Admin,
    },
  );
};
