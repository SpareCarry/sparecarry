import { MainLayout } from "../../components/layout/main-layout";

export default function ShippingEstimatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
