import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function VerifyPage() {
  return <VerifyEmailForm />;
}
