import { Schedule } from '../types';

export const getScheduleTimeRange = (schedule: Schedule) => {
    if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
        return `${schedule.startTime} - ${schedule.endTime}`;
    }

    const activeDays = schedule.daysOfWeek;
    const allTimes: { start: string; end: string }[] = [];

    activeDays.forEach(dayId => {
        const config = schedule.daysConfig?.[dayId];
        if (config && config.startTime && config.endTime) {
            allTimes.push({ start: config.startTime, end: config.endTime });
        } else {
            allTimes.push({ start: schedule.startTime, end: schedule.endTime });
        }
    });

    if (allTimes.length === 0) {
        return `${schedule.startTime} - ${schedule.endTime}`;
    }

    const minTime = allTimes.reduce((min, curr) => (curr.start < min ? curr.start : min), allTimes[0].start);
    const maxTime = allTimes.reduce((max, curr) => (curr.end > max ? curr.end : max), allTimes[0].end);

    return `${minTime} - ${maxTime}`;
};
