import React from "react";
import { safeGetSession } from "@/lib/safeGetSession";
import { redirect } from "next/navigation";
import PersonalAgentContainer from "@/components/personal-agent/PersonalAgentContainer";

export default async function PersonalAgentPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await safeGetSession();

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  // ✅ MUST await searchParams
  const params = await searchParams;

  const initialView =
    params?.view === "history" ? "history" : "landing";

  return (
    <PersonalAgentContainer
      userId={session.user.id}
      userImage={session.user.image}
      initialView={initialView}
    />
  );
}
