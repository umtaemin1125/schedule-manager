import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <Box className="auth-layout">
      <Card className="auth-card">
        <CardContent>
          <Typography variant="h4" mb={1}>로그인</Typography>
          <Typography color="text.secondary" mb={3}>일정 관리 시스템에 접속합니다.</Typography>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button
              variant="contained"
              size="large"
              onClick={async () => {
                try {
                  setError("");
                  await login(email, password);
                  navigate("/");
                } catch {
                  setError("로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.");
                }
              }}
            >
              로그인
            </Button>
            <Typography variant="body2">
              계정이 없나요? <Link component={RouterLink} to="/register">회원가입</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
