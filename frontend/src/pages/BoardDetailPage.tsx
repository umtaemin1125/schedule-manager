import { useEffect, useRef, useState } from "react";
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
  Stack,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { BoardPost } from "../types";

export default function BoardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [post, setPost] = useState<BoardPost | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const quillRef = useRef<ReactQuill | null>(null);

  const fetchPost = async () => {
    const res = await api.get<BoardPost>(`/board/posts/${id}`);
    setPost(res.data);
  };

  useEffect(() => {
    if (!id) return;
    void fetchPost();
  }, [id]);

  const canEdit =
    !!post && (user?.role === "ADMIN" || (post.type === "FREE" && post.userId === user?.id));

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"]
    ],
    handlers: {
      image: async () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          const form = new FormData();
          form.append("image", file);
          const res = await api.post<{ url: string }>("/board/uploads", form, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          const editor = quillRef.current?.getEditor();
          if (!editor) return;
          const range = editor.getSelection(true);
          editor.insertEmbed(range?.index ?? 0, "image", res.data.url);
        };
      }
    }
  };

  if (!post) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: "center" }}>
        <Typography>게시글을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" sx={{ background: "linear-gradient(180deg, #f5f7fa 0%, #ffffff 60%)" }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: "blur(8px)" }}>
        <Toolbar>
          <IconButton component={RouterLink} to="/board" sx={{ mr: 1, color: "#111" }}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "#111", fontWeight: 700 }}>게시글 상세</Typography>
          <Typography sx={{ mr: 2, color: "#333" }}>{user?.name}</Typography>
          <IconButton onClick={logout} sx={{ color: "#111" }}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ borderRadius: 4, boxShadow: "0 20px 44px rgba(0,0,0,0.08)" }}>
          <CardContent>
            <Typography variant="h4" mb={1}>{post.title}</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {post.type} · {post.user.name} ({post.user.email}) · {new Date(post.createdAt).toLocaleString()}
            </Typography>
            <Box
              sx={{
                color: "#1d1d1f",
                "& p": { m: 0, mb: 1 },
                "& img": { maxWidth: "100%", borderRadius: 2 }
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {canEdit && (
              <Stack direction="row" spacing={1} mt={3}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setTitle(post.title);
                    setContent(post.content);
                    setOpen(true);
                  }}
                >
                  수정
                </Button>
                <Button
                  color="error"
                  onClick={async () => {
                    await api.delete(`/board/posts/${post.id}`);
                    navigate("/board");
                  }}
                >
                  삭제
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>게시글 수정</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
            <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button
            variant="contained"
            disabled={!title || !content}
            onClick={async () => {
              await api.patch(`/board/posts/${post.id}`, { title, content });
              setOpen(false);
              await fetchPost();
            }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
