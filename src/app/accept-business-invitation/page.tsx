import AcceptBusinessInvitationForm from "@/components/auth/AcceptBusinessInvitationForm";

// Force dynamic rendering to prevent prerendering issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AcceptBusinessInvitationPage() {
  return <AcceptBusinessInvitationForm />;
}
