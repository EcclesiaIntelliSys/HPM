export function calculateOrder(project, config) {
  const addonsTotal =
    (project.addons?.fastTrack ? config.fastTrackPrice : 0) +
    (project.addons?.nextDay ? config.nextDayPrice : 0) +
    (project.addons?.lyricVideo ? config.lyricVideoPrice : 0) +
    (project.addons?.commercialRights ? config.commercialRightsPrice : 0);

  let deliveryDays = 5;

  if (project.addons?.nextDay) deliveryDays = 1;
  else if (project.addons?.fastTrack) deliveryDays = 3;

  if (project.addons?.lyricVideo) deliveryDays++;

  return {
    addonsTotal,
    deliveryDays,
  };
}
