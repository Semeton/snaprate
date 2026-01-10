import AcceptInvitationForm from "@/components/auth/AcceptInvitationForm";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AcceptInvitationPage() {
  return <AcceptInvitationForm />;
}
