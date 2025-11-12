import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// useRoleGuard
// Enforces that the current user's role is within allowedRoles.
// Redirects when unauthenticated or role not permitted.
export default function useRoleGuard(allowedRoles = [], options = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  const {
    redirectTo, // Preferred redirect target when blocked
  } = options;

  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken");
      const rawUser = localStorage.getItem("user");

      // If not authenticated, go to auth page
      if (!token || !rawUser) {
        navigate("/", { replace: true });
        setChecked(true);
        return;
      }

      const parsed = JSON.parse(rawUser);
      setUser(parsed);

      // Normalize role checks to be case-insensitive
      const role = String(parsed?.role || "").toLowerCase();
      const normalizedAllowed = (Array.isArray(allowedRoles) ? allowedRoles : [])
        .map(r => String(r || "").toLowerCase());
      const allowed = normalizedAllowed.length > 0
        ? normalizedAllowed.includes(role)
        : true; // If no roles provided, allow all

      setIsAllowed(!!allowed);
      setChecked(true);

      if (!allowed) {
        // Determine where to redirect when blocked
        const fallback = redirectTo
          ? redirectTo
          : role === "admin"
            ? "/users" // Admin area landing
            : "/dashboard"; // User area landing

        // Prevent redirect loops
        if (location.pathname !== fallback) {
          navigate(fallback, { replace: true });
        }
      }
    } catch (err) {
      // Any parsing errors => treat as unauthenticated
      navigate("/", { replace: true });
    }
    // Depend only on stable keys to avoid unnecessary reruns
  }, [navigate, location.pathname, redirectTo]);

  return { user, isAllowed, checked };
}