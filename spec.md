# 12-Hour Habit Tracker

## Current State
Empty scaffold with no app logic.

## Requested Changes (Diff)

### Add
- Habit management: create habits with a name and a daily time goal (in hours/minutes)
- Daily tracking: log time spent on each habit each day
- Progress visualization: show progress toward 12-hour daily goal per habit
- Overall daily summary: total tracked time across all habits toward 12-hour goal
- Streak tracking: consecutive days a habit's goal was met
- History view: past days' completion status per habit

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend: store habits (id, name, targetMinutes), log entries (habitId, date, minutes), compute totals
2. Backend: getHabits, addHabit, deleteHabit, logTime, getLogsForDate, getTodaySummary, getStreak
3. Frontend: main dashboard showing today's habits with progress bars
4. Frontend: add/edit habit modal
5. Frontend: log time modal (enter minutes spent)
6. Frontend: streak badges and completion indicators
7. Frontend: history tab showing past 7 days
