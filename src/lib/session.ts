import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireOwner() {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "OWNER") {
    redirect("/login/dueno");
  }
  return session;
}

export async function requireDoctor() {
  const session = await getSession();
  if (!session?.user || (session.user as { role?: string }).role !== "DOCTOR") {
    redirect("/login/doctor");
  }
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  return session;
}
