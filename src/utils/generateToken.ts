import jwt from "jsonwebtoken";

export const generateToken = function (
  userId: string,
  type: "access" | "refresh"
): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY as string, {
    expiresIn: type === "access" ? "2h" : "1y",
  });
};
