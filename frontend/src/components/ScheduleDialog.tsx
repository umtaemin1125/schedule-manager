import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField
} from "@mui/material";
import type { Schedule } from "../types";

interface Props {
  open: boolean;
  initialValue?: Schedule | null;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    isAllDay: boolean;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function toInputDateTime(value: string) {
  return value.slice(0, 16);
}

export default function ScheduleDialog({ open, initialValue, onClose, onSubmit, onDelete }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const invalidDateRange = !startAt || !endAt || new Date(startAt) > new Date(endAt);

  useEffect(() => {
    if (!initialValue) {
      setTitle("");
      setDescription("");
      setStartAt("");
      setEndAt("");
      setIsAllDay(false);
      return;
    }

    setTitle(initialValue.title);
    setDescription(initialValue.description ?? "");
    setStartAt(toInputDateTime(initialValue.startAt));
    setEndAt(toInputDateTime(initialValue.endAt));
    setIsAllDay(initialValue.isAllDay);
  }, [initialValue]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialValue ? "일정 수정" : "새 일정 추가"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <TextField
            label="설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
          />
          <Box display="grid" gap={2} gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}>
            <TextField
              label="시작"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="종료"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
          <FormControlLabel
            control={<Checkbox checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} />}
            label="하루 종일"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        {initialValue && onDelete && (
          <Button
            color="error"
            onClick={async () => {
              await onDelete();
              onClose();
            }}
          >
            삭제
          </Button>
        )}
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="contained"
          disabled={!title || invalidDateRange}
          onClick={async () => {
            await onSubmit({
              title,
              description: description || undefined,
              startAt: new Date(startAt).toISOString(),
              endAt: new Date(endAt).toISOString(),
              isAllDay
            });
          }}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
