const jwtSecret = process.env.JWT_SECRET;

if (typeof jwtSecret !== "string" || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

export const JWT_SECRET = jwtSecret;
