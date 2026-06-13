import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { HomeContent } from "./components/home-content";

export default function HomePage() {
  return (
    <PageContainer>
      <PageHeader title="My profile" description="Your customer portal account and linked banking data." />
      <HomeContent />
    </PageContainer>
  );
}
