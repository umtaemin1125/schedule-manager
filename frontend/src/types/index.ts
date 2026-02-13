export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Schedule {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
}
