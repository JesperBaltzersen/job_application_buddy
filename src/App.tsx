import { ConvexProvider, ConvexReactClient } from "convex/react";
import MainLayout from "./components/MainLayout";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App() {
  return (
    <ConvexProvider client={convex}>
      <MainLayout />
    </ConvexProvider>
  );
}

export default App;