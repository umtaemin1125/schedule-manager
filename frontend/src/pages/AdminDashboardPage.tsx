import { useEffect, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ForumIcon from "@mui/icons-material/Forum";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

type Role = "USER" | "ADMIN";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  _count: { schedules: number };
}

interface AdminSchedule {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  user: { id: string; email: string; name: string; role: Role };
}

interface AdminPost {
  id: string;
  title: string;
  type: "NOTICE" | "FREE";
  createdAt: string;
  user: { id: string; email: string; name: string; role: Role };
}

interface Overview {
  userCount: number;
  adminCount: number;
  scheduleCount: number;
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [schedules, setSchedules] = useState<AdminSchedule[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    try {
      setError("");
      const [overviewRes, usersRes, schedulesRes, postsRes] = await Promise.all([
        api.get<Overview>("/admin/overview"),
        api.get<AdminUser[]>("/admin/users"),
        api.get<AdminSchedule[]>("/admin/schedules"),
        api.get<AdminPost[]>("/admin/posts")
      ]);
      setOverview(overviewRes.data);
      setUsers(usersRes.data);
      setSchedules(schedulesRes.data);
      setPosts(postsRes.data);
    } catch {
      setError("관리자 데이터를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  return (
    <Box minHeight="100vh" sx={{ background: "linear-gradient(180deg, #f3fafb 0%, #ffffff 100%)" }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: "blur(8px)" }}>
        <Toolbar>
          <IconButton component={RouterLink} to="/" sx={{ mr: 1, color: "#00384d" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "#00384d", fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
          <Button component={RouterLink} to="/board" startIcon={<ForumIcon />} sx={{ mr: 1 }} variant="outlined">
            게시판
          </Button>
          <Button component={RouterLink} to="/" sx={{ mr: 1 }} variant="outlined">
            일정
          </Button>
          <Typography sx={{ mr: 2, color: "#00384d" }}>{user?.name}</Typography>
          <IconButton onClick={logout} sx={{ color: "#00384d" }}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box display="grid" gap={2} gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }} mb={3}>
          <Card><CardContent><Typography color="text.secondary">전체 사용자</Typography><Typography variant="h4">{overview?.userCount ?? "-"}</Typography></CardContent></Card>
          <Card><CardContent><Typography color="text.secondary">관리자 수</Typography><Typography variant="h4">{overview?.adminCount ?? "-"}</Typography></CardContent></Card>
          <Card><CardContent><Typography color="text.secondary">전체 일정</Typography><Typography variant="h4">{overview?.scheduleCount ?? "-"}</Typography></CardContent></Card>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>사용자 관리</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>이메일</TableCell>
                  <TableCell>권한</TableCell>
                  <TableCell>일정 수</TableCell>
                  <TableCell align="right">작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.role}
                        onChange={async (e) => {
                          const role = e.target.value as Role;
                          await api.patch(`/admin/users/${row.id}`, { role });
                          await fetchAll();
                        }}
                      >
                        <MenuItem value="USER">USER</MenuItem>
                        <MenuItem value="ADMIN">ADMIN</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>{row._count.schedules}</TableCell>
                    <TableCell align="right">
                      <Button
                        color="error"
                        onClick={async () => {
                          await api.delete(`/admin/users/${row.id}`);
                          await fetchAll();
                        }}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>전체 일정 관리</Typography>
            <Stack spacing={1.5}>
              {schedules.map((s) => (
                <Box
                  key={s.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                  p={1.5}
                  border="1px solid #e8eef0"
                  borderRadius={2}
                >
                  <Box>
                    <Typography fontWeight={700}>{s.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(s.startAt).toLocaleString()} ~ {new Date(s.endAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.user.name} ({s.user.email})
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label={s.user.role} size="small" color={s.user.role === "ADMIN" ? "secondary" : "default"} />
                    <Button
                      color="error"
                      onClick={async () => {
                        await api.delete(`/admin/schedules/${s.id}`);
                        await fetchAll();
                      }}
                    >
                      일정 삭제
                    </Button>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>전체 게시글 관리</Typography>
            <Stack spacing={1.5}>
              {posts.map((p) => (
                <Box
                  key={p.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                  p={1.5}
                  border="1px solid #e8eef0"
                  borderRadius={2}
                >
                  <Box>
                    <Typography fontWeight={700}>{p.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.type} · {p.user.name} ({p.user.email}) · {new Date(p.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Button
                    color="error"
                    onClick={async () => {
                      await api.delete(`/admin/posts/${p.id}`);
                      await fetchAll();
                    }}
                  >
                    게시글 삭제
                  </Button>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
