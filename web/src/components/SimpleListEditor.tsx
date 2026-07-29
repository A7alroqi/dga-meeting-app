import { useState } from "react";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Box,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

interface Item {
  id: string;
  sortOrder: number;
}

export function SimpleListEditor<T extends Item>({
  items,
  field,
  canEdit,
  onAdd,
  onDelete,
  placeholder,
}: {
  items: T[];
  field: keyof T;
  canEdit: boolean;
  onAdd: (value: string) => void;
  onDelete: (id: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <List>
        {[...items]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => (
            <ListItem
              key={item.id}
              secondaryAction={
                canEdit ? (
                  <IconButton edge="end" onClick={() => onDelete(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                ) : undefined
              }
            >
              <ListItemText primary={String(item[field])} />
            </ListItem>
          ))}
        {items.length === 0 && (
          <ListItem>
            <ListItemText primary="لا توجد عناصر بعد" />
          </ListItem>
        )}
      </List>
      {canEdit && (
        <Box display="flex" gap={1} mt={1}>
          <TextField
            size="small"
            fullWidth
            placeholder={placeholder ?? "إضافة عنصر جديد"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onAdd(draft.trim());
                setDraft("");
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!draft.trim()}
            onClick={() => {
              onAdd(draft.trim());
              setDraft("");
            }}
          >
            إضافة
          </Button>
        </Box>
      )}
    </Paper>
  );
}
