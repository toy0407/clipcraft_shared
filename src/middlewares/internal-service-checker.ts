export const internalServiceVerifier = () => {
  return (req: any, res: any, next: any) => {
    const serviceKey = req.headers["x-service-key"];
    if (!serviceKey || serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
      return res.status(403).json({
        isSuccess: false,
        error: "Forbidden: Invalid internal service key",
      });
    }
    next();
  };
};
