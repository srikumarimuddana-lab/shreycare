import type { Metadata } from "next";
import { CustomerDetail } from "./CustomerDetail";

export const metadata: Metadata = {
  title: "Customer — Admin",
  robots: { index: false, follow: false },
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email } = await params;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8">
      <CustomerDetail emailParam={email} />
    </div>
  );
}
