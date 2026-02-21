export type AppUserRole = "user" | "champion" | "conductor" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  role: AppUserRole;
};
