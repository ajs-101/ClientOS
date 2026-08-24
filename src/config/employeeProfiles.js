import { Mic, Globe, Mail, Code2, ShieldCheck, Eye } from "lucide-react";

export const PROFILES = {
  podcast: {
    id: "podcast",
    name: "Podcast",
    people: "Shakaib",
    password: "getitdone",
    icon: Mic,
    color: "#F97066",
  },
  website: {
    id: "website",
    name: "Website",
    people: "Saif & Sami",
    password: "thecreators",
    icon: Globe,
    color: "#38BDF8",
  },
  email: {
    id: "email",
    name: "Email Marketing",
    people: "Ali",
    password: "corethings",
    icon: Mail,
    color: "#FBBF24",
  },
  development: {
    id: "development",
    name: "Development",
    people: "Abdul Rehman",
    password: "automationguy",
    icon: Code2,
    color: "#A78BFA",
  },
  aeo: {
    id: "aeo",
    name: "AEO Systems and Visibility Coordinator",
    people: "AEO Team",
    password: "AEOPASSWORD123",
    icon: Eye,
    color: "#22C55E",
  },
  admin: {
    id: "admin",
    name: "Admin Overview",
    people: "AJS",
    password: "Deadman101!",
    icon: ShieldCheck,
    color: "#4FE8C4",
    isAdmin: true,
  },
};

export const PROFILE_LIST = Object.values(PROFILES).filter((p) => !p.isAdmin);
