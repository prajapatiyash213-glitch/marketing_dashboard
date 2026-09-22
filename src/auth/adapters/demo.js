/**
 * Browser-only authentication adapter with registration, persistence, and demo presets.
 * Supports local account registration, remember-me sessions, and password recovery.
 */

const SESSION_KEY = "dashboard.demo-session";
const REMEMBER_KEY = "dashboard.remembered-user";
const USERS_KEY = "dashboard.registered-users";

export const DEMO_PRESETS = [
  {
    name: "Yash Prajapati",
    email: "yash.prajapati@tecnoprism.com",
    password: "password123",
    company: "Tecnoprism",
    role: "Revenue Operations Lead",
    badge: "Admin",
  },
  {
    name: "Shashank Jha",
    email: "shashank.jha@tecnoprism.com",
    password: "password123",
    company: "Tecnoprism",
    role: "Marketing Director",
    badge: "Marketing",
  },
  {
    name: "Automation Specialist",
    email: "automation.lead@automationcoe.com",
    password: "password123",
    company: "Automation CoE",
    role: "Digital Growth Lead",
    badge: "Growth",
  },
  {
    name: "Demo Admin",
    email: "you@company.com",
    password: "demo1234",
    company: "OmniScope Global",
    role: "Executive Founder",
    badge: "Quick Demo",
  },
];

const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const custom = raw ? JSON.parse(raw) : [];
    return [...DEMO_PRESETS, ...custom];
  } catch {
    return DEMO_PRESETS;
  }
};

const saveCustomUser = (user) => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = existing.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase());
    updated.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  } catch {
    /* private browsing fallback */
  }
};

const validate = (email, password) => {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error("Please enter a valid work email address.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }
};

export const demoAuth = {
  mode: "demo",
  insecure: true,

  async restore() {
    try {
      const remembered = localStorage.getItem(REMEMBER_KEY);
      if (remembered) return JSON.parse(remembered);
      const session = sessionStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  },

  async signIn({ email, password, rememberMe = false }) {
    validate(email, password);
    const cleanEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

    let user;
    if (existing) {
      if (existing.password && existing.password !== password) {
        throw new Error("Incorrect password. Please verify your credentials or reset password.");
      }
      user = {
        email: existing.email,
        name: existing.name,
        company: existing.company || "OmniScope Enterprise",
        role: existing.role || "Marketing Lead",
      };
    } else {
      // In demo mode, permit any valid email if not registered
      user = {
        email: email.trim(),
        name: email.trim().split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        company: "OmniScope Team",
        role: "Analytics Member",
      };
    }

    try {
      const serial = JSON.stringify(user);
      sessionStorage.setItem(SESSION_KEY, serial);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, serial);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* private mode */
    }
    return user;
  },

  async signUp({ name, email, password, company, role, rememberMe = true }) {
    if (!name || name.trim().length < 2) {
      throw new Error("Please enter your full name.");
    }
    validate(email, password);

    const cleanEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const duplicate = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (duplicate && !DEMO_PRESETS.some((d) => d.email.toLowerCase() === cleanEmail)) {
      throw new Error("An account with this email address already exists. Please sign in instead.");
    }

    const newUser = {
      name: name.trim(),
      email: email.trim(),
      password,
      company: (company || "").trim() || "Independent Workspace",
      role: (role || "").trim() || "Marketing & Revenue Lead",
      createdAt: new Date().toISOString(),
    };

    saveCustomUser(newUser);

    const userProfile = {
      name: newUser.name,
      email: newUser.email,
      company: newUser.company,
      role: newUser.role,
    };

    try {
      const serial = JSON.stringify(userProfile);
      sessionStorage.setItem(SESSION_KEY, serial);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, serial);
      }
    } catch {
      /* private mode */
    }

    return userProfile;
  },

  async resetPassword({ email, newPassword }) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error("Please enter a valid email address.");
    }
    const cleanEmail = email.trim().toLowerCase();
    const targetPassword = newPassword || "demo1234";

    const users = getStoredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      saveCustomUser({ ...existing, password: targetPassword });
    }
    return { ok: true, email: cleanEmail, temporaryPassword: targetPassword };
  },

  async signOut() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* ignore */
    }
  },
};
