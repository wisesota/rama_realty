import { LandingPage } from "@/components/landing-page";
import { LandingStoreProvider } from "@/components/providers/landing-store-provider";

export default function Home() {
  return (
    <LandingStoreProvider>
      <LandingPage />
    </LandingStoreProvider>
  );
}
