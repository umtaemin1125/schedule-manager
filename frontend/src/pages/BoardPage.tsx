import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import ShieldIcon from "@mui/icons-material/Shield";
import AddIcon from "@mui/icons-material/Add";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { BoardPost } from "../types";

export default function BoardPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"NOTICE" | "FREE">("NOTICE");
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BoardPost | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"NOTICE" | "FREE">("FREE");

  const canCreateNotice = user?.role === "ADMIN";

  const fetchPosts = async (nextType: "NOTICE" | "FREE") => {
    const res = await api.get<BoardPost[]>(`/board/posts?type=${nextType}`);
    setPosts(res.data);
  };

  useEffect(() => {
    void fetchPosts(tab);
  }, [tab]);

  const canCreateCurrent = useMemo(() => tab === "FREE" || canCreateNotice, [tab, canCreateNotice]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"]
    ]
  };

  return (
    <Box minHeight="100vh" sx={{ background: "linear-gradient(180deg, #f5f7fa 0%, #ffffff 60%)" }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: "blur(8px)" }}>
        <Toolbar>
          <IconButton component={RouterLink} to="/" sx={{ mr: 1, color: "#111" }}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "#111", fontWeight: 700 }}>커뮤니티</Typography>
          {user?.role === "ADMIN" && (
            <Button component={RouterLink} to="/admin" startIcon={<ShieldIcon />} sx={{ mr: 1 }} variant="outlined">
              관리자 대시보드
            </Button>
          )}
          <Button component={RouterLink} to="/" sx={{ mr: 1 }} variant="outlined">일정</Button>
          <Typography sx={{ mr: 2, color: "#333" }}>{user?.name}</Typography>
          <IconButton onClick={logout} sx={{ color: "#111" }}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card sx={{ mb: 2, borderRadius: 4, boxShadow: "0 20px 44px rgba(0,0,0,0.08)" }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label="공지사항" value="NOTICE" />
                <Tab label="자유게시판" value="FREE" />
              </Tabs>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!canCreateCurrent}
                onClick={() => {
                  setEditing(null);
                  setTitle("");
                  setContent("");
                  setType(tab);
                  setOpen(true);
                }}
              >
                글쓰기
              </Button>
            </Box>

            <Stack spacing={1.5}>
              {posts.map((post) => {
                const canEdit = user?.role === "ADMIN" || (post.type === "FREE" && post.userId === user?.id);
                return (
                  <Box key={post.id} sx={{ p: 2, border: "1px solid #eceff3", borderRadius: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{post.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {post.user.name} · {new Date(post.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        color: "#1d1d1f",
                        "& p": { m: 0, mb: 1 },
                        "& img": { maxWidth: "100%", borderRadius: 2 }
                      }}
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                    {canEdit && (
                      <Box display="flex" gap={1} mt={1}>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditing(post);
                            setTitle(post.title);
                            setContent(post.content);
                            setType(post.type);
                            setOpen(true);
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={async () => {
                            await api.delete(`/board/posts/${post.id}`);
                            await fetchPosts(tab);
                          }}
                        >
                          삭제
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? "게시글 수정" : "새 게시글"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField
              select
              label="게시판"
              value={type}
              onChange={(e) => setType(e.target.value as "NOTICE" | "FREE")}
              disabled={!canCreateNotice}
            >
              <MenuItem value="NOTICE">공지사항</MenuItem>
              <MenuItem value="FREE">자유게시판</MenuItem>
            </TextField>
            <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button
            variant="contained"
            disabled={!title || !content}
            onClick={async () => {
              if (editing) {
                await api.patch(`/board/posts/${editing.id}`, { title, content });
              } else {
                await api.post("/board/posts", { title, content, type });
              }
              setOpen(false);
              await fetchPosts(tab);
            }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
