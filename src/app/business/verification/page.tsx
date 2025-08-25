import BusinessVerificationForm from "@/components/BusinessVerificationForm";

export default function BusinessVerificationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Business Verification
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Submit verification documents to build trust with customers and
          reviewers
        </p>
      </div>

      <BusinessVerificationForm />
    </div>
  );
}
