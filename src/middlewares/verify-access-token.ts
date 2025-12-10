import { UnauthenticatedError, ValidationError } from "../core/api/errors";
import jwt, { JwtPayload } from "jsonwebtoken";

export const verifyAccessToken = () => {
  return async (req: any, res: any, next: any) => {
    const authHeader: string = req.headers["authorization"];
    if (!authHeader) {
      throw new ValidationError("Missing Authorization header");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ValidationError("Missing token in Authorization header");
    }

    // Verify session using access token
    // const session = await DbClient.getInstance().session.findUnique({
    //   where: {
    //     accessToken: token,
    //     accessTokenExpiresAt: {
    //       gt: new Date(),
    //     },
    //     isActive: true,
    //     isRevoked: false,
    //   },
    // });

    try {
      const payload: JwtPayload = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as JwtPayload;
      req.userId = payload.userId;
      next();
    } catch (err) {
      throw new UnauthenticatedError("Invalid or expired access token");
    }
  };
};
