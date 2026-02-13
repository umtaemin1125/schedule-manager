import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@fullcalendar/core/index.css";
import "@fullcalendar/daygrid/index.css";
import "@fullcalendar/timegrid/index.css";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Toolbar,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import { api } from "../api/client";
import ScheduleDialog from "../components/ScheduleDialog";
import { useAuth } from "../contexts/AuthContext";
import type { Schedule } from "../types";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const fetchSchedules = async () => {
    try {
      const res = await api.get<Schedule[]>("/schedules");
      setSchedules(res.data);
    } catch {
      setError("일정 목록을 가져오는 데 실패했습니다.");
    }
  };

  useEffect(() => {
    void fetchSchedules();
  }, []);

  const events = useMemo(
    () =>
      schedules.map((s) => ({
        id: s.id,
        title: s.title,
        start: s.startAt,
        end: s.endAt,
        allDay: s.isAllDay
      })),
    [schedules]
  );

  return (
    <Box minHeight="100vh" sx={{ background: "linear-gradient(180deg, #eaf8fb 0%, #f7fbfc 50%, #f7fbfc 100%)" }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: "blur(8px)" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "#00384d", fontWeight: 700 }}>
            Schedule Manager
          </Typography>
          <Typography sx={{ mr: 2, color: "#00384d" }}>{user?.name}</Typography>
          <IconButton onClick={logout} sx={{ color: "#00384d" }}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Paper sx={{ p: 3, boxShadow: "0 12px 30px rgba(10,77,104,0.12)" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">내 일정 캘린더</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              일정 추가
            </Button>
          </Box>

          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            events={events}
            eventClick={(arg) => {
              const found = schedules.find((s) => s.id === arg.event.id);
              if (found) {
                setEditing(found);
                setDialogOpen(true);
              }
            }}
            height="75vh"
            locale="ko"
          />
        </Paper>
      </Container>

      <ScheduleDialog
        open={dialogOpen}
        initialValue={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={async (payload) => {
          if (editing) {
            await api.patch(`/schedules/${editing.id}`, payload);
          } else {
            await api.post("/schedules", payload);
          }
          setDialogOpen(false);
          await fetchSchedules();
        }}
        onDelete={
          editing
            ? async () => {
                await api.delete(`/schedules/${editing.id}`);
                await fetchSchedules();
              }
            : undefined
        }
      />
    </Box>
  );
}
