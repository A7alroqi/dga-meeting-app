import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Paper,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import SlideshowRoundedIcon from "@mui/icons-material/SlideshowRounded";
import CloseFullscreenRoundedIcon from "@mui/icons-material/CloseFullscreenRounded";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import { useAuth } from "../AuthContext";
import { ROLE_LABELS_AR } from "@app/shared";
import { isAdmin } from "./RoleGuard";
import { DGA } from "../theme/rtlTheme";
import { removeTatweel } from "../utils/textUtils";
import { useChangeMyPassword } from "../api/hooks";
import { ApiError } from "../api/client";

dayjs.locale("ar");

const DRAWER_WIDTH_OPEN = 248;
const DRAWER_WIDTH_CLOSED = 72;
const SIDEBAR_STATE_KEY = "sidebar-collapsed";

// Presentation mode is view-only: pages read this to hide all edit controls.
const PresentingContext = createContext(false);
export function usePresenting() {
  return useContext(PresentingContext);
}

// في وضع العرض، الترتيب: الرئيسية → الأجندة → المؤشرات → المهام
const NAV_ITEMS = [
  { to: "/", label: "الرئيسية", icon: HomeRoundedIcon },
  { to: "/agenda", label: "الأجندة", icon: ListAltRoundedIcon },
  { to: "/kpis", label: "مؤشرات الابتكار", icon: InsightsRoundedIcon },
  { to: "/tasks", label: "متابعة المهام", icon: TaskAltRoundedIcon },
  { to: "/challenges", label: "التحديات والدعم المطلوب", icon: ReportProblemRoundedIcon },
  { to: "/minutes", label: "محضر الاجتماع", icon: FactCheckRoundedIcon },
  { to: "/files", label: "ملفات العرض", icon: FolderRoundedIcon },
  { to: "/org-chart", label: "الهيكل التنظيمي للإدارة", icon: AccountTreeRoundedIcon },
];

const ADMIN_NAV_ITEMS = [
  { to: "/admin/users", label: "إدارة المستخدمين", icon: ManageAccountsRoundedIcon },
  { to: "/admin/people", label: "إدارة الأشخاص", icon: GroupsRoundedIcon },
  { to: "/admin/content", label: "إدارة المحتوى", icon: TuneRoundedIcon },
];

const DGA_GRADIENT = `linear-gradient(90deg, ${DGA.green}, ${DGA.teal}, ${DGA.navyLight})`;

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function LiveClock() {
  const now = useNow();
  return (
    <Box sx={{ textAlign: "center", minWidth: 180, display: { xs: "none", sm: "block" } }}>
      <Typography variant="body2" sx={{ opacity: 0.85 }}>
        {now.format("dddd، D MMMM YYYY")}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
        {now.format("HH:mm:ss")}
      </Typography>
    </Box>
  );
}

function NavList({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const location = useLocation();

  function renderItem(item: { to: string; label: string; icon: typeof HomeRoundedIcon }) {
    const Icon = item.icon;
    const selected = location.pathname === item.to;
    const button = (
      <ListItemButton
        key={item.to}
        component={Link}
        to={item.to}
        selected={selected}
        sx={{
          mx: 1,
          my: 0.25,
          borderRadius: 2,
          justifyContent: collapsed ? "center" : "flex-start",
          "&.Mui-selected": {
            bgcolor: "primary.main",
            color: "#fff",
            "&:hover": { bgcolor: "primary.light" },
            "& .MuiListItemIcon-root": { color: "#fff" },
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: "center", color: "inherit" }}>
          <Icon fontSize="small" />
        </ListItemIcon>
        {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />}
      </ListItemButton>
    );
    return collapsed ? (
      <Tooltip key={item.to} title={item.label} placement="left">
        <Box>{button}</Box>
      </Tooltip>
    ) : (
      button
    );
  }

  return (
    <List sx={{ px: collapsed ? 0 : 0.5 }}>
      {NAV_ITEMS.map(renderItem)}
      {isAdmin(user?.role) && (
        <>
          <Divider sx={{ my: 1, mx: 2 }} />
          {ADMIN_NAV_ITEMS.map(renderItem)}
        </>
      )}
    </List>
  );
}

// Floating control pill shown only in presentation mode: section navigation,
// live clock, and exit. Keyboard: arrows navigate sections, Esc exits.
function PresentationControls({ onExit }: { onExit: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const now = useNow();

  const currentIndex = NAV_ITEMS.findIndex((i) => i.to === location.pathname);
  const current = currentIndex >= 0 ? NAV_ITEMS[currentIndex] : null;

  function goTo(offset: number) {
    const base = currentIndex >= 0 ? currentIndex : 0;
    const next = (base + offset + NAV_ITEMS.length) % NAV_ITEMS.length;
    navigate(NAV_ITEMS[next].to);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
      // RTL: "next section" reads to the left
      if (e.key === "ArrowLeft") goTo(1);
      if (e.key === "ArrowRight") goTo(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <Fade in>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: (t) => t.zIndex.modal + 1,
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderRadius: 99,
          bgcolor: "rgba(27, 22, 81, 0.94)",
          color: "#fff",
          backdropFilter: "blur(6px)",
          borderBottom: `3px solid ${DGA.teal}`,
        }}
      >
        <Tooltip title="القسم التالي">
          <IconButton size="small" sx={{ color: DGA.green }} onClick={() => goTo(1)} data-testid="present-next">
            <NavigateNextRoundedIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ textAlign: "center", minWidth: 180 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {current?.label ?? "عرض"} · {currentIndex >= 0 ? currentIndex + 1 : "-"}/{NAV_ITEMS.length}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85, fontVariantNumeric: "tabular-nums", color: DGA.iceBlue }}>
            {now.format("dddd D MMMM · HH:mm:ss")}
          </Typography>
        </Box>
        <Tooltip title="القسم السابق">
          <IconButton size="small" sx={{ color: DGA.green }} onClick={() => goTo(-1)} data-testid="present-prev">
            <NavigateBeforeRoundedIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.3)" }} />
        <Tooltip title="إنهاء وضع العرض (Esc)">
          <IconButton size="small" sx={{ color: "#fff" }} onClick={onExit} data-testid="present-exit">
            <CloseFullscreenRoundedIcon />
          </IconButton>
        </Tooltip>
      </Paper>
    </Fade>
  );
}

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const changePassword = useChangeMyPassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور الجديدتان غير متطابقتين");
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      { onSuccess: onClose, onError: (err) => setError(err instanceof ApiError ? err.message : "حدث خطأ") }
    );
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>تغيير كلمة المرور</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="كلمة المرور الحالية"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
          />
          <TextField
            label="كلمة المرور الجديدة"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            helperText="8 أحرف على الأقل"
          />
          <TextField
            label="تأكيد كلمة المرور الجديدة"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button variant="contained" onClick={submit} disabled={!currentPassword || newPassword.length < 8}>
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STATE_KEY) === "1");
  const [presenting, setPresenting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function enterPresentation() {
    setPresenting(true);
    document.documentElement.requestFullscreen?.().catch(() => {
      // fullscreen can be blocked; presentation layout still applies
    });
  }

  function exitPresentation() {
    setPresenting(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) setPresenting(false);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const drawerWidth = collapsed ? DRAWER_WIDTH_CLOSED : DRAWER_WIDTH_OPEN;

  if (presenting) {
    return (
      <PresentingContext.Provider value={true}>
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
          {/* DGA brand strip + department caption, deck-style */}
          <Box sx={{ height: 6, background: DGA_GRADIENT }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: { xs: 3, md: 6 },
              pt: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: DGA.navy, fontWeight: 700, opacity: 0.75 }}>
              {removeTatweel("هيئة الحكومة الرقمية · إدارة تخطيط الابتكار")}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: DGA.teal, fontWeight: 700 }}>
              {removeTatweel("الاجتماع الدوري 2026")}
            </Typography>
          </Box>
          <Box
            sx={{
              p: { xs: 3, md: 6 },
              pt: 2,
              pb: 14,
              zoom: 1.2,
              "& *": {
                wordBreak: "break-word",
                overflowWrap: "break-word",
                wordWrap: "break-word",
                hyphens: "auto",
                maxWidth: "100%",
                overflow: "hidden"
              }
            }}
          >
            {children}
          </Box>
          <PresentationControls onExit={exitPresentation} />
        </Box>
      </PresentingContext.Provider>
    );
  }

  return (
    <PresentingContext.Provider value={false}>
      <Box sx={{ display: "flex" }}>
        <AppBar
          position="fixed"
          sx={{
            zIndex: (t) => t.zIndex.drawer + 1,
            bgcolor: DGA.navy,
            borderBottom: `3px solid ${DGA.teal}`,
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {removeTatweel("الاجتماع الدوري - مكتب الابتكار الحكومي")}
            </Typography>
            <LiveClock />
            <Tooltip title="وضع العرض للاجتماع (بدون تعديل)">
              <Button
                color="inherit"
                variant="outlined"
                startIcon={<SlideshowRoundedIcon />}
                onClick={enterPresentation}
                data-testid="present-toggle"
                sx={{ borderColor: DGA.teal, "&:hover": { borderColor: DGA.green, bgcolor: "rgba(26,192,130,0.12)" } }}
              >
                <Box sx={{ display: { xs: "none", sm: "inline" } }}>وضع العرض</Box>
              </Button>
            </Tooltip>
            {user && (
              <>
                <Chip
                  avatar={
                    <Avatar sx={{ bgcolor: "rgba(255,255,255,0.25)" }}>
                      {user.fullName.trim().charAt(0)}
                    </Avatar>
                  }
                  label={`${user.fullName} · ${ROLE_LABELS_AR[user.role]}`}
                  sx={{ color: "#fff", bgcolor: DGA.teal, display: { xs: "none", md: "flex" } }}
                />
                <Tooltip title="تغيير كلمة المرور">
                  <IconButton color="inherit" onClick={() => setChangingPassword(true)}>
                    <LockResetRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="تسجيل الخروج">
                  <Button
                    color="inherit"
                    startIcon={<LogoutRoundedIcon />}
                    onClick={async () => {
                      await logout();
                      navigate("/login");
                    }}
                  >
                    <Box sx={{ display: { xs: "none", sm: "inline" } }}>تسجيل الخروج</Box>
                  </Button>
                </Tooltip>
              </>
            )}
          </Toolbar>
        </AppBar>
        {/* anchor="left" is intentional: MUI mirrors horizontal anchors under an RTL
            theme, so "left" renders visually on the right — matching the flex order.
            anchor="right" would paint the paper on the left, covering the content. */}
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            whiteSpace: "nowrap",
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              overflowX: "hidden",
              transition: (t) =>
                t.transitions.create("width", {
                  easing: t.transitions.easing.sharp,
                  duration: t.transitions.duration.enteringScreen,
                }),
            },
            transition: (t) =>
              t.transitions.create("width", {
                easing: t.transitions.easing.sharp,
                duration: t.transitions.duration.enteringScreen,
              }),
          }}
        >
          <Toolbar />
          <Box
            sx={{
              display: "flex",
              justifyContent: collapsed ? "center" : "flex-start",
              px: collapsed ? 0 : 1,
              py: 1,
            }}
          >
            <Tooltip title={collapsed ? "توسيع القائمة" : "طي القائمة"}>
              <IconButton onClick={toggleCollapsed} aria-label="sidebar-toggle" data-testid="sidebar-toggle">
                {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          <Divider />
          <NavList collapsed={collapsed} />
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
          <Toolbar />
          {children}
        </Box>
      </Box>
      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
    </PresentingContext.Provider>
  );
}
