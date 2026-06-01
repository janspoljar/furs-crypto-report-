import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getUserSubscription, getUserTransactionCount } from "@/lib/subscription";
import UploadForm from "@/components/upload-form";

export default async function UploadPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const [subscription, txCount] = await Promise.all([
    getUserSubscription(user.id),
    getUserTransactionCount(user.id),
  ]);

  const isPro = subscription.plan === "pro" && subscription.isActive;

  return <UploadForm isPro={isPro} txCount={txCount} />;
}
