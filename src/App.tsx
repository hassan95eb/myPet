import { useEffect } from 'react';
import { PetPlaceholder } from './features/pet/components/PetPlaceholder';
import { positionWindowBottomRight } from './features/pet/utils/windowPosition';

export default function App() {
  useEffect(() => {
    // Run initial window positioning once on startup
    positionWindowBottomRight();
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden flex items-center justify-center bg-transparent">
      <PetPlaceholder />
    </main>
  );
}
