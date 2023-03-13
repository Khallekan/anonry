import jwt, { decode, JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';

const generateToken = function (
  userId: string | Types.ObjectId,
  type: 'access' | 'refresh'
): { token: string; token_expires: number } {
  const token = jwt.sign(
    { id: userId, type },
    process.env.JWT_SECRET_KEY as string,
    {
      expiresIn: type === 'access' ? '24h' : '1y',
    }
  );

  const tokens: JwtPayload | string | null = decode(token);
  let token_expires = 0;
  if (tokens && typeof tokens !== 'string') {
    const { exp } = tokens;
    token_expires = exp ? exp * 1000 : 0;
  }

  return { token, token_expires };
};

export default generateToken;
