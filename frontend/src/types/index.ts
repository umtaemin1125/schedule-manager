export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

export interface Schedule {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
}

export interface BoardPost {
  id: string;
  title: string;
  content: string;
  type: "NOTICE" | "FREE";
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
  };
}
