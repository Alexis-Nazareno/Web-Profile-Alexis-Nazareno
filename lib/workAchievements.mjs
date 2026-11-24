export function isWorkAchievement(item) {
  return item?.contentType === "workAchievement" || Boolean(item?.document);
}

export function splitTrainingAndWorkAchievements(items) {
  const training = [];
  const workAchievements = [];
  for (const item of items) {
    (isWorkAchievement(item) ? workAchievements : training).push(item);
  }
  return { training, workAchievements };
}
