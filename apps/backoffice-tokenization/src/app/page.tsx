import { HomeView } from "@/features/home/HomeView";
import { Header } from "@/components/shared/Header";

export default function Home() {
  return (
    <div className="container mx-auto">
      <Header />
      <HomeView />
    </div>
  );
}
