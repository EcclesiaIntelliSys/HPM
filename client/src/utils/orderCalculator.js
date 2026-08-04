export function calculateOrder(project, config) {
  const addonsTotal =
    (project?.addons?.fastTrack ? (config?.fastTrackPrice ?? 0) : 0) +
    (project?.addons?.nextDay ? (config?.nextDayPrice ?? 0) : 0) +
    (project?.addons?.lyricVideo ? (config?.lyricVideoPrice ?? 0) : 0) +
    (project?.addons?.commercialRights
      ? (config?.commercialRightsPrice ?? 0)
      : 0);

  let deliveryDays = 5;

  if (project?.addons?.nextDay) {
    deliveryDays = 1;
  } else if (project?.addons?.fastTrack) {
    deliveryDays = config?.fastTrackDays ?? 3;
  }

  if (project?.addons?.lyricVideo) {
    deliveryDays += config?.lyricVideoDays ?? 1;
  }

  return {
    addonsTotal,
    deliveryDays,
  };
}
