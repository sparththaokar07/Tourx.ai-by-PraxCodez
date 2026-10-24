export interface DayPlan {
  day: number;
  title: string;
  activities: { time: string; activity: string; tag: string }[];
}

export function generateDynamicItinerary(dest: string, days: number): DayPlan[] {
  const cleanDest = dest.split(",")[0].trim();
  const schedule: DayPlan[] = [];

  for (let i = 1; i <= days; i++) {
    if (i === 1) {
      schedule.push({
        day: 1,
        title: `Arrival & City Center Setup (${cleanDest})`,
        activities: [
          { time: "10:00 AM", activity: `Check-in and refresh at transit accommodation.`, tag: "Logistics" },
          { time: "01:30 PM", activity: `Sample regional cuisine at central culinary hubs.`, tag: "Food" },
          { time: "05:00 PM", activity: `Orientation walk and sunset viewing at central landmark spots.`, tag: "Exploration" },
          { time: "08:30 PM", activity: "Traditional dinner and budget tracking review.", tag: "Dining" },
        ],
      });
    } else if (i === days) {
      schedule.push({
        day: i,
        title: `Souvenirs & Departure from ${cleanDest}`,
        activities: [
          { time: "09:00 AM", activity: "Morning local bazaar exploration and souvenir pickup.", tag: "Shopping" },
          { time: "01:00 PM", activity: "Checkout from hotel and luggage locker check-in.", tag: "Logistics" },
          { time: "04:30 PM", activity: "Transit station/airport terminal transfer for return journey.", tag: "Transit" },
        ],
      });
    } else {
      schedule.push({
        day: i,
        title: `Deep Exploration & Heritage Circuit - Day ${i}`,
        activities: [
          { time: "08:30 AM", activity: `Early morning excursion to major heritage sites & monuments.`, tag: "Sightseeing" },
          { time: "01:00 PM", activity: `Lunch at authentic local café.`, tag: "Dining" },
          { time: "03:30 PM", activity: `Cultural district, museum, or artisan village walkthrough.`, tag: "Culture" },
          { time: "07:00 PM", activity: `Evening street markets, photography, and leisure time.`, tag: "Leisure" },
        ],
      });
    }
  }

  return schedule;
}
