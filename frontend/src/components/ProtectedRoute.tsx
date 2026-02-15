import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({
  children,
  roles
}: {
  children: JSX.Element;
  roles?: Array<"USER" | "ADMIN">;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
