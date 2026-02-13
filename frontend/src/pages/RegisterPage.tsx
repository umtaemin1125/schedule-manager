import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <Box className="auth-layout">
      <Card className="auth-card">
        <CardContent>
          <Typography variant="h4" mb={1}>회원가입</Typography>
          <Typography color="text.secondary" mb={3}>팀 단위 일정 관리를 시작하세요.</Typography>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="이름" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button
              variant="contained"
              size="large"
              onClick={async () => {
                try {
                  setError("");
                  await register(name, email, password);
                  navigate("/");
                } catch {
                  setError("회원가입에 실패했습니다. 입력값을 확인해주세요.");
                }
              }}
            >
              계정 생성
            </Button>
            <Typography variant="body2">
              이미 계정이 있나요? <Link component={RouterLink} to="/login">로그인</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
