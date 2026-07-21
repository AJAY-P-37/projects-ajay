const DEFAULT_MIRRORED_USER_IDS = ["CqhsM3xLbsNXCvJUv6Z7qzB3slj1"];

export const getMirroredUserIds = (): string[] => {
  const envValue = process.env.MIRRORED_USER_IDS || process.env.USER_IDS || "";

  if (!envValue) {
    return DEFAULT_MIRRORED_USER_IDS;
  }

  return envValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

export const shouldMirrorUser = (userId: string): boolean => {
  return getMirroredUserIds().includes(userId);
};
